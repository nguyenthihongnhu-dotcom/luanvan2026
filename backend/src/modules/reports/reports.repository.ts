import { db } from '../../database/db';
import type { ReportsFilters, ReportsRow, QueryParams } from './reports.model';

const tableName = 'vw_product_total_stock';

export async function findReports(
  filters: ReportsFilters,
): Promise<ReportsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('product_variant_id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push('sku LIKE :search');
    params.search = `%${filters.search}%`;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<ReportsRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}
