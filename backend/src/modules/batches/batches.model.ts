import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type BatchesFilters = {
  id?: number;
  search?: string;
  status?: string;
};

export type BatchesRow = RowDataPacket & Record<string, unknown>;
