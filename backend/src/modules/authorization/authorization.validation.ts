import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { AuthorizationFilters } from './authorization.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
});

export function parseAuthorizationFilters(
  input: unknown,
): AuthorizationFilters {
  return validateInput(filtersSchema, input);
}
