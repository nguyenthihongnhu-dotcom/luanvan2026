import {
  UNRESTRICTED_SCOPE,
  isWarehouseInScope,
  warehouseScopeWhere,
} from '../../common/access/warehouse-scope';
import { db } from '../../database/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type {
  AllocationStrategy,
  CurrentStockRow,
  NearExpiryStockRow,
  QuickReceiveInput,
  QuickReceiveResult,
  QueryParams,
  StockAllocationCandidateRow,
  StockAllocationInput,
  StockFilters,
} from './stock.model';

type QuickProductRow = RowDataPacket & {
  id: number;
  sku: string;
  variant_name: string;
  product_name: string;
  requires_lot_tracking: 0 | 1;
  requires_expiry_tracking: 0 | 1;
};

type QuickLocationRow = RowDataPacket & {
  id: number;
  code: string;
  warehouse_id: number;
  warehouse_code: string;
};

type QuickIdRow = RowDataPacket & { id: number };
type QuickQuantityRow = RowDataPacket & { quantity: string | number | null };

function normalizeScanValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const parsed = JSON.parse(trimmed) as {
      sku?: unknown;
      id?: unknown;
      code?: unknown;
    };
    const candidate = parsed.sku ?? parsed.code ?? parsed.id;
    if (
      typeof candidate === 'string' ||
      typeof candidate === 'number' ||
      typeof candidate === 'boolean'
    ) {
      return String(candidate).trim();
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

function makeTransactionCode(): string {
  return `QRN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
function allocationOrderBy(strategy: AllocationStrategy): string {
  if (strategy === 'FEFO') {
    return `
      CASE WHEN pb.expiry_date IS NULL THEN 1 ELSE 0 END,
      pb.expiry_date ASC,
      pb.received_date ASC,
      pb.id ASC,
      wl.code ASC
    `;
  }

  return `
    CASE WHEN pb.received_date IS NULL THEN 1 ELSE 0 END,
    pb.received_date ASC,
    pb.id ASC,
    wl.code ASC
  `;
}

export async function findCurrentStock(
  filters: StockFilters,
): Promise<CurrentStockRow[]> {
  const where: string[] = ['quantity > 0'];
  const params: QueryParams = {};

  if (filters.warehouseId) {
    where.push('warehouse_id = :warehouseId');
    params.warehouseId = filters.warehouseId;
  }

  if (filters.productVariantId) {
    where.push('product_variant_id = :productVariantId');
    params.productVariantId = filters.productVariantId;
  }

  const scopeWhere = warehouseScopeWhere(
    filters.warehouseScope ?? UNRESTRICTED_SCOPE,
    'warehouse_id',
    params,
  );
  if (scopeWhere) where.push(scopeWhere);

  const [rows] = await db.query<CurrentStockRow[]>({
    sql: `
      SELECT *
      FROM vw_current_stock
      WHERE ${where.join(' AND ')}
      ORDER BY warehouse_code, sku, expiry_date, location_code
    `,
    values: params,
  });

  return rows;
}

export async function findNearExpiryStock(
  filters: Pick<StockFilters, 'warehouseId' | 'warehouseScope'>,
): Promise<NearExpiryStockRow[]> {
  const where: string[] = ['quantity > 0'];
  const params: QueryParams = {};

  if (filters.warehouseId) {
    where.push('warehouse_id = :warehouseId');
    params.warehouseId = filters.warehouseId;
  }

  const scopeWhere = warehouseScopeWhere(
    filters.warehouseScope ?? UNRESTRICTED_SCOPE,
    'warehouse_id',
    params,
  );
  if (scopeWhere) where.push(scopeWhere);

  const [rows] = await db.query<NearExpiryStockRow[]>({
    sql: `
      SELECT *
      FROM vw_near_expiry_stock
      WHERE ${where.join(' AND ')}
      ORDER BY days_until_expiry, warehouse_code, sku
    `,
    values: params,
  });

  return rows;
}

export async function findStockAllocationCandidates(
  input: StockAllocationInput,
): Promise<StockAllocationCandidateRow[]> {
  const [rows] = await db.query<StockAllocationCandidateRow[]>({
    sql: `
      SELECT
        sl.id AS stock_location_id,
        sl.product_variant_id,
        sl.location_id,
        wl.code AS location_code,
        sl.batch_id,
        pb.lot_number,
        pb.manufacture_date,
        pb.expiry_date,
        pb.received_date,
        sl.available_quantity,
        pv.requires_lot_tracking,
        pv.requires_expiry_tracking
      FROM stock_locations sl
      JOIN product_variants pv ON pv.id = sl.product_variant_id
      JOIN warehouse_locations wl ON wl.id = sl.location_id
      JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
      JOIN warehouse_zones wz ON wz.id = ws.zone_id
      LEFT JOIN product_batches pb ON pb.id = sl.batch_id
      WHERE wz.warehouse_id = :warehouseId
        AND sl.product_variant_id = :productVariantId
        AND sl.available_quantity > 0
        AND (pb.status IS NULL OR pb.status NOT IN ('EXPIRED', 'BLOCKED', 'DEPLETED'))
        AND (pb.expiry_date IS NULL OR pb.expiry_date >= CURRENT_DATE)
      ORDER BY ${allocationOrderBy(input.strategy)}
    `,
    values: {
      warehouseId: input.warehouseId,
      productVariantId: input.productVariantId,
    } satisfies QueryParams,
  });

  return rows;
}

export async function quickReceiveStock(
  input: QuickReceiveInput,
): Promise<QuickReceiveResult> {
  const productScan = normalizeScanValue(input.productScan);
  const locationScan = normalizeScanValue(input.locationScan);
  const quantity = Number(input.quantity);

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [productRows] = await connection.query<QuickProductRow[]>(
      `
        SELECT pv.id, pv.sku, pv.variant_name, p.name AS product_name,
               pv.requires_lot_tracking, pv.requires_expiry_tracking
        FROM product_variants pv
        JOIN products p ON p.id = pv.product_id
        WHERE pv.deleted_at IS NULL
          AND pv.status = 'ACTIVE'
          AND (pv.sku = ? OR pv.barcode = ? OR pv.id = ?)
        LIMIT 1
        FOR UPDATE
      `,
      [productScan, productScan, Number(productScan) || 0],
    );
    const product = productRows[0];

    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    const [locationRows] = await connection.query<QuickLocationRow[]>(
      `
        SELECT wl.id, wl.code, wz.warehouse_id, w.code AS warehouse_code
        FROM warehouse_locations wl
        JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
        JOIN warehouse_zones wz ON wz.id = ws.zone_id
        JOIN warehouses w ON w.id = wz.warehouse_id
        WHERE wl.deleted_at IS NULL
          AND wl.status = 'ACTIVE'
          AND (wl.code = ? OR wl.qr_code_value = ? OR wl.id = ?)
        LIMIT 1
        FOR UPDATE
      `,
      [locationScan, locationScan, Number(locationScan) || 0],
    );
    const location = locationRows[0];

    if (!location) {
      throw new Error('LOCATION_NOT_FOUND');
    }

    // Kiểm phạm vi ngay tại đây, trong cùng giao dịch: biết ô thuộc kho nào rồi
    // nhưng chưa ghi gì, nên ném lỗi là rollback sạch. Kiểm sau khi ghi thì hàng
    // đã vào tồn kho người ta rồi mới báo lỗi.
    if (
      input.warehouseScope &&
      !isWarehouseInScope(input.warehouseScope, location.warehouse_id)
    ) {
      throw new Error('WAREHOUSE_OUT_OF_SCOPE');
    }

    const [userRows] = await connection.query<QuickIdRow[]>(
      `SELECT id FROM users WHERE status = 'ACTIVE' AND deleted_at IS NULL ORDER BY id LIMIT 1`,
    );
    const performedBy = userRows[0]?.id;

    if (!performedBy) {
      throw new Error('PERFORMED_BY_NOT_FOUND');
    }

    // Nhận nhanh phải theo đúng luật lô/hạn như xác nhận phiếu nhập, nếu không sẽ
    // sinh ra tồn không gắn lô cho hàng bắt buộc theo lô — FEFO và cảnh báo cận hạn
    // không lần được. Sản phẩm cần lô thì tự sinh số lô; cần hạn thì bắt buộc khai.
    if (product.requires_expiry_tracking === 1 && !input.expiryDate) {
      throw new Error('EXPIRY_DATE_REQUIRED');
    }

    let batchId: number | null = null;
    let finalLotNumber: string | null = null;
    const shouldUseBatch = Boolean(
      product.requires_lot_tracking === 1 ||
      product.requires_expiry_tracking === 1 ||
      input.lotNumber ||
      input.expiryDate,
    );

    if (shouldUseBatch) {
      const lotNumber =
        input.lotNumber?.trim() || `LOT-${product.sku}-${Date.now()}`;
      const [existingBatchRows] = await connection.query<QuickIdRow[]>(
        `SELECT id FROM product_batches WHERE product_variant_id = ? AND lot_number = ? LIMIT 1 FOR UPDATE`,
        [product.id, lotNumber],
      );

      if (existingBatchRows[0]) {
        batchId = existingBatchRows[0].id;
        await connection.query(
          `UPDATE product_batches SET expiry_date = COALESCE(?, expiry_date), received_date = COALESCE(received_date, CURRENT_DATE), status = 'ACTIVE' WHERE id = ?`,
          [input.expiryDate ?? null, batchId],
        );
      } else {
        const [batchResult] = await connection.query<ResultSetHeader>(
          `INSERT INTO product_batches (product_variant_id, lot_number, expiry_date, received_date, status) VALUES (?, ?, ?, CURRENT_DATE, 'ACTIVE')`,
          [product.id, lotNumber, input.expiryDate ?? null],
        );
        batchId = batchResult.insertId;
      }

      finalLotNumber = lotNumber;
    }

    const [beforeRows] = await connection.query<QuickQuantityRow[]>(
      `SELECT COALESCE(SUM(quantity), 0) AS quantity FROM stock_locations WHERE product_variant_id = ? AND location_id = ? FOR UPDATE`,
      [product.id, location.id],
    );
    const quantityBefore = Number(beforeRows[0]?.quantity ?? 0);

    await connection.query(
      `
        INSERT INTO stock_locations (product_variant_id, location_id, batch_id, quantity, reserved_quantity)
        VALUES (?, ?, ?, ?, 0)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), version = version + 1
      `,
      [product.id, location.id, batchId, quantity],
    );

    const quantityAfter = quantityBefore + quantity;
    const transactionCode = makeTransactionCode();
    const [transactionResult] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO inventory_transactions (
          transaction_code,
          transaction_type,
          warehouse_id,
          product_variant_id,
          batch_id,
          source_location_id,
          destination_location_id,
          quantity,
          quantity_before,
          quantity_after,
          reference_type,
          reference_id,
          reason_code,
          note,
          performed_by
        )
        VALUES (?, 'RECEIPT', ?, ?, ?, NULL, ?, ?, ?, ?, 'QUICK_RECEIVE', NULL, 'QR_RECEIVE', ?, ?)
      `,
      [
        transactionCode,
        location.warehouse_id,
        product.id,
        batchId,
        location.id,
        quantity,
        quantityBefore,
        quantityAfter,
        input.note ?? null,
        performedBy,
      ],
    );

    await connection.commit();

    return {
      transactionId: transactionResult.insertId,
      transactionCode,
      productVariantId: product.id,
      sku: product.sku,
      productName: product.product_name,
      variantName: product.variant_name,
      locationId: location.id,
      locationCode: location.code,
      warehouseId: location.warehouse_id,
      warehouseCode: location.warehouse_code,
      quantity,
      quantityBefore,
      quantityAfter,
      batchId,
      lotNumber: finalLotNumber,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
