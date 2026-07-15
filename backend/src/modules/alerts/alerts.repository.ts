import { db } from '../../database/db';
import type { AlertsFilters, AlertsRow, QueryParams } from './alerts.model';

const tableName = 'alerts';

export async function findAlerts(filters: AlertsFilters): Promise<AlertsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push('title LIKE :search');
    params.search = `%${filters.search}%`;
  }

  if (filters.status) {
    where.push('status = :status');
    params.status = filters.status;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<AlertsRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}
