import { db } from '../../database/db';
import type {
  AuthorizationFilters,
  AuthorizationRow,
  QueryParams,
} from './authorization.model';

export async function findAuthorization(
  filters: AuthorizationFilters,
): Promise<AuthorizationRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('r.id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push(
      '(r.code LIKE :search OR r.name LIKE :search OR p.code LIKE :search)',
    );
    params.search = `%${filters.search}%`;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<AuthorizationRow[]>({
    sql: `
      SELECT
        r.id,
        r.code,
        r.name,
        r.description,
        r.is_system,
        r.created_at,
        GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ',') AS permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      ${whereSql}
      GROUP BY r.id, r.code, r.name, r.description, r.is_system, r.created_at
      ORDER BY r.id
      LIMIT 100
    `,
    values: params,
  });

  return rows;
}
