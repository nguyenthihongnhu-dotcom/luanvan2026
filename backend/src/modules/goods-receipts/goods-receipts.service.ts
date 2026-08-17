import { HttpError } from '../../common/http';
import { syncInventoryAlerts } from '../alerts/alerts.service';
import type {
  ConfirmGoodsReceiptInput,
  ConfirmGoodsReceiptResult,
  GoodsReceiptsFilters,
  CreateGoodsReceiptInput,
  GoodsReceiptsRow,
  ReverseGoodsReceiptInput,
  ReverseGoodsReceiptResult,
} from './goods-receipts.model';
import {
  confirmGoodsReceiptTransaction,
  findGoodsReceiptDetail as findGoodsReceiptDetailRepository,
  findGoodsReceipts as findGoodsReceiptsRepository,
  insertGoodsReceipt,
  reverseGoodsReceiptTransaction,
} from './goods-receipts.repository';

const confirmErrorMap: Record<string, HttpError> = {
  GOODS_RECEIPT_NOT_FOUND: new HttpError(
    404,
    'Goods receipt not found',
    'GOODS_RECEIPT_NOT_FOUND',
  ),
  GOODS_RECEIPT_NOT_CONFIRMABLE: new HttpError(
    409,
    'Only DRAFT or PENDING goods receipts can be confirmed',
    'GOODS_RECEIPT_NOT_CONFIRMABLE',
  ),
  GOODS_RECEIPT_HAS_NO_ITEMS: new HttpError(
    422,
    'Goods receipt has no items',
    'GOODS_RECEIPT_HAS_NO_ITEMS',
  ),
  BATCH_REQUIRED: new HttpError(
    422,
    'Lot-tracked products require batch_id before receiving',
    'BATCH_REQUIRED',
  ),
  EXPIRY_DATE_REQUIRED: new HttpError(
    422,
    'Expiry-tracked products require expiry_date before receiving',
    'EXPIRY_DATE_REQUIRED',
  ),
  BATCH_VARIANT_MISMATCH: new HttpError(
    422,
    'Batch belongs to a different product variant than the receipt item',
    'BATCH_VARIANT_MISMATCH',
  ),
  BATCH_EXPIRED: new HttpError(
    422,
    'Cannot receive a batch that is already past its expiry date',
    'BATCH_EXPIRED',
  ),
  BATCH_NOT_RECEIVABLE: new HttpError(
    422,
    'Cannot receive a batch marked EXPIRED or BLOCKED',
    'BATCH_NOT_RECEIVABLE',
  ),
  LOCATION_WAREHOUSE_MISMATCH: new HttpError(
    422,
    'Receipt item location does not belong to receipt warehouse',
    'LOCATION_WAREHOUSE_MISMATCH',
  ),
  GOODS_RECEIPT_NOT_REVERSIBLE: new HttpError(
    409,
    'Only CONFIRMED goods receipts can be reversed',
    'GOODS_RECEIPT_NOT_REVERSIBLE',
  ),
  REFERENCE_ALREADY_REVERSED: new HttpError(
    409,
    'Reference already reversed',
    'REFERENCE_ALREADY_REVERSED',
  ),
  REVERSAL_INSUFFICIENT_STOCK: new HttpError(
    409,
    'Insufficient stock to reverse receipt',
    'REVERSAL_INSUFFICIENT_STOCK',
  ),
};

export async function listGoodsReceipts(
  filters: GoodsReceiptsFilters,
): Promise<GoodsReceiptsRow[]> {
  return findGoodsReceiptsRepository(filters);
}

export async function getGoodsReceiptDetail(
  id: number,
): Promise<{ header: unknown; items: unknown[] }> {
  const detail = await findGoodsReceiptDetailRepository(id);
  if (!detail) {
    throw new HttpError(
      404,
      'Goods receipt not found',
      'GOODS_RECEIPT_NOT_FOUND',
    );
  }
  return detail;
}
export async function confirmGoodsReceipt(
  input: ConfirmGoodsReceiptInput,
): Promise<ConfirmGoodsReceiptResult> {
  try {
    const result = await confirmGoodsReceiptTransaction(input);
    await syncInventoryAlerts('confirmGoodsReceipt');
    return result;
  } catch (error) {
    if (error instanceof Error && confirmErrorMap[error.message]) {
      throw confirmErrorMap[error.message];
    }

    throw error;
  }
}

export async function reverseGoodsReceipt(
  input: ReverseGoodsReceiptInput,
): Promise<ReverseGoodsReceiptResult> {
  try {
    const result = await reverseGoodsReceiptTransaction(input);
    await syncInventoryAlerts('reverseGoodsReceipt');
    return result;
  } catch (error) {
    if (error instanceof Error && confirmErrorMap[error.message]) {
      throw confirmErrorMap[error.message];
    }

    throw error;
  }
}
export async function createGoodsReceipt(
  input: CreateGoodsReceiptInput,
): Promise<{ id: number }> {
  return insertGoodsReceipt(input);
}
