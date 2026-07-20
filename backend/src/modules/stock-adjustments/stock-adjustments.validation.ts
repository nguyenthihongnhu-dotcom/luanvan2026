import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type {
  RejectStockAdjustmentInput,
  StockAdjustmentsFilters,
} from './stock-adjustments.model';

const rejectStockAdjustmentSchema = z.object({
  rejectionReason: z.string().trim().min(1).max(500),
});

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

export function parseRejectStockAdjustment(
  input: unknown,
  adjustmentId: number,
  rejectedBy: number,
): RejectStockAdjustmentInput {
  return {
    adjustmentId,
    rejectedBy,
    ...validateInput(rejectStockAdjustmentSchema, input),
  };
}