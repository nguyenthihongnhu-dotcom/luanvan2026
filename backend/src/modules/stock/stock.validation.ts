import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { StockAllocationInput, StockFilters } from './stock.model';

const stockFiltersSchema = z.object({
  warehouseId: z.coerce.number().int().positive().optional(),
  productVariantId: z.coerce.number().int().positive().optional(),
});

const nearExpiryFiltersSchema = stockFiltersSchema.pick({ warehouseId: true });

const stockAllocationSchema = z.object({
  warehouseId: z.coerce.number().int().positive(),
  productVariantId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  strategy: z.enum(['FEFO', 'FIFO']).default('FEFO'),
});

export function parseStockFilters(input: unknown): StockFilters {
  return validateInput(stockFiltersSchema, input);
}

export function parseNearExpiryFilters(
  input: unknown,
): Pick<StockFilters, 'warehouseId'> {
  return validateInput(nearExpiryFiltersSchema, input);
}

export function parseStockAllocationInput(
  input: unknown,
): StockAllocationInput {
  return validateInput(stockAllocationSchema, input);
}
