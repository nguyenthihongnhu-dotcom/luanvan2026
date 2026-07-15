import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { InventoryTransactionsFilters } from './inventory-transactions.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
});

export function parseInventoryTransactionsFilters(
  input: unknown,
): InventoryTransactionsFilters {
  return validateInput(filtersSchema, input);
}
