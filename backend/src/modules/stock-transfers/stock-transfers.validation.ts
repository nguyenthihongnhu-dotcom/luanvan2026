import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { StockTransfersFilters } from './stock-transfers.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
  status: z.string().trim().min(1).max(50).optional(),
});

export function parseStockTransfersFilters(
  input: unknown,
): StockTransfersFilters {
  return validateInput(filtersSchema, input);
}

export function parseStockTransferId(input: unknown): number {
  return validateInput(z.coerce.number().int().positive(), input);
}
