import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type {
  AuthorizationFilters,
  UpdateRolePermissionsInput,
} from './authorization.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
});

const updateRolePermissionsSchema = z.object({
  permissionCodes: z.array(z.string().trim().min(1)),
});

export function parseAuthorizationFilters(
  input: unknown,
): AuthorizationFilters {
  return validateInput(filtersSchema, input);
}

export function parseRoleId(param: unknown): number {
  return validateInput(z.coerce.number().int().positive(), param);
}

export function parseUpdateRolePermissions(
  input: unknown,
): UpdateRolePermissionsInput {
  return validateInput(updateRolePermissionsSchema, input);
}
