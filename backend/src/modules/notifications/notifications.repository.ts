import { db } from '../../database/db';
import type {
  NotificationsFilters,
  NotificationsRow,
  QueryParams,
} from './notifications.model';

const tableName = 'notifications';

export async function findNotifications(
  filters: NotificationsFilters,
): Promise<NotificationsRow[]> {
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

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<NotificationsRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}
