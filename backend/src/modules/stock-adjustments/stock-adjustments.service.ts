import { HttpError } from '../../common/http';
import type {
  ApproveStockAdjustmentInput,
  ApproveStockAdjustmentResult,
  CancelStockAdjustmentInput,
  CancelStockAdjustmentResult,
  RejectStockAdjustmentInput,
  RejectStockAdjustmentResult,
  StockAdjustmentsFilters,
  CreateStockAdjustmentInput,
  StockAdjustmentsRow,
} from './stock-adjustments.model';
import {
  approveStockAdjustmentTransaction,
  cancelStockAdjustmentTransaction,
  findStockAdjustmentDetail as findStockAdjustmentDetailRepository,
  findStockAdjustments as findStockAdjustmentsRepository,
  insertStockAdjustment,
  rejectStockAdjustmentTransaction,
} from './stock-adjustments.repository';

const approveErrorMap: Record<string, HttpError> = {
  STOCK_ADJUSTMENT_NOT_FOUND: new HttpError(
    404,
    'Stock adjustment not found',
    'STOCK_ADJUSTMENT_NOT_FOUND',
  ),
  STOCK_ADJUSTMENT_NOT_APPROVABLE: new HttpError(
    409,
    'Only DRAFT or PENDING stock adjustments can be approved',
    'STOCK_ADJUSTMENT_NOT_APPROVABLE',
  ),
  STOCK_ADJUSTMENT_HAS_NO_ITEMS: new HttpError(
    422,
    'Stock adjustment has no items',
    'STOCK_ADJUSTMENT_HAS_NO_ITEMS',
  ),
  STOCK_LOCATION_NOT_FOUND: new HttpError(
    409,
    'Stock location not found for OUT adjustment',
    'STOCK_LOCATION_NOT_FOUND',
  ),
  INSUFFICIENT_STOCK: new HttpError(
    409,
    'Insufficient stock for OUT adjustment',
    'INSUFFICIENT_STOCK',
  ),
  CONCURRENT_STOCK_UPDATE: new HttpError(
    409,
    'Stock changed while approving adjustment',
    'CONCURRENT_STOCK_UPDATE',
  ),
  LOCATION_WAREHOUSE_MISMATCH: new HttpError(
    422,
    'Adjustment item location does not belong to adjustment warehouse',
    'LOCATION_WAREHOUSE_MISMATCH',
  ),
  STOCK_ADJUSTMENT_NOT_REJECTABLE: new HttpError(
    409,
    'Only DRAFT or PENDING stock adjustments can be rejected',
    'STOCK_ADJUSTMENT_NOT_REJECTABLE',
  ),
  STOCK_ADJUSTMENT_NOT_CANCELLABLE: new HttpError(
    409,
    'Only DRAFT or PENDING stock adjustments can be cancelled',
    'STOCK_ADJUSTMENT_NOT_CANCELLABLE',
  ),
};

export async function listStockAdjustments(
  filters: StockAdjustmentsFilters,
): Promise<StockAdjustmentsRow[]> {
  return findStockAdjustmentsRepository(filters);
}

export async function getStockAdjustmentDetail(
  id: number,
): Promise<{ header: unknown; items: unknown[] }> {
  const detail = await findStockAdjustmentDetailRepository(id);
  if (!detail) {
    throw new HttpError(
      404,
      'Stock adjustment not found',
      'STOCK_ADJUSTMENT_NOT_FOUND',
    );
  }
  return detail;
}
export async function approveStockAdjustment(
  input: ApproveStockAdjustmentInput,
): Promise<ApproveStockAdjustmentResult> {
  try {
    return await approveStockAdjustmentTransaction(input);
  } catch (error) {
    if (error instanceof Error && approveErrorMap[error.message]) {
      throw approveErrorMap[error.message];
    }

    throw error;
  }
}

export async function rejectStockAdjustment(
  input: RejectStockAdjustmentInput,
): Promise<RejectStockAdjustmentResult> {
  try {
    return await rejectStockAdjustmentTransaction(input);
  } catch (error) {
    if (error instanceof Error && approveErrorMap[error.message]) {
      throw approveErrorMap[error.message];
    }

    throw error;
  }
}

export async function cancelStockAdjustment(
  input: CancelStockAdjustmentInput,
): Promise<CancelStockAdjustmentResult> {
  try {
    return await cancelStockAdjustmentTransaction(input);
  } catch (error) {
    if (error instanceof Error && approveErrorMap[error.message]) {
      throw approveErrorMap[error.message];
    }

    throw error;
  }
}
export async function createStockAdjustment(
  input: CreateStockAdjustmentInput,
): Promise<{ id: number }> {
  return insertStockAdjustment(input);
}
