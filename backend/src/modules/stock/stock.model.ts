import type { RowDataPacket } from 'mysql2';
import type { WarehouseScope } from '../../common/access/warehouse-scope';

export type QueryParams = Record<string, string | number | null>;

export type StockFilters = {
  warehouseId?: number;
  productVariantId?: number;
  /** Giới hạn theo kho người dùng phụ trách; bỏ trống nghĩa là không giới hạn. */
  warehouseScope?: WarehouseScope;
};

export type AllocationStrategy = 'FEFO' | 'FIFO';

export type StockAllocationInput = {
  warehouseId: number;
  productVariantId: number;
  quantity: number;
  strategy: AllocationStrategy;
};

export type StockAllocationCandidateRow = RowDataPacket & {
  stock_location_id: number;
  product_variant_id: number;
  location_id: number;
  location_code: string;
  batch_id: number | null;
  lot_number: string | null;
  manufacture_date: Date | null;
  expiry_date: Date | null;
  received_date: Date | null;
  available_quantity: number;
  requires_lot_tracking: 0 | 1;
  requires_expiry_tracking: 0 | 1;
};

export type StockAllocationItem = {
  stockLocationId: number;
  productVariantId: number;
  locationId: number;
  locationCode: string;
  batchId: number | null;
  lotNumber: string | null;
  expiryDate: Date | null;
  receivedDate: Date | null;
  quantity: number;
};

export type StockAllocationResult = {
  strategy: AllocationStrategy;
  requestedQuantity: number;
  allocatedQuantity: number;
  items: StockAllocationItem[];
};

export type CurrentStockRow = RowDataPacket & {
  stock_location_id: number;
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  zone_code: string;
  shelf_code: string;
  location_id: number;
  location_code: string;
  product_id: number;
  product_name: string;
  product_variant_id: number;
  sku: string;
  barcode: string | null;
  variant_name: string;
  batch_id: number | null;
  lot_number: string | null;
  expiry_date: Date | null;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  updated_at: Date;
};

export type NearExpiryStockRow = RowDataPacket & {
  warehouse_id: number;
  warehouse_code: string;
  product_variant_id: number;
  sku: string;
  product_name: string;
  batch_id: number;
  lot_number: string;
  expiry_date: Date;
  days_until_expiry: number;
  location_code: string;
  quantity: number;
  available_quantity: number;
};

export type QuickReceiveInput = {
  productScan: string;
  locationScan: string;
  quantity: number;
  lotNumber?: string;
  expiryDate?: string;
  note?: string;
  /** Phạm vi kho của người quét; kiểm ngay trong giao dịch trước khi ghi tồn. */
  warehouseScope?: WarehouseScope;
};

export type QuickReceiveResult = {
  transactionId: number;
  transactionCode: string;
  productVariantId: number;
  sku: string;
  productName: string;
  variantName: string;
  locationId: number;
  locationCode: string;
  warehouseId: number;
  warehouseCode: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  batchId: number | null;
  lotNumber: string | null;
};
