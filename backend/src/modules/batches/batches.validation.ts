import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type {
  BatchesFilters,
  CreateBatchInput,
  UpdateBatchInput,
} from './batches.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
  status: z.string().trim().min(1).max(50).optional(),
  productVariantId: z.coerce.number().int().positive().optional(),
});

const updateBatchSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    supplierId: z.coerce.number().int().positive().nullable().optional(),
    manufactureDate: z.string().trim().optional().nullable(),
    expiryDate: z.string().trim().optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
    // Chỉ cho đặt tay hai trạng thái này; cận hạn và hết hạn được tính từ expiry_date khi đọc.
    status: z.enum(['ACTIVE', 'BLOCKED']).optional(),
  })
  .refine(
    (value) =>
      !value.manufactureDate ||
      !value.expiryDate ||
      new Date(value.expiryDate) > new Date(value.manufactureDate),
    { message: 'Hạn sử dụng phải sau ngày sản xuất', path: ['expiryDate'] },
  );

const createBatchSchema = z
  .object({
    productVariantId: z.coerce.number().int().positive(),
    supplierId: z.coerce.number().int().positive().nullable().optional(),
    lotNumber: z.string().trim().min(1, 'Số lô không được để trống').max(100),
    manufactureDate: z.string().trim().optional().nullable(),
    expiryDate: z.string().trim().optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
  })
  // Bắt sớm ở đây cho thông báo rõ ràng, thay vì để vướng ràng buộc chk_batch_dates dưới CSDL.
  .refine(
    (value) =>
      !value.manufactureDate ||
      !value.expiryDate ||
      new Date(value.expiryDate) > new Date(value.manufactureDate),
    { message: 'Hạn sử dụng phải sau ngày sản xuất', path: ['expiryDate'] },
  );

export function parseBatchesFilters(input: unknown): BatchesFilters {
  return validateInput(filtersSchema, input);
}

export function parseCreateBatchInput(input: unknown): CreateBatchInput {
  return validateInput(createBatchSchema, input);
}

export function parseUpdateBatchInput(input: unknown): UpdateBatchInput {
  return validateInput(updateBatchSchema, input);
}

export function parseBatchId(input: unknown): number {
  return validateInput(z.coerce.number().int().positive(), input);
}
