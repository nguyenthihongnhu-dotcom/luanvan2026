import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { ReportsFilters } from './reports.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
});

export function parseReportsFilters(input: unknown): ReportsFilters {
  return validateInput(filtersSchema, input);
}
