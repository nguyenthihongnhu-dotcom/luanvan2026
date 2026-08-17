import type { WarehouseScope } from '../../common/access/warehouse-scope';
import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type StockTransfersFilters = {
  id?: number;
  search?: string;
  status?: string;
  /** Giới hạn theo kho người dùng phụ trách; bỏ trống nghĩa là không giới hạn. */
  warehouseScope?: WarehouseScope;
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

export type ReverseStockTransferInput = {
  transferId: number;
  reversedBy: number;
};

export type ReverseStockTransferResult = {
  transferId: number;
  transferCode: string;
  status: 'CANCELLED';
  reversalCount: number;
};

export type CreateStockTransferItemInput = {
  productVariantId: number;
  batchId?: number | null;
  sourceLocationId: number;
  destinationLocationId: number;
  quantity: number;
  note?: string;
};

export type CreateStockTransferInput = {
  transferCode?: string;
  sourceWarehouseId?: number;
  destinationWarehouseId?: number;
  note?: string;
  createdBy?: number;
  items: CreateStockTransferItemInput[];
};

export type CreateStockTransferResult = {
  id: number;
  transferCode: string;
  itemCount: number;
};
