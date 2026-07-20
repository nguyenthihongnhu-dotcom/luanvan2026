import { HttpError } from '../../common/http';
import type {
  ConfirmGoodsIssueInput,
  ConfirmGoodsIssueResult,
  GoodsIssuesFilters,
  CreateGoodsIssueInput,
  GoodsIssuesRow,
  ReverseGoodsIssueInput,
  ReverseGoodsIssueResult,
} from './goods-issues.model';
import {
  confirmGoodsIssueTransaction,
  findGoodsIssues as findGoodsIssuesRepository,
  insertGoodsIssue,
  reverseGoodsIssueTransaction,
} from './goods-issues.repository';

const confirmErrorMap: Record<string, HttpError> = {
  GOODS_ISSUE_NOT_FOUND: new HttpError(
    404,
    'Goods issue not found',
    'GOODS_ISSUE_NOT_FOUND',
  ),
  GOODS_ISSUE_NOT_CONFIRMABLE: new HttpError(
    409,
    'Only DRAFT or PENDING goods issues can be confirmed',
    'GOODS_ISSUE_NOT_CONFIRMABLE',
  ),
  GOODS_ISSUE_HAS_NO_ITEMS: new HttpError(
    422,
    'Goods issue has no items',
    'GOODS_ISSUE_HAS_NO_ITEMS',
  ),
  BATCH_REQUIRED: new HttpError(
    422,
    'Lot-tracked products require batch_id before issuing',
    'BATCH_REQUIRED',
  ),
  EXPIRY_DATE_REQUIRED: new HttpError(
    422,
    'FEFO requires expiry_date for expiry-tracked products',
    'EXPIRY_DATE_REQUIRED',
  ),
  INSUFFICIENT_STOCK: new HttpError(
    409,
    'Insufficient stock for goods issue confirmation',
    'INSUFFICIENT_STOCK',
  ),
  CONCURRENT_STOCK_UPDATE: new HttpError(
    409,
    'Stock changed while confirming goods issue',
    'CONCURRENT_STOCK_UPDATE',
  ),
  GOODS_ISSUE_NOT_REVERSIBLE: new HttpError(
    409,
    'Only CONFIRMED goods issues can be reversed',
    'GOODS_ISSUE_NOT_REVERSIBLE',
  ),
  REFERENCE_ALREADY_REVERSED: new HttpError(
    409,
    'Reference already reversed',
    'REFERENCE_ALREADY_REVERSED',
  ),
};

export async function listGoodsIssues(
  filters: GoodsIssuesFilters,
): Promise<GoodsIssuesRow[]> {
  return findGoodsIssuesRepository(filters);
}

export async function confirmGoodsIssue(
  input: ConfirmGoodsIssueInput,
): Promise<ConfirmGoodsIssueResult> {
  try {
    return await confirmGoodsIssueTransaction(input);
  } catch (error) {
    if (error instanceof Error && confirmErrorMap[error.message]) {
      throw confirmErrorMap[error.message];
    }

    throw error;
  }
}

export async function reverseGoodsIssue(
  input: ReverseGoodsIssueInput,
): Promise<ReverseGoodsIssueResult> {
  try {
    return await reverseGoodsIssueTransaction(input);
  } catch (error) {
    if (error instanceof Error && confirmErrorMap[error.message]) {
      throw confirmErrorMap[error.message];
    }

    throw error;
  }
}
export async function createGoodsIssue(
  input: CreateGoodsIssueInput,
): Promise<{ id: number }> {
  return insertGoodsIssue(input);
}
