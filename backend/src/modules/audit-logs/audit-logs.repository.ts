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
    // `al.entity` không phải là cột — bảng audit_logs có `entity_type`. Dùng tên
    // cũ làm cả câu lọc ném lỗi 1054 và trả 500 mỗi lần người dùng bấm Lọc.
    where.push(
      '(al.action LIKE :search OR al.module LIKE :search OR al.entity_type LIKE :search OR u.full_name LIKE :search)',
    );
    params.search = `%${filters.search}%`;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  // Đối tượng bị tác động chỉ được lưu bằng (entity_type, entity_id) nên tự nó
  // đọc ra là "Phiếu kiểm kê #4" — vô nghĩa với người xem. Nối sang bảng gốc để
  // lấy số chứng từ (KK-..., DC-...) hoặc tên người dùng. Quan hệ đa hình nên
  // không đặt được khóa ngoại, phải LEFT JOIN kèm điều kiện entity_type.
  const [rows] = await db.query<AuditLogsRow[]>({
    sql: `
      SELECT
        al.*,
        u.full_name AS user_full_name,
        u.email AS user_email,
        COALESCE(
          target_user.full_name,
          gr.receipt_code,
          gi.issue_code,
          tr.transfer_code,
          sc.count_code,
          sa.adjustment_code,
          w.name,
          prr.requested_email
        ) AS entity_name
      FROM ${tableName} al
      LEFT JOIN users u ON u.id = al.user_id
      LEFT JOIN users target_user
        ON al.entity_type = 'USER' AND target_user.id = al.entity_id
      LEFT JOIN goods_receipts gr
        ON al.entity_type = 'GOODS_RECEIPT' AND gr.id = al.entity_id
      LEFT JOIN goods_issues gi
        ON al.entity_type = 'GOODS_ISSUE' AND gi.id = al.entity_id
      LEFT JOIN stock_transfers tr
        ON al.entity_type = 'STOCK_TRANSFER' AND tr.id = al.entity_id
      LEFT JOIN stock_counts sc
        ON al.entity_type = 'STOCK_COUNT' AND sc.id = al.entity_id
      LEFT JOIN stock_adjustments sa
        ON al.entity_type = 'STOCK_ADJUSTMENT' AND sa.id = al.entity_id
      LEFT JOIN warehouses w
        ON al.entity_type = 'WAREHOUSE' AND w.id = al.entity_id
      LEFT JOIN password_reset_requests prr
        ON al.entity_type = 'PASSWORD_RESET_REQUEST' AND prr.id = al.entity_id
      ${whereSql}
      ORDER BY al.id DESC
      LIMIT 100
    `,
    values: params,
  });

  return rows;
}
