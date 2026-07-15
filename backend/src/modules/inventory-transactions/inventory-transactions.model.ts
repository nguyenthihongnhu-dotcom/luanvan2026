import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type InventoryTransactionsFilters = {
  id?: number;
  search?: string;
};

export type InventoryTransactionsRow = RowDataPacket & Record<string, unknown>;
