import type { WarehouseScope } from '../../common/access/warehouse-scope';
import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type InventoryTransactionsFilters = {
  id?: number;
  search?: string;
  /** Giới hạn theo kho người dùng phụ trách; bỏ trống nghĩa là không giới hạn. */
  warehouseScope?: WarehouseScope;
};

export type InventoryTransactionsRow = RowDataPacket & Record<string, unknown>;
