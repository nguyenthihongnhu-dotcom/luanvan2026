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
  findStockCounts as findStockCountsRepository,
  recordStockCountItemTransaction,
  startStockCountTransaction,
  submitStockCountTransaction,
} from './stock-counts.repository';

const stockCountErrorMap: Record<string, HttpError> = {
  STOCK_COUNT_NOT_FOUND: new HttpError(
    404,
    'Stock count not found',
    'STOCK_COUNT_NOT_FOUND',
  ),
  STOCK_COUNT_ITEM_NOT_FOUND: new HttpError(
    404,
    'Stock count item not found',
    'STOCK_COUNT_ITEM_NOT_FOUND',
  ),
  STOCK_COUNT_SNAPSHOT_EMPTY: new HttpError(
    422,
    'Stock count scope has no stock to snapshot',
    'STOCK_COUNT_SNAPSHOT_EMPTY',
  ),
  STOCK_COUNT_NOT_STARTABLE: new HttpError(
    409,
    'Only DRAFT stock counts can be started',
    'STOCK_COUNT_NOT_STARTABLE',
  ),
  STOCK_COUNT_NOT_COUNTABLE: new HttpError(
    409,
    'Only IN_PROGRESS stock counts can be counted',
    'STOCK_COUNT_NOT_COUNTABLE',
  ),
  STOCK_COUNT_NOT_SUBMITTABLE: new HttpError(
    409,
    'Only IN_PROGRESS stock counts can be submitted',
    'STOCK_COUNT_NOT_SUBMITTABLE',
  ),
  STOCK_COUNT_NOT_APPROVABLE: new HttpError(
    409,
    'Only SUBMITTED stock counts can be approved',
    'STOCK_COUNT_NOT_APPROVABLE',
  ),
  STOCK_COUNT_HAS_NO_ITEMS: new HttpError(
    422,
    'Stock count has no items',
    'STOCK_COUNT_HAS_NO_ITEMS',
  ),
  STOCK_COUNT_HAS_UNCOUNTED_ITEMS: new HttpError(
    422,
    'All stock count items must be counted first',
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

export async function approveStockCount(
  input: ApproveStockCountInput,
): Promise<ApproveStockCountResult> {
  try {
    return await approveStockCountTransaction(input);
  } catch (error) {
    mapStockCountError(error);
  }
}
