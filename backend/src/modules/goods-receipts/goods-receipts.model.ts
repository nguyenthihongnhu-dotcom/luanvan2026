import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type GoodsReceiptsFilters = {
  id?: number;
  search?: string;
  status?: string;
};

export type GoodsReceiptStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED';

export type GoodsReceiptsRow = RowDataPacket & Record<string, unknown>;

export type GoodsReceiptRow = RowDataPacket & {
  id: number;
  receipt_code: string;
  warehouse_id: number;
  status: GoodsReceiptStatus;
};

export type GoodsReceiptItemRow = RowDataPacket & {
  id: number;
  goods_receipt_id: number;
  product_variant_id: number;
  batch_id: number | null;
  location_id: number;
  quantity: number;
  note: string | null;
  requires_lot_tracking: 0 | 1;
  requires_expiry_tracking: 0 | 1;
  expiry_date: Date | null;
};

export type ConfirmGoodsReceiptInput = {
  receiptId: number;
  confirmedBy: number;
};

export type ConfirmGoodsReceiptResult = {
  receiptId: number;
  receiptCode: string;
  status: 'CONFIRMED';
  transactionCount: number;
};

export type ReverseGoodsReceiptInput = {
  receiptId: number;
  reversedBy: number;
};

export type ReverseGoodsReceiptResult = {
  receiptId: number;
  receiptCode: string;
  status: 'CANCELLED';
  reversalCount: number;
};
export type CreateGoodsReceiptInput = {
  receiptCode: string;
  warehouseId?: number;
  supplierId?: number;
  referenceNo?: string;
  note?: string;
  createdBy?: number;
};
