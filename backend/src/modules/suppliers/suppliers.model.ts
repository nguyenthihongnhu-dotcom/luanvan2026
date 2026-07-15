import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type SuppliersFilters = {
  id?: number;
  search?: string;
  status?: string;
};

export type SuppliersRow = RowDataPacket & Record<string, unknown>;
