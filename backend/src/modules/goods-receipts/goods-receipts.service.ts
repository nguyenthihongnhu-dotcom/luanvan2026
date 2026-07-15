import { HttpError } from '../../common/http';
import type {
  ConfirmGoodsReceiptInput,
  ConfirmGoodsReceiptResult,
  GoodsReceiptsFilters,
  GoodsReceiptsRow,
} from './goods-receipts.model';
import {
  confirmGoodsReceiptTransaction,
  findGoodsReceipts as findGoodsReceiptsRepository,
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
  LOCATION_WAREHOUSE_MISMATCH: new HttpError(
    422,
    'Receipt item location does not belong to receipt warehouse',
    'LOCATION_WAREHOUSE_MISMATCH',
  ),
};

export async function listGoodsReceipts(
  filters: GoodsReceiptsFilters,
): Promise<GoodsReceiptsRow[]> {
  return findGoodsReceiptsRepository(filters);
}

export async function confirmGoodsReceipt(
  input: ConfirmGoodsReceiptInput,
): Promise<ConfirmGoodsReceiptResult> {
  try {
    return await confirmGoodsReceiptTransaction(input);
  } catch (error) {
    if (error instanceof Error && confirmErrorMap[error.message]) {
      throw confirmErrorMap[error.message];
    }

    throw error;
  }
}
