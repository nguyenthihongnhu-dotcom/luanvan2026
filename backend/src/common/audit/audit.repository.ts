import type { PoolConnection } from 'mysql2/promise';

export type AuditLogInput = {
  userId: number | null;
  action: string;
  module: string;
  entityType?: string;
  entityId?: number;
  oldValues?: unknown;
  newValues?: unknown;
};

export async function insertAuditLog(
  connection: PoolConnection,
  input: AuditLogInput,
): Promise<void> {
  await connection.query(
    `
      INSERT INTO audit_logs (
        user_id,
        action,
        module,
        entity_type,
        entity_id,
        old_values,
        new_values
      )
      VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON))
    `,
    [
      input.userId,
      input.action,
      input.module,
      input.entityType ?? null,
      input.entityId ?? null,
      input.oldValues === undefined ? null : JSON.stringify(input.oldValues),
      input.newValues === undefined ? null : JSON.stringify(input.newValues),
    ],
  );
}
