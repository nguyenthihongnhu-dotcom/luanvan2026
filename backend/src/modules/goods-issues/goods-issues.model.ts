import type { RowDataPacket } from 'mysql2';
import type { AllocationStrategy } from '../stock/stock.model';

export type QueryParams = Record<string, string | number | null>;

export type GoodsIssuesFilters = {
  id?: number;
  search?: string;
  status?: string;
};

export type GoodsIssueStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export type GoodsIssuesRow = RowDataPacket & Record<string, unknown>;

export type GoodsIssueRow = RowDataPacket & {
  id: number;
  issue_code: string;
  warehouse_id: number;
  status: GoodsIssueStatus;
};

export type GoodsIssueItemRow = RowDataPacket & {
  id: number;
  goods_issue_id: number;
  product_variant_id: number;
  batch_id: number | null;
  location_id: number;
  quantity: number;
  note: string | null;
};

export type GoodsIssueDemand = {
  productVariantId: number;
  quantity: number;
};

export type ConfirmGoodsIssueInput = {
  issueId: number;
  confirmedBy: number;
  strategy: AllocationStrategy;
};

export type ConfirmGoodsIssueResult = {
  issueId: number;
  issueCode: string;
  status: 'CONFIRMED';
  strategy: AllocationStrategy;
  transactionCount: number;
};

export type ReverseGoodsIssueInput = {
  issueId: number;
  reversedBy: number;
};

export type ReverseGoodsIssueResult = {
  issueId: number;
  issueCode: string;
  status: 'CANCELLED';
  reversalCount: number;
};