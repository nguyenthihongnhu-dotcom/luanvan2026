import { HttpError } from '../../common/http';
import type {
  BatchesFilters,
  BatchesRow,
  CreateBatchInput,
  UpdateBatchInput,
} from './batches.model';
import {
  findBatches as findBatchesRepository,
  createBatchRecord,
  countBatchUsage,
  deleteBatchRecord,
  updateBatchRecord,
} from './batches.repository';

export async function listBatches(
  filters: BatchesFilters,
): Promise<BatchesRow[]> {
  return findBatchesRepository(filters);
}

type MysqlError = { code?: string; errno?: number; sqlMessage?: string };

/**
 * Đổi lỗi ràng buộc của MySQL thành lỗi nghiệp vụ đọc được.
 * Không có bước này thì trùng số lô hoặc sai ngày sẽ rơi ra ngoài thành 500.
 */
function toBatchHttpError(error: unknown): unknown {
  const mysqlError = error as MysqlError;

  // uq_batch_lot UNIQUE (product_variant_id, lot_number)
  if (mysqlError?.code === 'ER_DUP_ENTRY') {
    return new HttpError(
      409,
      'Số lô này đã tồn tại cho sản phẩm đã chọn. Dùng số lô khác hoặc nhập thêm hàng vào lô cũ.',
      'BATCH_LOT_EXISTS',
    );
  }

  // chk_batch_dates: expiry_date IS NULL OR manufacture_date IS NULL OR expiry_date > manufacture_date
  if (
    mysqlError?.code === 'ER_CHECK_CONSTRAINT_VIOLATED' ||
    mysqlError?.errno === 3819
  ) {
    return new HttpError(
      422,
      'Hạn sử dụng phải sau ngày sản xuất.',
      'BATCH_DATES_INVALID',
    );
  }

  if (error instanceof Error && error.message === 'BATCH_NOT_FOUND') {
    return new HttpError(404, 'Không tìm thấy lô hàng', 'BATCH_NOT_FOUND');
  }

  return error;
}

export async function createBatch(
  input: CreateBatchInput,
): Promise<{ id: number; created: boolean }> {
  try {
    return await createBatchRecord(input);
  } catch (error) {
    throw toBatchHttpError(error);
  }
}

export async function updateBatch(
  input: UpdateBatchInput,
): Promise<{ affectedRows: number }> {
  try {
    return await updateBatchRecord(input);
  } catch (error) {
    throw toBatchHttpError(error);
  }
}

export async function deleteBatch(
  batchId: number,
): Promise<{ affectedRows: number }> {
  // Lô đã phát sinh tồn hoặc giao dịch thì không được xóa, xóa đi là mất dấu vết truy xuất.
  const usage = await countBatchUsage(batchId);

  if (usage.stockQuantity > 0) {
    throw new HttpError(
      409,
      `Lô này còn ${usage.stockQuantity} đơn vị trong kho, không xóa được. Xuất hết hàng rồi thử lại.`,
      'BATCH_HAS_STOCK',
    );
  }

  if (usage.transactionCount > 0) {
    throw new HttpError(
      409,
      `Lô này đã có ${usage.transactionCount} giao dịch tồn kho nên phải giữ lại để truy vết. Dùng trạng thái Khóa lô thay cho xóa.`,
      'BATCH_HAS_TRANSACTIONS',
    );
  }

  try {
    return await deleteBatchRecord(batchId);
  } catch (error) {
    throw toBatchHttpError(error);
  }
}
