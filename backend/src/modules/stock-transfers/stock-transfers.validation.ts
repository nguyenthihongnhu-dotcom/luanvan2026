import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type {
  CreateStockTransferInput,
  StockTransfersFilters,
} from './stock-transfers.model';

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

const createStockTransferSchema = z.object({
  transferCode: z.string().trim().min(1).max(80).optional(),
  sourceWarehouseId: z.coerce.number().int().positive().optional(),
  destinationWarehouseId: z.coerce.number().int().positive().optional(),
  note: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        productVariantId: z.coerce.number().int().positive(),
        batchId: z.coerce.number().int().positive().nullable().optional(),
        sourceLocationId: z.coerce.number().int().positive(),
        destinationLocationId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().positive(),
        note: z.string().trim().max(500).optional(),
      }),
    )
    .min(1)
    .max(100),
});

export function parseCreateStockTransferInput(
  input: unknown,
): CreateStockTransferInput {
  return validateInput(createStockTransferSchema, input);
}
