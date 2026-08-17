import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../../database/db';
import type {
  NotificationsFilters,
  NotificationMutationResult,
  NotificationsRow,
  QueryParams,
} from './notifications.model';

const tableName = 'notifications';

export async function findNotifications(
  filters: NotificationsFilters,
): Promise<NotificationsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.userId) {
    where.push('user_id = :userId');
    params.userId = filters.userId;
  }

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
    sql: `SELECT * FROM ${tableName} ${whereSql} ORDER BY created_at DESC, id DESC LIMIT 100`,
    values: params,
  });

  return rows;
}

export async function generateNotificationsFromAlerts(): Promise<{
  createdCount: number;
  createdNotifications: NotificationsRow[];
}> {
  // Chốt mốc id trước khi chèn: sau đó chỉ cần lấy các dòng có id lớn hơn mốc là
  // ra đúng những thông báo vừa sinh. Cách cũ (lấy N dòng id lớn nhất) sai khi có
  // hai luồng chạy gần nhau — hàm này nay được gọi sau mỗi lần xác nhận chứng từ
  // chứ không chỉ khi bấm nút, nên hai người thao tác cùng lúc là chuyện thường:
  // luồng này sẽ bốc nhầm dòng của luồng kia và bỏ sót thông báo của chính mình.
  const [maxRows] = await db.query<
    Array<RowDataPacket & { last_id: number | null }>
  >('SELECT MAX(id) AS last_id FROM notifications');
  const lastNotificationId = Number(maxRows[0]?.last_id ?? 0);

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

  const createdCount =
    'affectedRows' in result ? Number(result.affectedRows) : 0;
  let createdNotifications: NotificationsRow[] = [];

  if (createdCount > 0) {
    const [rows] = await db.query<NotificationsRow[]>({
      sql: `
        SELECT *
        FROM notifications
        WHERE id > :lastNotificationId
          AND reference_type = 'ALERT'
        ORDER BY id
      `,
      values: { lastNotificationId },
    });
    createdNotifications = rows;
  }

  return {
    createdCount,
    createdNotifications,
  };
}

export async function markNotificationReadRepository(
  notificationId: number,
  userId: number,
): Promise<NotificationMutationResult> {
  const [result] = await db.query<ResultSetHeader>({
    sql: `
      UPDATE notifications
      SET is_read = TRUE,
          read_at = CURRENT_TIMESTAMP(3)
      WHERE id = :notificationId
        AND user_id = :userId
        AND is_read = FALSE
    `,
    values: { notificationId, userId } satisfies QueryParams,
  });

  return { affectedRows: result.affectedRows };
}

export async function markAllNotificationsReadRepository(
  userId: number,
): Promise<NotificationMutationResult> {
  const [result] = await db.query<ResultSetHeader>({
    sql: `
      UPDATE notifications
      SET is_read = TRUE,
          read_at = CURRENT_TIMESTAMP(3)
      WHERE user_id = :userId
        AND is_read = FALSE
    `,
    values: { userId } satisfies QueryParams,
  });

  return { affectedRows: result.affectedRows };
}
