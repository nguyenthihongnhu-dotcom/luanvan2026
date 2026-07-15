import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { GoodsReceiptsFilters } from './goods-receipts.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
  status: z.string().trim().min(1).max(50).optional(),
});

export function parseGoodsReceiptsFilters(
  input: unknown,
): GoodsReceiptsFilters {
  return validateInput(filtersSchema, input);
}

export function parseGoodsReceiptId(input: unknown): number {
  return validateInput(z.coerce.number().int().positive(), input);
}
