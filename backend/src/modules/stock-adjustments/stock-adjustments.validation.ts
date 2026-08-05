import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type {
  RejectStockAdjustmentInput,
  StockAdjustmentsFilters,
  CreateStockAdjustmentInput,
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
const createStockAdjustmentItemSchema = z.object({
  productVariantId: z.coerce.number().int().positive(),
  batchId: z.coerce.number().int().positive().nullable().optional(),
  locationId: z.coerce.number().int().positive(),
  adjustmentDirection: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().positive(),
  reasonCode: z.string().trim().min(1).max(100).optional(),
  note: z.string().trim().max(500).optional(),
});

const createStockAdjustmentSchema = z.object({
  adjustmentCode: z.string().trim().min(1).max(80),
  warehouseId: z.coerce.number().int().positive().optional(),
  reasonCode: z.string().trim().min(1).max(100).optional(),
  note: z.string().trim().max(500).optional(),
  createdBy: z.coerce.number().int().positive().optional(),
  // Bắt buộc có ít nhất một dòng: không có endpoint thêm dòng vào phiếu đã tạo,
  // nên phiếu rỗng sẽ không bao giờ duyệt được (STOCK_ADJUSTMENT_HAS_NO_ITEMS).
  items: z
    .array(createStockAdjustmentItemSchema)
    .min(1, 'Phiếu điều chỉnh phải có ít nhất một dòng hàng'),
});

export function parseCreateStockAdjustment(
  input: unknown,
): CreateStockAdjustmentInput {
  return validateInput(createStockAdjustmentSchema, input);
}
