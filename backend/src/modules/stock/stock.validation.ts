import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { QuickReceiveInput, StockAllocationInput, StockFilters } from './stock.model';

const stockFiltersSchema = z.object({
  warehouseId: z.coerce.number().int().positive().optional(),
  productVariantId: z.coerce.number().int().positive().optional(),
});

const nearExpiryFiltersSchema = stockFiltersSchema.pick({ warehouseId: true });


const quickReceiveSchema = z.object({
  productScan: z.string().trim().min(1).max(500),
  locationScan: z.string().trim().min(1).max(500),
  quantity: z.coerce.number().positive(),
  lotNumber: z.string().trim().min(1).max(100).optional(),
  expiryDate: z.string().trim().min(1).max(20).optional(),
  note: z.string().trim().max(500).optional(),
});
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

export function parseQuickReceiveInput(input: unknown): QuickReceiveInput {
  return validateInput(quickReceiveSchema, input);
}