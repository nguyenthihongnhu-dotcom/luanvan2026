import type { Request, Response } from 'express';
import {
  listAuthorization,
  listAllPermissions,
  updateRolePermissions,
} from './authorization.service';
import {
  parseAuthorizationFilters,
  parseRoleId,
  parseUpdateRolePermissions,
} from './authorization.validation';

export async function listAuthorizationController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseAuthorizationFilters(req.query);

  res.json({ data: await listAuthorization(filters) });
}

export async function listAllPermissionsController(
  _req: Request,
  res: Response,
): Promise<void> {
  res.json({ data: await listAllPermissions() });
}

export async function updateRolePermissionsController(
  req: Request,
  res: Response,
): Promise<void> {
  const roleId = parseRoleId(req.params.id);
  const input = parseUpdateRolePermissions(req.body);

  const result = await updateRolePermissions(roleId, input.permissionCodes);

  res.json({ data: result });
}
