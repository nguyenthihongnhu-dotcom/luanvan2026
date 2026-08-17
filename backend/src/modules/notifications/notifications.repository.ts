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
      r.user_id,
      CONCAT('ALERT_', a.alert_type),
      a.title,
      a.message,
      'ALERT',
      a.id
    FROM alerts a
    -- Một cảnh báo nay sinh một thông báo cho MỖI người liên quan, thay vì chỉ
    -- một người như trước (cảnh báo kho nào cũng dồn về một admin duy nhất).
    JOIN (
      -- 1. Người được gán đích danh xử lý cảnh báo.
      SELECT a1.id AS alert_id, a1.assigned_to AS user_id
      FROM alerts a1
      WHERE a1.assigned_to IS NOT NULL

      UNION

      -- 2. Mọi nhân viên đang phụ trách kho của cảnh báo đó.
      SELECT a2.id, uw.user_id
      FROM alerts a2
      JOIN user_warehouses uw ON uw.warehouse_id = a2.warehouse_id
      JOIN users u ON u.id = uw.user_id
      WHERE a2.assigned_to IS NULL
        AND u.status = 'ACTIVE'
        AND u.deleted_at IS NULL

      UNION

      -- 3. Quản trị và quản lý kho luôn nhận, kể cả khi kho đã có nhân viên phụ
      --    trách: họ là người chịu trách nhiệm cuối, mà trước đây gán kho cho một
      --    nhân viên xong là cảnh báo kho đó không còn tới tay ai ở cấp quản lý.
      SELECT a3.id, u2.id
      FROM alerts a3
      JOIN users u2 ON u2.status = 'ACTIVE' AND u2.deleted_at IS NULL
      JOIN roles r2 ON r2.id = u2.role_id
      WHERE a3.assigned_to IS NULL
        AND r2.code IN ('ADMIN', 'WAREHOUSE_MANAGER')
    ) r ON r.alert_id = a.id
    WHERE a.status = 'OPEN'
      AND r.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM notifications n
        WHERE n.reference_type = 'ALERT'
          AND n.reference_id = a.id
          AND n.user_id = r.user_id
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
