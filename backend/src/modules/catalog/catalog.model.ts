import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type CatalogFilters = {
  id?: number;
  search?: string;
  status?: string;
};

export type CatalogRow = RowDataPacket & Record<string, unknown>;
