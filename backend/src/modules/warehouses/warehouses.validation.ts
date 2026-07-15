import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { WarehousesFilters } from './warehouses.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
  status: z.string().trim().min(1).max(50).optional(),
});

export function parseWarehousesFilters(input: unknown): WarehousesFilters {
  return validateInput(filtersSchema, input);
}
