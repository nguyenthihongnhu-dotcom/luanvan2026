import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { AlertsFilters } from './alerts.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
  status: z.string().trim().min(1).max(50).optional(),
});

export function parseAlertsFilters(input: unknown): AlertsFilters {
  return validateInput(filtersSchema, input);
}
