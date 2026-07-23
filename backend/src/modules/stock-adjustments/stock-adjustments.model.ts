import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type StockAdjustmentsFilters = {
  id?: number;
  search?: string;
  status?: string;
};

export type StockAdjustmentStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type StockAdjustmentsRow = RowDataPacket & Record<string, unknown>;

export type StockAdjustmentRow = RowDataPacket & {
  id: number;
  adjustment_code: string;
  warehouse_id: number;
  adjustment_type: 'COUNT' | 'MANUAL';
  status: StockAdjustmentStatus;
  created_by: number;
};

export type StockAdjustmentItemRow = RowDataPacket & {
  id: number;
  stock_adjustment_id: number;
  product_variant_id: number;
  batch_id: number | null;
  location_id: number;
  adjustment_direction: 'IN' | 'OUT';
  quantity: number;
  reason_code: string;
  note: string | null;
};

export type ApproveStockAdjustmentInput = {
  adjustmentId: number;
  approvedBy: number;
};

export type ApproveStockAdjustmentResult = {
  adjustmentId: number;
  adjustmentCode: string;
  status: 'APPROVED';
  transactionCount: number;
};

export type RejectStockAdjustmentInput = {
  adjustmentId: number;
  rejectedBy: number;
  rejectionReason: string;
};

export type RejectStockAdjustmentResult = {
  adjustmentId: number;
  adjustmentCode: string;
  status: 'REJECTED';
};

export type CancelStockAdjustmentInput = {
  adjustmentId: number;
  cancelledBy: number;
};

export type CancelStockAdjustmentResult = {
  adjustmentId: number;
  adjustmentCode: string;
  status: 'CANCELLED';
};
export type CreateStockAdjustmentItemInput = {
  productVariantId: number;
  batchId?: number | null;
  locationId: number;
  adjustmentDirection: 'IN' | 'OUT';
  quantity: number;
  reasonCode?: string;
  note?: string;
};

export type CreateStockAdjustmentInput = {
  adjustmentCode: string;
  warehouseId?: number;
  reasonCode?: string;
  note?: string;
  createdBy?: number;
  items?: CreateStockAdjustmentItemInput[];
};
