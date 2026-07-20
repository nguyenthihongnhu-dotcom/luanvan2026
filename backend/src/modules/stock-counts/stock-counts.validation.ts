import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type {
  CreateStockCountInput,
  RecordStockCountItemInput,
  StockCountsFilters,
} from './stock-counts.model';

const scopeTypeSchema = z.enum([
  'WAREHOUSE',
  'ZONE',
  'SHELF',
  'LOCATION',
  'SKU',
  'CATEGORY',
]);

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
  status: z.string().trim().min(1).max(50).optional(),
});

const createStockCountSchema = z
  .object({
    warehouseId: z.coerce.number().int().positive(),
    scopeType: scopeTypeSchema,
    scopeReferenceId: z.coerce.number().int().positive().optional(),
    assignedTo: z.coerce.number().int().positive().optional(),
    note: z.string().trim().max(500).optional(),
  })
  .superRefine((value, context) => {
    if (value.scopeType !== 'WAREHOUSE' && !value.scopeReferenceId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scopeReferenceId'],
        message: 'scopeReferenceId is required for this scope type',
      });
    }
  });

const recordStockCountItemSchema = z.object({
  actualQuantity: z.coerce.number().nonnegative(),
  reasonCode: z.string().trim().min(1).max(100).optional(),
  note: z.string().trim().max(500).optional(),
});

export function parseStockCountsFilters(input: unknown): StockCountsFilters {
  return validateInput(filtersSchema, input);
}

export function parseStockCountId(input: unknown): number {
  return validateInput(z.coerce.number().int().positive(), input);
}

export function parseStockCountItemId(input: unknown): number {
  return validateInput(z.coerce.number().int().positive(), input);
}

export function parseCreateStockCount(
  input: unknown,
  createdBy: number,
): CreateStockCountInput {
  return { ...validateInput(createStockCountSchema, input), createdBy };
}

export function parseRecordStockCountItem(
  input: unknown,
  stockCountId: number,
  itemId: number,
  countedBy: number,
): RecordStockCountItemInput {
  return {
    ...validateInput(recordStockCountItemSchema, input),
    stockCountId,
    itemId,
    countedBy,
  };
}
