import { db } from '../../database/db';
import type {
  AuthorizationFilters,
  AuthorizationRow,
  PermissionRow,
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

export async function findAllPermissions(): Promise<PermissionRow[]> {
  const [rows] = await db.query<PermissionRow[]>(
    'SELECT id, code, name, module, description FROM permissions ORDER BY module, code',
  );
  return rows;
}

export async function updateRolePermissionsInDb(
  roleId: number,
  permissionCodes: string[],
): Promise<boolean> {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verify role exists
    const [roles] = await conn.query<AuthorizationRow[]>(
      'SELECT id FROM roles WHERE id = ?',
      [roleId],
    );
    if (!roles[0]) {
      await conn.rollback();
      return false;
    }

    // Delete existing permissions for role
    await conn.query('DELETE FROM role_permissions WHERE role_id = ?', [
      roleId,
    ]);

    // Insert new permissions if any
    if (permissionCodes.length > 0) {
      const [permissionRows] = await conn.query<PermissionRow[]>(
        'SELECT id, code FROM permissions WHERE code IN (?)',
        [permissionCodes],
      );

      if (permissionRows.length > 0) {
        const values = permissionRows.map((p) => [roleId, p.id]);
        await conn.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
          [values],
        );
      }
    }

    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
