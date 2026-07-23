import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type AuthorizationFilters = {
  id?: number;
  search?: string;
};

export type AuthorizationRow = RowDataPacket & Record<string, unknown>;

export type PermissionRow = RowDataPacket & {
  id: number;
  code: string;
  name: string;
  module: string;
  description: string | null;
};

export type UpdateRolePermissionsInput = {
  permissionCodes: string[];
};
