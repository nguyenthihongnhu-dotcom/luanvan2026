import { db } from '../../database/db';
import type {
  AuthorizationFilters,
  AuthorizationRow,
  QueryParams,
} from './authorization.model';

const tableName = 'roles';

export async function findAuthorization(
  filters: AuthorizationFilters,
): Promise<AuthorizationRow[]> {
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

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<AuthorizationRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}
