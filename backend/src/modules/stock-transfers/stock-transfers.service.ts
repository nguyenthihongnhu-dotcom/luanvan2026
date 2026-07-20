import { HttpError } from '../../common/http';
import type {
  ConfirmStockTransferInput,
  ConfirmStockTransferResult,
  ReverseStockTransferInput,
  ReverseStockTransferResult,
  StockTransfersFilters,
  StockTransfersRow,
} from './stock-transfers.model';
import {
  confirmStockTransferTransaction,
  findStockTransfers as findStockTransfersRepository,
  reverseStockTransferTransaction,
} from './stock-transfers.repository';

const confirmErrorMap: Record<string, HttpError> = {
  STOCK_TRANSFER_NOT_FOUND: new HttpError(
    404,
    'Stock transfer not found',
    'STOCK_TRANSFER_NOT_FOUND',
  ),
  STOCK_TRANSFER_NOT_CONFIRMABLE: new HttpError(
    409,
    'Only DRAFT or PENDING stock transfers can be confirmed',
    'STOCK_TRANSFER_NOT_CONFIRMABLE',
  ),
  STOCK_TRANSFER_HAS_NO_ITEMS: new HttpError(
    422,
    'Stock transfer has no items',
    'STOCK_TRANSFER_HAS_NO_ITEMS',
  ),
  SOURCE_STOCK_NOT_FOUND: new HttpError(
    409,
    'Source stock not found',
    'SOURCE_STOCK_NOT_FOUND',
  ),
  INSUFFICIENT_STOCK: new HttpError(
    409,
    'Insufficient source stock for transfer',
    'INSUFFICIENT_STOCK',
  ),
  LOCATION_WAREHOUSE_MISMATCH: new HttpError(
    422,
    'Transfer item location does not belong to expected warehouse',
    'LOCATION_WAREHOUSE_MISMATCH',
  ),
  STOCK_TRANSFER_NOT_REVERSIBLE: new HttpError(
    409,
    'Only CONFIRMED stock transfers can be reversed',
    'STOCK_TRANSFER_NOT_REVERSIBLE',
  ),
  REFERENCE_ALREADY_REVERSED: new HttpError(409, 'Reference already reversed', 'REFERENCE_ALREADY_REVERSED'),
  REVERSAL_INSUFFICIENT_STOCK: new HttpError(409, 'Insufficient destination stock to reverse transfer', 'REVERSAL_INSUFFICIENT_STOCK'),
};

export async function listStockTransfers(
  filters: StockTransfersFilters,
): Promise<StockTransfersRow[]> {
  return findStockTransfersRepository(filters);
}

export async function confirmStockTransfer(
  input: ConfirmStockTransferInput,
): Promise<ConfirmStockTransferResult> {
  try {
    return await confirmStockTransferTransaction(input);
  } catch (error) {
    if (error instanceof Error && confirmErrorMap[error.message]) {
      throw confirmErrorMap[error.message];
    }

    throw error;
  }
}

export async function reverseStockTransfer(
  input: ReverseStockTransferInput,
): Promise<ReverseStockTransferResult> {
  try {
    return await reverseStockTransferTransaction(input);
  } catch (error) {
    if (error instanceof Error && confirmErrorMap[error.message]) {
      throw confirmErrorMap[error.message];
    }

    throw error;
  }
}