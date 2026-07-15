import { db } from '../../database/db';
import type {
  AllocationStrategy,
  CurrentStockRow,
  NearExpiryStockRow,
  QueryParams,
  StockAllocationCandidateRow,
  StockAllocationInput,
  StockFilters,
} from './stock.model';

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
  filters: Pick<StockFilters, 'warehouseId'>,
): Promise<NearExpiryStockRow[]> {
  const where: string[] = ['quantity > 0'];
  const params: QueryParams = {};

  if (filters.warehouseId) {
    where.push('warehouse_id = :warehouseId');
    params.warehouseId = filters.warehouseId;
  }

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
