import { db } from '../../database/db';
import type {
  WarehousesFilters,
  WarehousesRow,
  QueryParams,
} from './warehouses.model';

const tableName = 'warehouses';

export async function findWarehouses(
  filters: WarehousesFilters,
): Promise<WarehousesRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push('code LIKE :search');
    params.search = `%${filters.search}%`;
  }

  if (filters.status) {
    where.push('status = :status');
    params.status = filters.status;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<WarehousesRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}
