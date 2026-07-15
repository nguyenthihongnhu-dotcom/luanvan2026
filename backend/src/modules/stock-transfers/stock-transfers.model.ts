import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type StockTransfersFilters = {
  id?: number;
  search?: string;
  status?: string;
};

export type StockTransferStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED';

export type StockTransfersRow = RowDataPacket & Record<string, unknown>;

export type StockTransferRow = RowDataPacket & {
  id: number;
  transfer_code: string;
  source_warehouse_id: number;
  destination_warehouse_id: number;
  status: StockTransferStatus;
};

export type StockTransferItemRow = RowDataPacket & {
  id: number;
  stock_transfer_id: number;
  product_variant_id: number;
  batch_id: number | null;
  source_location_id: number;
  destination_location_id: number;
  quantity: number;
  note: string | null;
};

export type ConfirmStockTransferInput = {
  transferId: number;
  confirmedBy: number;
};

export type ConfirmStockTransferResult = {
  transferId: number;
  transferCode: string;
  status: 'CONFIRMED';
  transactionCount: number;
};
