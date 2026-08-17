import type { WarehouseScope } from '../../common/access/warehouse-scope';
import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type ReportsFilters = {
  /** Giới hạn theo kho người dùng phụ trách; bỏ trống nghĩa là không giới hạn. */
  warehouseScope?: WarehouseScope;
  id?: number;
  search?: string;
  warehouseId?: number;
  productVariantId?: number;
  dateFrom?: string;
  dateTo?: string;
};

export type ReportsRow = RowDataPacket & Record<string, unknown>;
