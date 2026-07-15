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
    where.push('action LIKE :search');
    params.search = `%${filters.search}%`;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<AuditLogsRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}
