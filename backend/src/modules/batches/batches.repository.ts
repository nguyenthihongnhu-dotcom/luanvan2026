import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../../database/db';
import type {
  BatchesFilters,
  BatchesRow,
  CreateBatchInput,
  QueryParams,
  UpdateBatchInput,
} from './batches.model';

const tableName = 'product_batches';

/** Số ngày coi là cận hạn, khớp với thẻ tổng hợp trên màn hình lô hàng. */
const NEAR_EXPIRY_DAYS = 30;

export async function findBatches(
  filters: BatchesFilters,
): Promise<BatchesRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push('lot_number LIKE :search');
    params.search = `%${filters.search}%`;
  }

  if (filters.productVariantId) {
    where.push('product_variant_id = :productVariantId');
    params.productVariantId = filters.productVariantId;
  }

  // Trạng thái theo hạn dùng được TÍNH khi đọc, không đọc cột status đã lưu.
  // Không có tiến trình nào cập nhật cột đó theo thời gian, nên nếu đọc thẳng thì
  // một lô đã quá hạn vẫn hiện ACTIVE mãi. BLOCKED và DEPLETED là do người dùng
  // hoặc nghiệp vụ đặt nên vẫn giữ nguyên giá trị đã lưu.
  const effectiveStatusSql = `
    CASE
      WHEN status IN ('BLOCKED', 'DEPLETED') THEN status
      WHEN expiry_date IS NULL THEN 'ACTIVE'
      WHEN expiry_date < CURRENT_DATE THEN 'EXPIRED'
      WHEN expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL ${NEAR_EXPIRY_DAYS} DAY) THEN 'NEAR_EXPIRY'
      ELSE 'ACTIVE'
    END`;

  if (filters.status) {
    where.push(`(${effectiveStatusSql}) = :status`);
    params.status = filters.status;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<BatchesRow[]>({
    sql: `SELECT *, (${effectiveStatusSql}) AS status, status AS stored_status
          FROM ${tableName} ${whereSql} ORDER BY id DESC LIMIT 100`,
    values: params,
  });

  return rows;
}

/**
 * Ghi lô hàng. Trùng (product_variant_id, lot_number) thì cập nhật lô sẵn có thay vì báo lỗi,
 * nhưng phải nói rõ đã tạo mới hay cập nhật: trước đây trường hợp trùng trả về id = 0,
 * người dùng bấm "thêm lô" xong không biết chuyện gì vừa xảy ra.
 */
export async function createBatchRecord(
  data: CreateBatchInput,
): Promise<{ id: number; created: boolean }> {
  const [result] = await db.query<ResultSetHeader>({
    sql: `INSERT INTO ${tableName} (product_variant_id, supplier_id, lot_number, manufacture_date, expiry_date, received_date, status, notes)
          VALUES (:productVariantId, :supplierId, :lotNumber, :manufactureDate, :expiryDate, CURRENT_DATE, 'ACTIVE', :notes)
          ON DUPLICATE KEY UPDATE
            expiry_date = COALESCE(VALUES(expiry_date), expiry_date),
            manufacture_date = COALESCE(VALUES(manufacture_date), manufacture_date),
            notes = COALESCE(VALUES(notes), notes),
            status = 'ACTIVE'`,
    values: {
      productVariantId: data.productVariantId,
      supplierId: data.supplierId ?? null,
      lotNumber: data.lotNumber,
      manufactureDate: data.manufactureDate ?? null,
      expiryDate: data.expiryDate ?? null,
      notes: data.notes ?? null,
    },
  });

  if (result.insertId > 0) {
    return { id: result.insertId, created: true };
  }

  // Nhánh cập nhật lô sẵn có: MySQL trả insertId = 0 nên phải tra lại id thật.
  const [rows] = await db.query<Array<RowDataPacket & { id: number }>>({
    sql: `SELECT id FROM ${tableName} WHERE product_variant_id = :productVariantId AND lot_number = :lotNumber LIMIT 1`,
    values: {
      productVariantId: data.productVariantId,
      lotNumber: data.lotNumber,
    },
  });

  return { id: Number(rows[0]?.id ?? 0), created: false };
}

export async function updateBatchRecord(
  input: UpdateBatchInput,
): Promise<{ affectedRows: number }> {
  // COALESCE để trường nào không gửi thì giữ nguyên, tránh vô tình xóa trắng dữ liệu cũ.
  const [result] = await db.query<ResultSetHeader>({
    sql: `UPDATE ${tableName}
          SET supplier_id = COALESCE(:supplierId, supplier_id),
              manufacture_date = COALESCE(:manufactureDate, manufacture_date),
              expiry_date = COALESCE(:expiryDate, expiry_date),
              notes = COALESCE(:notes, notes),
              status = COALESCE(:status, status)
          WHERE id = :id`,
    values: {
      id: input.id,
      supplierId: input.supplierId ?? null,
      manufactureDate: input.manufactureDate ?? null,
      expiryDate: input.expiryDate ?? null,
      notes: input.notes ?? null,
      status: input.status ?? null,
    },
  });

  if (result.affectedRows === 0) {
    throw new Error('BATCH_NOT_FOUND');
  }

  return { affectedRows: result.affectedRows };
}

/** Số bản ghi đang tham chiếu tới lô, dùng để chặn xóa lô đã phát sinh nghiệp vụ. */
export async function countBatchUsage(batchId: number): Promise<{
  stockQuantity: number;
  transactionCount: number;
}> {
  const [rows] = await db.query<
    Array<RowDataPacket & { stock_quantity: number; transaction_count: number }>
  >({
    sql: `
      SELECT
        (SELECT COALESCE(SUM(quantity), 0) FROM stock_locations WHERE batch_id = :batchId) AS stock_quantity,
        (SELECT COUNT(*) FROM inventory_transactions WHERE batch_id = :batchId) AS transaction_count
    `,
    values: { batchId },
  });

  return {
    stockQuantity: Number(rows[0]?.stock_quantity ?? 0),
    transactionCount: Number(rows[0]?.transaction_count ?? 0),
  };
}

export async function deleteBatchRecord(
  batchId: number,
): Promise<{ affectedRows: number }> {
  const [result] = await db.query<ResultSetHeader>({
    sql: `DELETE FROM ${tableName} WHERE id = :batchId`,
    values: { batchId },
  });

  if (result.affectedRows === 0) {
    throw new Error('BATCH_NOT_FOUND');
  }

  return { affectedRows: result.affectedRows };
}
