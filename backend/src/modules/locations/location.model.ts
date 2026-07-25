import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type LocationStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'LOCKED'
  | 'MAINTENANCE'
  | 'FULL';

export type LocationType =
  | 'STANDARD'
  | 'COLD'
  | 'BULKY'
  | 'SECURE'
  | 'DAMAGED'
  | 'RETURN';

export type LocationFilters = {
  warehouseId?: number;
  status?: LocationStatus;
};

export type LocationRow = RowDataPacket & {
  id: number;
  code: string;
  name: string | null;
  layer_no: number;
  location_type: LocationType;
  status: LocationStatus;
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  zone_id: number;
  zone_code: string;
  zone_name: string;
  shelf_id: number;
  shelf_code: string;
  shelf_name: string;
  current_quantity: number;
  available_quantity: number;
  stored_products: string | null;
};

export type CreateLocationInput = {
  shelfId: number;
  code: string;
  layerNo: number;
  name?: string;
  locationType?: LocationType;
  maxCapacity?: number;
  notes?: string;
};

export type MutationResult = {
  affectedRows: number;
};

export type CreateLocationResult = {
  id: number;
};

export type CreateShelfInput = {
  zoneCode: string;
  warehouseId?: number;
  code?: string;
  name?: string;
  layerCount?: number;
};

export type CreateShelfResult = {
  id: number;
  code: string;
  createdLocationCount: number;
};
export type CreateZoneInput = {
  warehouseId?: number;
  code: string;
  name?: string;
  shelfCount?: number;
  layerCount?: number;
};

export type CreateZoneResult = {
  id: number;
  code: string;
  createdShelfCount: number;
  createdLocationCount: number;
};

export type ReorderShelvesInput = {
  shelfIds: number[];
};
export type LocationHistoryRow = RowDataPacket & {
  id: number;
  transaction_code: string;
  transaction_type: string;
  direction: 'IN' | 'OUT';
  quantity: string | number;
  quantity_before: string | number | null;
  quantity_after: string | number | null;
  reference_type: string | null;
  reference_id: number | null;
  reason_code: string | null;
  note: string | null;
  created_at: Date;
  sku: string;
  product_name: string;
  variant_name: string;
  performed_by_name: string | null;
};
