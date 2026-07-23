import { HttpError } from '../../common/http';
import type {
  AuthorizationFilters,
  AuthorizationRow,
  PermissionRow,
} from './authorization.model';
import {
  findAuthorization as findAuthorizationRepository,
  findAllPermissions as findAllPermissionsRepository,
  updateRolePermissionsInDb,
} from './authorization.repository';

export async function listAuthorization(
  filters: AuthorizationFilters,
): Promise<AuthorizationRow[]> {
  return findAuthorizationRepository(filters);
}

export async function listAllPermissions(): Promise<PermissionRow[]> {
  return findAllPermissionsRepository();
}

export async function updateRolePermissions(
  roleId: number,
  permissionCodes: string[],
): Promise<{ success: boolean }> {
  const success = await updateRolePermissionsInDb(roleId, permissionCodes);
  if (!success) {
    throw new HttpError(404, 'Role not found', 'ROLE_NOT_FOUND');
  }
  return { success: true };
}
