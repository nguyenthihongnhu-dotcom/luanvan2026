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

export async function generateNotificationsFromAlerts(): Promise<{
  createdCount: number;
}> {
  const [result] = await db.query(`
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      reference_type,
      reference_id
    )
    SELECT
      COALESCE(a.assigned_to, wu.user_id, admin_users.id) AS user_id,
      CONCAT('ALERT_', a.alert_type),
      a.title,
      a.message,
      'ALERT',
      a.id
    FROM alerts a
    LEFT JOIN user_warehouses wu
      ON wu.warehouse_id = a.warehouse_id
      AND wu.is_primary = TRUE
    LEFT JOIN users admin_users
      ON admin_users.id = (
        SELECT u.id
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE r.code IN ('ADMIN', 'WAREHOUSE_MANAGER')
          AND u.status = 'ACTIVE'
          AND u.deleted_at IS NULL
        ORDER BY CASE WHEN r.code = 'ADMIN' THEN 0 ELSE 1 END, u.id
        LIMIT 1
      )
    WHERE a.status = 'OPEN'
      AND COALESCE(a.assigned_to, wu.user_id, admin_users.id) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM notifications n
        WHERE n.reference_type = 'ALERT'
          AND n.reference_id = a.id
          AND n.user_id = COALESCE(a.assigned_to, wu.user_id, admin_users.id)
      )
  `);

  return {
    createdCount: 'affectedRows' in result ? Number(result.affectedRows) : 0,
  };
}
