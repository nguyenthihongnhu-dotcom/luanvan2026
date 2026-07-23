import type { ResultSetHeader } from 'mysql2';
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

export async function generateInventoryAlerts(): Promise<{
  createdCount: number;
}> {
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
    WHERE v.min_stock_level > 0
      AND v.total_available_quantity <= v.min_stock_level
      AND NOT EXISTS (
        SELECT 1
        FROM alerts a
        WHERE a.status = 'OPEN'
          AND a.alert_type IN ('LOW_STOCK', 'OUT_OF_STOCK')
          AND a.warehouse_id = v.warehouse_id
          AND a.product_variant_id = v.product_variant_id
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
    createdCount: lowStockCount + overMaxCount + nearExpiryCount,
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
