import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { db } from '../../database/db';
import type {
  AuthUserRow,
  LoginUserRow,
  PasswordResetTokenRow,
  SessionRow,
} from './auth.model';

type PasswordResetUserRow = RowDataPacket & { id: number };

export async function findActiveAuthUserById(
  userId: string,
): Promise<AuthUserRow | undefined> {
  const [rows] = await db.query<AuthUserRow[]>({
    sql: `
      SELECT
        u.id,
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
      GROUP BY u.id, u.status, r.code
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

export async function createPasswordResetToken(input: {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await db.query(
    `
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `,
    [input.userId, input.tokenHash, input.expiresAt],
  );
}

export async function resetPasswordWithTokenHash(input: {
  tokenHash: string;
  passwordHash: string;
}): Promise<boolean> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<PasswordResetTokenRow[]>(
      `
        SELECT id, user_id, token_hash, expires_at, used_at
        FROM password_reset_tokens
        WHERE token_hash = ?
          AND used_at IS NULL
          AND expires_at > CURRENT_TIMESTAMP(3)
        LIMIT 1
        FOR UPDATE
      `,
      [input.tokenHash],
    );
    const token = rows[0];

    if (!token) {
      await connection.rollback();
      return false;
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
      [input.passwordHash, token.user_id],
    );
    await connection.query(
      `
        UPDATE password_reset_tokens
        SET used_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [token.id],
    );
    await connection.query(
      `
        UPDATE user_sessions
        SET revoked_at = CURRENT_TIMESTAMP(3)
        WHERE user_id = ?
          AND revoked_at IS NULL
      `,
      [token.user_id],
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
