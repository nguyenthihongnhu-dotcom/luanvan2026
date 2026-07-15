import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type AlertsFilters = {
  id?: number;
  search?: string;
  status?: string;
};

export type AlertsRow = RowDataPacket & Record<string, unknown>;
