import type { ResultSetHeader } from 'mysql2';
import { warehouseScopeWhere } from '../../common/access/warehouse-scope';
import { db } from '../../database/db';
import type {
  AlertMutationResult,
  AlertsFilters,
  AlertsRow,
  QueryParams,
} from './alerts.model';

const tableName = 'alerts';

export async function findAlerts(filters: AlertsFilters): Promise<AlertsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push('title LIKE :search');
    params.search = `%${filters.search}%`;
  }

  if (filters.status) {
    where.push('status = :status');
    params.status = filters.status;
  }

  if (filters.warehouseScope) {
    // Cảnh báo không gắn kho (SKU chưa nhập kho nào) là chuyện toàn hệ thống nên
    // vẫn hiện cho mọi người, chứ không rơi vào khoảng trống không ai thấy.
    const scopeWhere = warehouseScopeWhere(
      filters.warehouseScope,
      'warehouse_id',
      params,
      { includeNull: true },
    );
    if (scopeWhere) where.push(scopeWhere);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<AlertsRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}

async function insertOpenAlerts(sql: string): Promise<number> {
  const [result] = await db.query(sql);
  return 'affectedRows' in result ? Number(result.affectedRows) : 0;
}

/**
 * Đóng các cảnh báo tồn kho không còn đúng nữa. Không có bước này thì cảnh báo chỉ
 * sinh ra chứ không bao giờ mất: hàng đã nhập về đủ mà màn cảnh báo vẫn đỏ, và
 * NOT EXISTS lúc sinh lại coi như đã có cảnh báo nên không tạo cái mới khi tình
 * trạng tái diễn.
 *
 * Chỉ đụng tới cảnh báo do hệ thống tự sinh theo tồn kho, và chỉ những cảnh báo
 * chưa ai xử lý (OPEN/READ); cảnh báo người dùng đã đánh dấu RESOLVED thì để yên.
 */
async function resolveOutdatedAlerts(): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(`
    UPDATE alerts a
    LEFT JOIN vw_product_total_stock v
      ON v.warehouse_id = a.warehouse_id
      AND v.product_variant_id = a.product_variant_id
    SET a.status = 'RESOLVED',
        a.resolved_at = CURRENT_TIMESTAMP(3)
    WHERE a.status IN ('OPEN', 'READ')
      AND (
        -- Tồn đã vượt ngưỡng tối thiểu trở lại.
        (
          a.alert_type IN ('LOW_STOCK', 'OUT_OF_STOCK')
          AND a.warehouse_id IS NOT NULL
          AND v.total_available_quantity IS NOT NULL
          AND v.total_available_quantity > 0
          AND (
            v.min_stock_level <= 0
            OR v.total_available_quantity > v.min_stock_level
          )
        )
        -- Cảnh báo mức toàn hệ thống: SKU đã có tồn ở đâu đó.
        OR (
          a.alert_type = 'OUT_OF_STOCK'
          AND a.warehouse_id IS NULL
          AND EXISTS (
            SELECT 1
            FROM stock_locations sl
            WHERE sl.product_variant_id = a.product_variant_id
              AND sl.quantity > 0
          )
        )
        -- Tồn đã rút xuống dưới trần.
        OR (
          a.alert_type = 'OVER_MAX_STOCK'
          AND (
            v.total_available_quantity IS NULL
            OR v.max_stock_level IS NULL
            OR v.total_available_quantity <= v.max_stock_level
          )
        )
        -- Lô gần hết hạn đã xuất hết hoặc không còn nằm trong danh sách cận hạn.
        OR (
          a.alert_type = 'NEAR_EXPIRY'
          AND NOT EXISTS (
            SELECT 1
            FROM vw_near_expiry_stock n
            WHERE n.warehouse_id = a.warehouse_id
              AND n.product_variant_id = a.product_variant_id
              AND n.batch_id = a.batch_id
              AND n.quantity > 0
          )
        )
      )
  `);

  return result.affectedRows;
}

