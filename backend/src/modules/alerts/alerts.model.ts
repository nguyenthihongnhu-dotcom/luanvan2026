import type { RowDataPacket } from 'mysql2';
import type { WarehouseScope } from '../../common/access/warehouse-scope';

export type QueryParams = Record<string, string | number | null>;

export type AlertsFilters = {
  id?: number;
  search?: string;
  status?: string;
  /** Giới hạn theo kho người dùng phụ trách; bỏ trống nghĩa là không giới hạn. */
  warehouseScope?: WarehouseScope;
};

export type AlertsRow = RowDataPacket & Record<string, unknown>;

export type AlertMutationResult = {
  affectedRows: number;
};
