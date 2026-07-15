import { db } from '../../database/db';
import type {
  SuppliersFilters,
  SuppliersRow,
  QueryParams,
} from './suppliers.model';

const tableName = 'suppliers';

export async function findSuppliers(
  filters: SuppliersFilters,
): Promise<SuppliersRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push('name LIKE :search');
    params.search = `%${filters.search}%`;
  }

  if (filters.status) {
    where.push('status = :status');
    params.status = filters.status;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<SuppliersRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}
