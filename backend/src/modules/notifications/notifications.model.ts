import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type NotificationsFilters = {
  id?: number;
  search?: string;
};

export type NotificationsRow = RowDataPacket & Record<string, unknown>;
