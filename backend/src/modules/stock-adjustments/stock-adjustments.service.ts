import { HttpError } from '../../common/http';
import type {
  ApproveStockAdjustmentInput,
  ApproveStockAdjustmentResult,
  StockAdjustmentsFilters,
  StockAdjustmentsRow,
} from './stock-adjustments.model';
import {
  approveStockAdjustmentTransaction,
  findStockAdjustments as findStockAdjustmentsRepository,
} from './stock-adjustments.repository';

const approveErrorMap: Record<string, HttpError> = {
  STOCK_ADJUSTMENT_NOT_FOUND: new HttpError(
    404,
    'Stock adjustment not found',
    'STOCK_ADJUSTMENT_NOT_FOUND',
  ),
  STOCK_ADJUSTMENT_NOT_APPROVABLE: new HttpError(
    409,
    'Only PENDING stock adjustments can be approved',
    'STOCK_ADJUSTMENT_NOT_APPROVABLE',
  ),
  SELF_APPROVAL_NOT_ALLOWED: new HttpError(
    403,
    'Adjustment creator cannot approve their own adjustment',
    'SELF_APPROVAL_NOT_ALLOWED',
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
};

export async function listStockAdjustments(
  filters: StockAdjustmentsFilters,
): Promise<StockAdjustmentsRow[]> {
  return findStockAdjustmentsRepository(filters);
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
