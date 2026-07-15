import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type AttachmentsFilters = {
  id?: number;
  search?: string;
};

export type AttachmentsRow = RowDataPacket & Record<string, unknown>;
