import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type StockCountsFilters = {
  id?: number;
  search?: string;
  status?: string;
};

export type StockCountsRow = RowDataPacket & Record<string, unknown>;
