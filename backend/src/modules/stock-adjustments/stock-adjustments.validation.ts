import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { StockAdjustmentsFilters } from './stock-adjustments.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
  status: z.string().trim().min(1).max(50).optional(),
});

export function parseStockAdjustmentsFilters(
  input: unknown,
): StockAdjustmentsFilters {
  return validateInput(filtersSchema, input);
}

export function parseStockAdjustmentId(input: unknown): number {
  return validateInput(z.coerce.number().int().positive(), input);
}
