import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type StockCountScopeType =
  | 'WAREHOUSE'
  | 'ZONE'
  | 'SHELF'
  | 'LOCATION'
  | 'SKU'
  | 'CATEGORY';

export type StockCountStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type StockCountsFilters = {
  id?: number;
  search?: string;
  status?: string;
};

export type StockCountsRow = RowDataPacket & Record<string, unknown>;

export type StockCountRow = RowDataPacket & {
  id: number;
  count_code: string;
  warehouse_id: number;
  scope_type: StockCountScopeType;
  scope_reference_id: number | null;
  status: StockCountStatus;
  assigned_to: number | null;
  created_by: number;
};

export type StockCountItemRow = RowDataPacket & {
  id: number;
  stock_count_id: number;
  product_variant_id: number;
  batch_id: number | null;
  location_id: number;
  system_quantity: number;
  actual_quantity: number | null;
  difference_quantity: number | null;
  reason_code: string | null;
  note: string | null;
};

export type SnapshotStockRow = RowDataPacket & {
  product_variant_id: number;
  batch_id: number | null;
  location_id: number;
  quantity: number;
};

export type CreateStockCountInput = {
  warehouseId: number;
  scopeType: StockCountScopeType;
  scopeReferenceId?: number;
  assignedTo?: number;
  note?: string;
  createdBy: number;
};

export type CreateStockCountResult = {
  stockCountId: number;
  countCode: string;
  status: 'DRAFT';
  itemCount: number;
};

export type StartStockCountInput = {
  stockCountId: number;
  startedBy: number;
};

export type StartStockCountResult = {
  stockCountId: number;
  countCode: string;
  status: 'IN_PROGRESS';
};

export type RecordStockCountItemInput = {
  stockCountId: number;
  itemId: number;
  actualQuantity: number;
  reasonCode?: string;
  note?: string;
  countedBy: number;
};

export type RecordStockCountItemResult = {
  itemId: number;
  actualQuantity: number;
  differenceQuantity: number;
};

export type SubmitStockCountInput = {
  stockCountId: number;
  submittedBy: number;
};

export type SubmitStockCountResult = {
  stockCountId: number;
  countCode: string;
  status: 'SUBMITTED';
  countedItems: number;
  totalItems: number;
};

export type ApproveStockCountInput = {
  stockCountId: number;
  approvedBy: number;
};

export type ApproveStockCountResult = {
  stockCountId: number;
  countCode: string;
  status: 'APPROVED';
  adjustmentId: number | null;
  adjustmentCode: string | null;
  adjustmentItemCount: number;
};
