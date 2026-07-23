import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type {
  GoodsReceiptsFilters,
  CreateGoodsReceiptInput,
} from './goods-receipts.model';

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

const createGoodsReceiptItemSchema = z.object({
  productVariantId: z.coerce.number().int().positive(),
  batchId: z.coerce.number().int().positive().nullable().optional(),
  locationId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().nonnegative().nullable().optional(),
  note: z.string().trim().max(500).optional(),
});

const createGoodsReceiptSchema = z.object({
  receiptCode: z.string().trim().min(1).max(80),
  warehouseId: z.coerce.number().int().positive().optional(),
  supplierId: z.coerce.number().int().positive().optional(),
  referenceNo: z.string().trim().max(100).optional(),
  note: z.string().trim().max(500).optional(),
  createdBy: z.coerce.number().int().positive().optional(),
  items: z.array(createGoodsReceiptItemSchema).min(1).optional(),
});

export function parseCreateGoodsReceipt(
  input: unknown,
): CreateGoodsReceiptInput {
  return validateInput(createGoodsReceiptSchema, input);
}
