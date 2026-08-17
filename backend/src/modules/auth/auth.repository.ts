import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';
import { insertAuditLog } from '../../common/audit/audit.repository';
import { db } from '../../database/db';
import type {
  AuthUserRow,
  LoginUserRow,
  PasswordResetRequestListRow,
  PasswordResetRequestRow,
  PasswordResetRequestsFilters,
  SessionRow,
  UserListRow,
  UpdateUserInput,
} from './auth.model';

type PasswordResetUserRow = RowDataPacket & { id: number };

export async function findActiveAuthUserById(
  userId: string,
): Promise<AuthUserRow | undefined> {
  const [rows] = await db.query<AuthUserRow[]>({
    sql: `
      SELECT
        u.id,
        u.full_name,
        u.status,
        r.code AS role_code,
        GROUP_CONCAT(DISTINCT p.code ORDER BY p.code) AS permissions
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      WHERE u.id = :userId
        AND u.deleted_at IS NULL
        AND u.status = 'ACTIVE'
      GROUP BY u.id, u.full_name, u.status, r.code
      LIMIT 1
    `,
    values: { userId },
  });

  return rows[0];
}

export async function findLoginUserByEmail(
  email: string,
): Promise<LoginUserRow | undefined> {
  const [rows] = await db.query<LoginUserRow[]>({
    sql: `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.password_hash,
        u.status,
        u.failed_login_attempts,
        u.locked_until,
        r.code AS role_code,
        GROUP_CONCAT(DISTINCT p.code ORDER BY p.code) AS permissions
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      WHERE u.email = :email
        AND u.deleted_at IS NULL
      GROUP BY
        u.id,
        u.email,
        u.full_name,
        u.password_hash,
        u.status,
        u.failed_login_attempts,
        u.locked_until,
        r.code
      LIMIT 1
    `,
    values: { email },
  });

  return rows[0];
}

export async function markLoginSuccess(userId: string): Promise<void> {
  await db.query(
    `
      UPDATE users
      SET
        last_login_at = CURRENT_TIMESTAMP(3),
        failed_login_attempts = 0,
        locked_until = NULL
      WHERE id = ?
    `,
    [userId],
  );
}

export async function markLoginFailure(userId: string): Promise<void> {
  await db.query(
    `
      UPDATE users
      SET
        failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE
          WHEN failed_login_attempts + 1 >= 5 THEN DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 15 MINUTE)
          ELSE locked_until
        END
      WHERE id = ?
    `,
    [userId],
  );
}

