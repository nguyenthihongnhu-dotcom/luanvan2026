import { db } from '../../database/db';
import type {
  StockCountsFilters,
  StockCountsRow,
  QueryParams,
} from './stock-counts.model';

const tableName = 'stock_counts';

export async function findStockCounts(
  filters: StockCountsFilters,
): Promise<StockCountsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push('count_code LIKE :search');
    params.search = `%${filters.search}%`;
  }

  if (filters.status) {
    where.push('status = :status');
    params.status = filters.status;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<StockCountsRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}
