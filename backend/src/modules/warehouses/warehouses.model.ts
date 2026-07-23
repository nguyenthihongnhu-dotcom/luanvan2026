import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type WarehousesFilters = {
  id?: number;
  search?: string;
  status?: string;
};

export type WarehousesRow = RowDataPacket & Record<string, unknown>;

export type WarehouseInput = {
  code: string;
  name: string;
  addressLine?: string;
  ward?: string;
  district?: string;
  province?: string;
  managerUserId?: number;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
};

export type WarehouseMutationResult = {
  affectedRows: number;
  insertId?: number;
};
