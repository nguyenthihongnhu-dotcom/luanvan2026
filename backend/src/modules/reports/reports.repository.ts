import { db } from '../../database/db';
import type { QueryParams, ReportsFilters, ReportsRow } from './reports.model';

function appendCommonFilters(
  filters: ReportsFilters,
  where: string[],
  params: QueryParams,
): void {
  if (filters.warehouseId) {
    where.push('warehouse_id = :warehouseId');
    params.warehouseId = filters.warehouseId;
  }

  if (filters.productVariantId) {
    where.push('product_variant_id = :productVariantId');
    params.productVariantId = filters.productVariantId;
  }
}

export async function findReports(
  filters: ReportsFilters,
): Promise<ReportsRow[]> {
  return findProductStockReport(filters);
}

export async function findProductStockReport(
  filters: ReportsFilters,
): Promise<ReportsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('product_variant_id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push(
      '(sku LIKE :search OR product_name LIKE :search OR variant_name LIKE :search)',
    );
    params.search = `%${filters.search}%`;
  }

  appendCommonFilters(filters, where, params);

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<ReportsRow[]>({
    sql: `SELECT * FROM vw_product_total_stock ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}

export async function findNearExpiryReport(
  filters: ReportsFilters,
): Promise<ReportsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.search) {
    where.push(
      '(sku LIKE :search OR product_name LIKE :search OR lot_number LIKE :search)',
    );
    params.search = `%${filters.search}%`;
  }

  appendCommonFilters(filters, where, params);

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<ReportsRow[]>({
    sql: `SELECT * FROM vw_near_expiry_stock ${whereSql} ORDER BY expiry_date ASC LIMIT 100`,
    values: params,
  });

  return rows;
}

export async function findInventoryMovementReport(
  filters: ReportsFilters,
): Promise<ReportsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  appendCommonFilters(filters, where, params);

  if (filters.dateFrom) {
    where.push('created_at >= :dateFrom');
    params.dateFrom = filters.dateFrom;
  }

  if (filters.dateTo) {
    where.push('created_at < DATE_ADD(:dateTo, INTERVAL 1 DAY)');
    params.dateTo = filters.dateTo;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<ReportsRow[]>({
    sql: `
      SELECT
        DATE(created_at) AS movement_date,
        warehouse_id,
        product_variant_id,
        transaction_type,
        COUNT(*) AS transaction_count,
        SUM(quantity) AS total_quantity
      FROM inventory_transactions
      ${whereSql}
      GROUP BY DATE(created_at), warehouse_id, product_variant_id, transaction_type
      ORDER BY movement_date DESC
      LIMIT 100
    `,
    values: params,
  });

  return rows;
}

export async function findInventoryTransactionReport(
  filters: ReportsFilters,
): Promise<ReportsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.search) {
    where.push(
      '(transaction_code LIKE :search OR reference_type LIKE :search)',
    );
    params.search = `%${filters.search}%`;
  }

  appendCommonFilters(filters, where, params);

  if (filters.dateFrom) {
    where.push('created_at >= :dateFrom');
    params.dateFrom = filters.dateFrom;
  }

  if (filters.dateTo) {
    where.push('created_at < DATE_ADD(:dateTo, INTERVAL 1 DAY)');
    params.dateTo = filters.dateTo;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<ReportsRow[]>({
    sql: `SELECT * FROM inventory_transactions ${whereSql} ORDER BY created_at DESC LIMIT 100`,
    values: params,
  });

  return rows;
}