export async function createSession(input: {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}): Promise<void> {
  await db.query(
    `
      INSERT INTO user_sessions (
        user_id,
        refresh_token_hash,
        user_agent,
        ip_address,
        expires_at
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      input.userId,
      input.refreshTokenHash,
      input.userAgent ?? null,
      input.ipAddress ?? null,
      input.expiresAt,
    ],
  );
}

export async function revokeSessionByRefreshHash(
  refreshTokenHash: string,
): Promise<boolean> {
  const [result] = await db.query<ResultSetHeader>(
    `
      UPDATE user_sessions
      SET revoked_at = CURRENT_TIMESTAMP(3)
      WHERE refresh_token_hash = ?
        AND revoked_at IS NULL
    `,
    [refreshTokenHash],
  );

  return result.affectedRows > 0;
}

export async function rotateRefreshSession(input: {
  oldRefreshTokenHash: string;
  newRefreshTokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}): Promise<SessionRow | undefined> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<SessionRow[]>(
      `
        SELECT id, user_id, refresh_token_hash, expires_at, revoked_at
        FROM user_sessions
        WHERE refresh_token_hash = ?
          AND revoked_at IS NULL
          AND expires_at > CURRENT_TIMESTAMP(3)
        LIMIT 1
        FOR UPDATE
      `,
      [input.oldRefreshTokenHash],
    );
    const session = rows[0];

    if (!session) {
      await connection.rollback();
      return undefined;
    }

    await connection.query(
      `
        UPDATE user_sessions
        SET revoked_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [session.id],
    );
    await connection.query(
      `
        INSERT INTO user_sessions (
          user_id,
          refresh_token_hash,
          user_agent,
          ip_address,
          expires_at
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        session.user_id,
        input.newRefreshTokenHash,
        input.userAgent ?? null,
        input.ipAddress ?? null,
        input.expiresAt,
      ],
    );

    await connection.commit();
    return session;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function findUserByEmailForReset(
  email: string,
): Promise<{ id: number } | undefined> {
  const [rows] = await db.query<PasswordResetUserRow[]>(
    `
      SELECT id
      FROM users
      WHERE email = ?
        AND deleted_at IS NULL
        AND status = 'ACTIVE'
      LIMIT 1
    `,
    [email],
  );

  return rows[0];
}

type ResetTargetUserRow = RowDataPacket & {
  id: number;
  email: string;
  full_name: string;
};

/**
 * Ba việc luôn phải đi cùng nhau khi đặt lại mật khẩu, dùng chung cho cả hai
 * đường vào (admin bấm đặt lại, và admin duyệt yêu cầu quên mật khẩu):
 *
 * 1. Ghi mật khẩu mới.
 * 2. Xóa bộ đếm đăng nhập sai + mở khóa — quên mật khẩu thường đi kèm đã gõ sai
 *    5 lần và đang bị `locked_until` chặn; không mở thì đặt lại xong vẫn không vào được.
 * 3. Thu hồi mọi phiên đang mở. Bắt buộc, không phải tùy chọn: đổi mật khẩu mà
 *    để refresh token cũ còn sống thì người đang chiếm tài khoản vẫn vào tiếp.
 *
 * Gọi trong transaction của hàm cha nên cả ba cùng thành công hoặc cùng hủy.
 */
async function applyPasswordResetToUser(
  connection: PoolConnection,
  userId: number,
  passwordHash: string,
): Promise<ResetTargetUserRow> {
  const [userRows] = await connection.query<ResetTargetUserRow[]>(
    `
      SELECT id, email, full_name
      FROM users
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
      FOR UPDATE
    `,
    [userId],
  );
  const user = userRows[0];

  if (!user) {
    throw new Error('PASSWORD_RESET_USER_NOT_FOUND');
  }

  await connection.query(
    `
      UPDATE users
      SET
        password_hash = ?,
        failed_login_attempts = 0,
        locked_until = NULL
      WHERE id = ?
    `,
    [passwordHash, user.id],
  );

  await connection.query(
    `
      UPDATE user_sessions
      SET revoked_at = CURRENT_TIMESTAMP(3)
      WHERE user_id = ?
        AND revoked_at IS NULL
    `,
    [user.id],
  );

  return user;
}

/** Quản trị viên chủ động đặt lại mật khẩu cho một nhân viên. */
export async function resetUserPasswordTransaction(input: {
  userId: number;
  resetBy: number;
  passwordHash: string;
}): Promise<{ userId: number; email: string; fullName: string }> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const user = await applyPasswordResetToUser(
      connection,
      input.userId,
      input.passwordHash,
    );

    // Không ghi mật khẩu vào nhật ký: audit_logs nhiều vai trò đọc được hơn users.
    await insertAuditLog(connection, {
      userId: input.resetBy,
      action: 'RESET_PASSWORD',
      module: 'auth',
      entityType: 'USER',
      entityId: user.id,
      newValues: { passwordResetToDefault: true, sessionsRevoked: true },
    });

    await connection.commit();

    return { userId: user.id, email: user.email, fullName: user.full_name };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Ghi nhận yêu cầu quên mật khẩu chờ quản trị viên duyệt.
 *
 * Idempotent theo người dùng: nếu tài khoản đã có một yêu cầu `PENDING` thì trả
 * lại chính yêu cầu đó thay vì tạo thêm. Nhân viên bấm "Quên mật khẩu" mười lần
 * cũng chỉ sinh một dòng, hàng đợi của quản trị viên không bị ngập bản trùng.
 */
export async function createPasswordResetRequest(input: {
  userId: number;
  requestedEmail: string;
  note?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<number> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query<PasswordResetRequestRow[]>(
      `
        SELECT id
        FROM password_reset_requests
        WHERE user_id = ?
          AND status = 'PENDING'
        LIMIT 1
        FOR UPDATE
      `,
      [input.userId],
    );
    const existing = existingRows[0];

    if (existing) {
      await connection.commit();
      return existing.id;
    }

    const [result] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO password_reset_requests (
          user_id,
          requested_email,
          status,
          note,
          ip_address,
          user_agent
        )
        VALUES (?, ?, 'PENDING', ?, ?, ?)
      `,
      [
        input.userId,
        input.requestedEmail,
        input.note ?? null,
        input.ipAddress ?? null,
        input.userAgent ?? null,
      ],
    );

    await insertAuditLog(connection, {
      userId: input.userId,
      action: 'REQUEST_PASSWORD_RESET',
      module: 'auth',
      entityType: 'PASSWORD_RESET_REQUEST',
      entityId: result.insertId,
      newValues: { status: 'PENDING', requestedEmail: input.requestedEmail },
    });

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function findPasswordResetRequests(
  filters: PasswordResetRequestsFilters,
): Promise<PasswordResetRequestListRow[]> {
  const where: string[] = [];
  const params: Array<string> = [];

  if (filters.status) {
    where.push('prr.status = ?');
    params.push(filters.status);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<PasswordResetRequestListRow[]>(
    `
      SELECT
        prr.*,
        u.full_name,
        u.employee_code,
        u.status AS user_status,
        r.code AS role_code,
        approver.full_name AS approved_by_name,
        rejecter.full_name AS rejected_by_name
      FROM password_reset_requests prr
      JOIN users u ON u.id = prr.user_id
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN users approver ON approver.id = prr.approved_by
      LEFT JOIN users rejecter ON rejecter.id = prr.rejected_by
      ${whereSql}
      ORDER BY prr.id DESC
      LIMIT 100
    `,
    params,
  );

  return rows;
}

async function lockPasswordResetRequest(
  connection: PoolConnection,
  requestId: number,
): Promise<PasswordResetRequestRow | undefined> {
  const [rows] = await connection.query<PasswordResetRequestRow[]>(
    `
      SELECT
        id,
        user_id,
        requested_email,
        status
      FROM password_reset_requests
      WHERE id = ?
      FOR UPDATE
    `,
    [requestId],
  );

  return rows[0];
}

/**
 * Duyệt yêu cầu quên mật khẩu do nhân viên tự gửi. Phần đặt lại mật khẩu dùng
 * chung `applyPasswordResetToUser` với đường admin bấm đặt lại; hàm này chỉ thêm
 * việc kiểm tra trạng thái yêu cầu và đóng yêu cầu lại.
 */
export async function approvePasswordResetRequestTransaction(input: {
  requestId: number;
  approvedBy: number;
  passwordHash: string;
}): Promise<{ userId: number; email: string; fullName: string }> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const request = await lockPasswordResetRequest(connection, input.requestId);

    if (!request) {
      throw new Error('PASSWORD_RESET_REQUEST_NOT_FOUND');
    }

    if (request.status !== 'PENDING') {
      throw new Error('PASSWORD_RESET_REQUEST_NOT_PENDING');
    }

    const user = await applyPasswordResetToUser(
      connection,
      request.user_id,
      input.passwordHash,
    );

    await connection.query(
      `
        UPDATE password_reset_requests
        SET
          status = 'APPROVED',
          approved_by = ?,
          approved_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [input.approvedBy, request.id],
    );

    // Không ghi mật khẩu mặc định vào nhật ký: giá trị nào cũng là bí mật đăng
    // nhập, audit_logs đọc được bởi nhiều vai trò hơn bảng users.
    await insertAuditLog(connection, {
      userId: input.approvedBy,
      action: 'APPROVE_PASSWORD_RESET',
      module: 'auth',
      entityType: 'PASSWORD_RESET_REQUEST',
      entityId: request.id,
      oldValues: { status: 'PENDING' },
      newValues: {
        status: 'APPROVED',
        targetUserId: user.id,
        sessionsRevoked: true,
      },
    });

    await connection.commit();

    return { userId: user.id, email: user.email, fullName: user.full_name };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function rejectPasswordResetRequestTransaction(input: {
  requestId: number;
  rejectedBy: number;
  rejectionReason: string;
}): Promise<{ userId: number }> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const request = await lockPasswordResetRequest(connection, input.requestId);

    if (!request) {
      throw new Error('PASSWORD_RESET_REQUEST_NOT_FOUND');
    }

    if (request.status !== 'PENDING') {
      throw new Error('PASSWORD_RESET_REQUEST_NOT_PENDING');
    }

    await connection.query(
      `
        UPDATE password_reset_requests
        SET
          status = 'REJECTED',
          rejected_by = ?,
          rejected_at = CURRENT_TIMESTAMP(3),
          rejection_reason = ?
        WHERE id = ?
      `,
      [input.rejectedBy, input.rejectionReason, request.id],
    );

    await insertAuditLog(connection, {
      userId: input.rejectedBy,
      action: 'REJECT_PASSWORD_RESET',
      module: 'auth',
      entityType: 'PASSWORD_RESET_REQUEST',
      entityId: request.id,
      oldValues: { status: 'PENDING' },
      newValues: {
        status: 'REJECTED',
        targetUserId: request.user_id,
        rejectionReason: input.rejectionReason,
      },
    });

    await connection.commit();

    return { userId: request.user_id };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function listUsers(): Promise<UserListRow[]> {
  const [rows] = await db.query<UserListRow[]>(`
    SELECT
      u.id,
      u.employee_code,
      u.full_name,
      u.email,
      u.phone,
      u.status,
      r.code AS role_code,
      r.name AS role_name,
      -- Kho phụ trách gom thành chuỗi để danh sách nhân viên chỉ cần một truy vấn.
      GROUP_CONCAT(
        uw.warehouse_id ORDER BY uw.is_primary DESC, uw.warehouse_id SEPARATOR ','
      ) AS warehouse_ids,
      GROUP_CONCAT(
        w.code ORDER BY uw.is_primary DESC, uw.warehouse_id SEPARATOR ', '
      ) AS warehouse_codes,
      MAX(CASE WHEN uw.is_primary THEN uw.warehouse_id END) AS primary_warehouse_id
    FROM users u
    JOIN roles r ON r.id = u.role_id
    LEFT JOIN user_warehouses uw ON uw.user_id = u.id
    LEFT JOIN warehouses w ON w.id = uw.warehouse_id
    WHERE u.deleted_at IS NULL
    GROUP BY
      u.id, u.employee_code, u.full_name, u.email, u.phone, u.status,
      r.code, r.name
    ORDER BY u.id
    LIMIT 100
  `);

  return rows;
}

/**
 * Ghi lại toàn bộ danh sách kho phụ trách của một nhân viên. Xóa hết rồi chèn lại
 * trong cùng giao dịch: bảng chỉ có khóa chính (user_id, warehouse_id) nên cách
 * này vừa gọn vừa xử lý được cả việc bỏ gán.
 */
export async function replaceUserWarehouses(input: {
  userId: number;
  warehouseIds: number[];
  primaryWarehouseId?: number | null;
}): Promise<{ assignedCount: number }> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query('DELETE FROM user_warehouses WHERE user_id = ?', [
      input.userId,
    ]);

    for (const warehouseId of input.warehouseIds) {
      await connection.query(
        `
          INSERT INTO user_warehouses (user_id, warehouse_id, is_primary)
          VALUES (?, ?, ?)
        `,
        [
          input.userId,
          warehouseId,
          input.primaryWarehouseId === warehouseId ? 1 : 0,
        ],
      );
    }

    await connection.commit();

    return { assignedCount: input.warehouseIds.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function createUser(input: {
  roleCode: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone?: string;
  passwordHash: string;
}): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `
      INSERT INTO users (role_id, employee_code, full_name, email, phone, password_hash, status)
      SELECT r.id, ?, ?, ?, ?, ?, 'ACTIVE'
      FROM roles r
      WHERE r.code = ?
    `,
    [
      input.employeeCode,
      input.fullName,
      input.email,
      input.phone ?? null,
      input.passwordHash,
      input.roleCode,
    ],
  );

  return result.insertId;
}

export async function updateUserRepository(
  id: number,
  input: UpdateUserInput,
): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `
      UPDATE users u
      JOIN roles r ON r.code = ?
      SET
        u.role_id = r.id,
        u.employee_code = ?,
        u.full_name = ?,
        u.email = ?,
        u.phone = ?,
        u.status = ?
      WHERE u.id = ?
        AND u.deleted_at IS NULL
    `,
    [
      input.roleCode,
      input.employeeCode ?? null,
      input.fullName,
      input.email,
      input.phone ?? null,
      input.status,
      id,
    ],
  );

  return result.affectedRows;
}

export async function deleteUserRepository(id: number): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `
      UPDATE users
      SET deleted_at = CURRENT_TIMESTAMP(3), status = 'INACTIVE'
      WHERE id = ? AND deleted_at IS NULL
    `,
    [id],
  );

  return result.affectedRows;
}
