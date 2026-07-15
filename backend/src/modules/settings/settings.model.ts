import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type SettingsFilters = {
  id?: number;
  search?: string;
};

export type SettingsRow = RowDataPacket & Record<string, unknown>;
