import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type WarehousesFilters = {
  id?: number;
  search?: string;
  status?: string;
};

export type WarehousesRow = RowDataPacket & Record<string, unknown>;
