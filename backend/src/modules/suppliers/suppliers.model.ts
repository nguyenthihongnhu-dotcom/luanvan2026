import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type SuppliersFilters = {
  id?: number;
  search?: string;
  status?: string;
};

export type SupplierInput = {
  code?: string;
  name: string;
  taxCode?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

export type SuppliersRow = RowDataPacket & Record<string, unknown>;
export type MutationResult = { affectedRows: number };
