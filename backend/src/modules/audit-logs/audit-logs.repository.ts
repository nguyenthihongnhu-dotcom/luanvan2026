import { db } from '../../database/db';
import type {
  AuditLogsFilters,
  AuditLogsRow,
  QueryParams,
} from './audit-logs.model';

const tableName = 'audit_logs';

export async function findAuditLogs(
  filters: AuditLogsFilters,
): Promise<AuditLogsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push(
      '(al.action LIKE :search OR al.module LIKE :search OR al.entity LIKE :search OR u.full_name LIKE :search)',
    );
    params.search = `%${filters.search}%`;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<AuditLogsRow[]>({
    sql: `
      SELECT
        al.*,
        u.full_name AS user_full_name,
        u.email AS user_email
      FROM ${tableName} al
      LEFT JOIN users u ON u.id = al.user_id
      ${whereSql}
      ORDER BY al.id DESC
      LIMIT 100
    `,
    values: params,
  });

  return rows;
}