export async function generateInventoryAlerts(): Promise<{
  createdCount: number;
  resolvedCount: number;
}> {
  // Dọn cảnh báo cũ trước khi sinh cảnh báo mới: nếu làm ngược, điều kiện NOT
  // EXISTS sẽ thấy cảnh báo cũ vẫn OPEN và bỏ qua tình trạng đang tái diễn.
  const resolvedCount = await resolveOutdatedAlerts();
  const lowStockCount = await insertOpenAlerts(`
    INSERT INTO alerts (
      alert_type,
      severity,
      warehouse_id,
      product_variant_id,
      title,
      message
    )
    SELECT
      CASE
        WHEN total_available_quantity <= 0 THEN 'OUT_OF_STOCK'
        ELSE 'LOW_STOCK'
      END,
      CASE
        WHEN total_available_quantity <= 0 THEN 'CRITICAL'
        ELSE 'WARNING'
      END,
      warehouse_id,
      product_variant_id,
      CASE
        WHEN total_available_quantity <= 0 THEN CONCAT('Out of stock: ', sku)
        ELSE CONCAT('Low stock: ', sku)
      END,
      CONCAT(product_name, ' / ', variant_name, ' available ', total_available_quantity, ', minimum ', min_stock_level)
    FROM vw_product_total_stock v
    -- Hết sạch hàng thì luôn phải báo, kể cả SKU để tồn tối thiểu bằng 0. Trước đây
    -- điều kiện min_stock_level > 0 nuốt luôn nhóm này: hàng về 0 mà màn cảnh báo
    -- vẫn im. Còn cảnh báo tồn thấp thì vẫn cần có ngưỡng mới so sánh được.
    WHERE (
        v.total_available_quantity <= 0
        OR (
          v.min_stock_level > 0
          AND v.total_available_quantity <= v.min_stock_level
        )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM alerts a
        WHERE a.status = 'OPEN'
          AND a.alert_type IN ('LOW_STOCK', 'OUT_OF_STOCK')
          AND a.warehouse_id = v.warehouse_id
          AND a.product_variant_id = v.product_variant_id
      )
  `);

  // vw_product_total_stock dựng từ stock_locations, nên SKU chưa từng nhập kho
  // lần nào sẽ không có dòng nào trong view và câu trên không thấy để cảnh báo.
  // Nhóm này chỉ cảnh báo được ở mức toàn hệ thống (warehouse_id NULL): SKU không
  // thuộc về kho cụ thể nào cả thì không thể nói nó hết hàng ở kho nào.
  const neverStockedCount = await insertOpenAlerts(`
    INSERT INTO alerts (
      alert_type,
      severity,
      warehouse_id,
      product_variant_id,
      title,
      message
    )
    SELECT
      'OUT_OF_STOCK',
      'CRITICAL',
      NULL,
      pv.id,
      CONCAT('Out of stock: ', pv.sku),
      CONCAT(p.name, ' / ', pv.variant_name, ' chưa có tồn ở bất kỳ kho nào')
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.status = 'ACTIVE'
      AND pv.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM stock_locations sl
        WHERE sl.product_variant_id = pv.id
          AND sl.quantity > 0
      )
      -- Chặn theo SKU chứ không theo kho: câu ở trên có thể đã báo hết hàng cho
      -- chính SKU này ở một kho cụ thể, báo thêm lần nữa là thừa.
      AND NOT EXISTS (
        SELECT 1
        FROM alerts a
        WHERE a.status = 'OPEN'
          AND a.alert_type IN ('LOW_STOCK', 'OUT_OF_STOCK')
          AND a.product_variant_id = pv.id
      )
  `);

  const overMaxCount = await insertOpenAlerts(`
    INSERT INTO alerts (
      alert_type,
      severity,
      warehouse_id,
      product_variant_id,
      title,
      message
    )
    SELECT
      'OVER_MAX_STOCK',
      'INFO',
      warehouse_id,
      product_variant_id,
      CONCAT('Over max stock: ', sku),
      CONCAT(product_name, ' / ', variant_name, ' available ', total_available_quantity, ', maximum ', max_stock_level)
    FROM vw_product_total_stock v
    WHERE v.max_stock_level IS NOT NULL
      AND v.total_available_quantity > v.max_stock_level
      AND NOT EXISTS (
        SELECT 1
        FROM alerts a
        WHERE a.status = 'OPEN'
          AND a.alert_type = 'OVER_MAX_STOCK'
          AND a.warehouse_id = v.warehouse_id
          AND a.product_variant_id = v.product_variant_id
      )
  `);

  const nearExpiryCount = await insertOpenAlerts(`
    INSERT INTO alerts (
      alert_type,
      severity,
      warehouse_id,
      product_variant_id,
      batch_id,
      title,
      message
    )
    SELECT
      'NEAR_EXPIRY',
      CASE WHEN days_until_expiry <= 7 THEN 'CRITICAL' ELSE 'WARNING' END,
      warehouse_id,
      product_variant_id,
      batch_id,
      CONCAT('Near expiry: ', sku, ' lot ', lot_number),
      CONCAT(product_name, ' lot ', lot_number, ' expires in ', days_until_expiry, ' days at ', location_code)
    FROM vw_near_expiry_stock v
    WHERE NOT EXISTS (
      SELECT 1
      FROM alerts a
      WHERE a.status = 'OPEN'
        AND a.alert_type = 'NEAR_EXPIRY'
        AND a.warehouse_id = v.warehouse_id
        AND a.product_variant_id = v.product_variant_id
        AND a.batch_id = v.batch_id
    )
  `);

  return {
    createdCount:
      lowStockCount + neverStockedCount + overMaxCount + nearExpiryCount,
    resolvedCount,
  };
}

export async function resolveAlertRepository(
  alertId: number,
  resolvedBy: number,
): Promise<AlertMutationResult> {
  const [result] = await db.query<ResultSetHeader>({
    sql: `
      UPDATE alerts
      SET status = 'RESOLVED',
          resolved_by = :resolvedBy,
          resolved_at = CURRENT_TIMESTAMP(3)
      WHERE id = :alertId
        AND status <> 'RESOLVED'
    `,
    values: { alertId, resolvedBy } satisfies QueryParams,
  });

  return { affectedRows: result.affectedRows };
}

export async function markAlertReadRepository(
  alertId: number,
): Promise<AlertMutationResult> {
  const [result] = await db.query<ResultSetHeader>({
    sql: `
      UPDATE alerts
      SET status = 'READ'
      WHERE id = :alertId
        AND status = 'OPEN'
    `,
    values: { alertId } satisfies QueryParams,
  });

  return { affectedRows: result.affectedRows };
}
