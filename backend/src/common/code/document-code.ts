import type { PoolConnection, RowDataPacket } from 'mysql2/promise';

/**
 * Sinh số phiếu theo quy ước đang dùng trong hệ thống: `<PREFIX>-<YYYYMM>-<NNN>`
 * (ví dụ PN-202608-004). Số thứ tự đếm riêng theo từng tháng và từng loại phiếu,
 * lấy từ mã lớn nhất đã có thay vì đếm số dòng, để phiếu bị xóa không làm trùng mã.
 *
 * Phải gọi trong cùng transaction với lệnh INSERT dùng mã này.
 */
export async function generateDocumentCode(
  connection: PoolConnection,
  table: string,
  column: string,
  prefix: string,
): Promise<string> {
  const now = new Date();
  const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const pattern = `${prefix}-${period}-%`;

  const [rows] = await connection.query<Array<RowDataPacket & { seq: number }>>(
    `
      SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(??, '-', -1) AS UNSIGNED)), 0) AS seq
      FROM ??
      WHERE ?? LIKE ?
    `,
    [column, table, column, pattern],
  );

  const nextSeq = Number(rows[0]?.seq ?? 0) + 1;

  return `${prefix}-${period}-${String(nextSeq).padStart(3, '0')}`;
}
