import { HttpError } from '../../common/http';
import type {
  ApproveStockCountInput,
  ApproveStockCountResult,
  CreateStockCountInput,
  CreateStockCountResult,
  RecordStockCountItemInput,
  RecordStockCountItemResult,
  StartStockCountInput,
  StartStockCountResult,
  StockCountItemRow,
  StockCountsFilters,
  StockCountsRow,
  SubmitStockCountInput,
  SubmitStockCountResult,
} from './stock-counts.model';
import {
  approveStockCountTransaction,
  createStockCountTransaction,
  findStockCountItems as findStockCountItemsRepository,
  findStockCountWarehouseId as findStockCountWarehouseIdRepository,
  findStockCounts as findStockCountsRepository,
  recordStockCountItemTransaction,
  startStockCountTransaction,
  rejectStockCountTransaction,
  submitStockCountTransaction,
} from './stock-counts.repository';

const stockCountErrorMap: Record<string, HttpError> = {
  STOCK_COUNT_NOT_FOUND: new HttpError(
    404,
    'Không tìm thấy phiếu kiểm kê',
    'STOCK_COUNT_NOT_FOUND',
  ),
  STOCK_COUNT_ITEM_NOT_FOUND: new HttpError(
    404,
    'Không tìm thấy dòng kiểm kê',
    'STOCK_COUNT_ITEM_NOT_FOUND',
  ),
  STOCK_COUNT_SNAPSHOT_EMPTY: new HttpError(
    422,
    'Phạm vi kiểm kê không có ô lưu trữ hoặc mặt hàng nào để kiểm đếm. Kiểm tra lại kho đã có ô lưu trữ chưa, hoặc nhóm hàng đã chọn có mặt hàng nào không.',
    'STOCK_COUNT_SNAPSHOT_EMPTY',
  ),
  STOCK_COUNT_NOT_STARTABLE: new HttpError(
    409,
    'Chỉ có thể bắt đầu phiếu kiểm kê ở trạng thái Nháp',
    'STOCK_COUNT_NOT_STARTABLE',
  ),
  STOCK_COUNT_NOT_COUNTABLE: new HttpError(
    409,
    'Chỉ có thể đếm phiếu kiểm kê ở trạng thái Đang kiểm kê',
    'STOCK_COUNT_NOT_COUNTABLE',
  ),
  STOCK_COUNT_NOT_SUBMITTABLE: new HttpError(
    409,
    'Chỉ có thể gửi duyệt phiếu kiểm kê ở trạng thái Đang kiểm kê',
    'STOCK_COUNT_NOT_SUBMITTABLE',
  ),
  STOCK_COUNT_NOT_REJECTABLE: new HttpError(
    409,
    'Chỉ có thể trả về phiếu kiểm kê ở trạng thái Chờ duyệt',
    'STOCK_COUNT_NOT_REJECTABLE',
  ),
  STOCK_COUNT_NOT_APPROVABLE: new HttpError(
    409,
    'Chỉ có thể duyệt phiếu kiểm kê ở trạng thái Chờ duyệt',
    'STOCK_COUNT_NOT_APPROVABLE',
  ),
  STOCK_COUNT_HAS_NO_ITEMS: new HttpError(
    422,
    'Phiếu kiểm kê không có mặt hàng nào',
    'STOCK_COUNT_HAS_NO_ITEMS',
  ),
  STOCK_COUNT_HAS_UNCOUNTED_ITEMS: new HttpError(
    422,
    'Tất cả các dòng mặt hàng phải được kiểm đếm thực tế trước khi gửi duyệt',
    'STOCK_COUNT_HAS_UNCOUNTED_ITEMS',
  ),
};

function mapStockCountError(error: unknown): never {
  if (error instanceof Error && stockCountErrorMap[error.message]) {
    throw stockCountErrorMap[error.message];
  }

  throw error;
}

export async function listStockCounts(
  filters: StockCountsFilters,
): Promise<StockCountsRow[]> {
  return findStockCountsRepository(filters);
}

export async function getStockCountWarehouseId(
  stockCountId: number,
): Promise<number | null> {
  return findStockCountWarehouseIdRepository(stockCountId);
}

export async function listStockCountItems(
  stockCountId: number,
): Promise<StockCountItemRow[]> {
  return findStockCountItemsRepository(stockCountId);
}

export async function createStockCount(
  input: CreateStockCountInput,
): Promise<CreateStockCountResult> {
  try {
    return await createStockCountTransaction(input);
  } catch (error) {
    mapStockCountError(error);
  }
}

export async function startStockCount(
  input: StartStockCountInput,
): Promise<StartStockCountResult> {
  try {
    return await startStockCountTransaction(input);
  } catch (error) {
    mapStockCountError(error);
  }
}

export async function recordStockCountItem(
  input: RecordStockCountItemInput,
): Promise<RecordStockCountItemResult> {
  try {
    return await recordStockCountItemTransaction(input);
  } catch (error) {
    mapStockCountError(error);
  }
}

export async function submitStockCount(
  input: SubmitStockCountInput,
): Promise<SubmitStockCountResult> {
  try {
    return await submitStockCountTransaction(input);
  } catch (error) {
    mapStockCountError(error);
  }
}

/** Trả phiếu đã gửi duyệt về cho nhân viên đếm lại, kèm lý do. */
export async function rejectStockCount(input: {
  stockCountId: number;
  rejectedBy: number;
  rejectionReason: string;
}): Promise<{
  stockCountId: number;
  countCode: string;
  status: 'IN_PROGRESS';
}> {
  try {
    return await rejectStockCountTransaction(input);
  } catch (error) {
    mapStockCountError(error);
  }
}

export async function approveStockCount(
  input: ApproveStockCountInput,
): Promise<ApproveStockCountResult> {
  try {
    return await approveStockCountTransaction(input);
  } catch (error) {
    mapStockCountError(error);
  }
}
