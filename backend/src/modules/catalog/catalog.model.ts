import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type CatalogFilters = {
  id?: number;
  search?: string;
  status?: string;
};

export type CategoryInput = {
  code?: string;
  name: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

export type ProductInput = {
  sku: string;
  name: string;
  category: string;
  stock?: number;
  minStock?: number;
  expiryDate?: string;
};

export type CatalogRow = RowDataPacket & Record<string, unknown>;
export type MutationResult = { affectedRows: number };
