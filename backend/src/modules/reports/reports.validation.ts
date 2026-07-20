import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { ReportsFilters } from './reports.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
  warehouseId: z.coerce.number().int().positive().optional(),
  productVariantId: z.coerce.number().int().positive().optional(),
  dateFrom: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateTo: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export function parseReportsFilters(input: unknown): ReportsFilters {
  return validateInput(filtersSchema, input);
}
