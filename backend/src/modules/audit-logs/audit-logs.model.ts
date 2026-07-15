import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type AuditLogsFilters = {
  id?: number;
  search?: string;
};

export type AuditLogsRow = RowDataPacket & Record<string, unknown>;
