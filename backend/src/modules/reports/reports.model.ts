import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type ReportsFilters = {
  id?: number;
  search?: string;
};

export type ReportsRow = RowDataPacket & Record<string, unknown>;
