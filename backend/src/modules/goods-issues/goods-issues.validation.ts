import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type {
  GoodsIssuesFilters,
  CreateGoodsIssueInput,
} from './goods-issues.model';
import type { AllocationStrategy } from '../stock/stock.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
  status: z.string().trim().min(1).max(50).optional(),
});

const confirmGoodsIssueSchema = z.object({
  strategy: z.enum(['FEFO', 'FIFO']).default('FEFO'),
});

export function parseGoodsIssuesFilters(input: unknown): GoodsIssuesFilters {
  return validateInput(filtersSchema, input);
}

export function parseGoodsIssueId(input: unknown): number {
  return validateInput(z.coerce.number().int().positive(), input);
}

export function parseConfirmGoodsIssueBody(input: unknown): {
  strategy: AllocationStrategy;
} {
  return validateInput(confirmGoodsIssueSchema, input);
}

const createGoodsIssueItemSchema = z.object({
  productVariantId: z.coerce.number().int().positive(),
  batchId: z.coerce.number().int().positive().nullable().optional(),
  locationId: z.coerce.number().int().positive().optional(),
  quantity: z.coerce.number().positive(),
  note: z.string().trim().max(500).optional(),
});

const createGoodsIssueSchema = z.object({
  // Bỏ trống thì hệ thống tự sinh theo dạng PX-YYYYMM-NNN.
  issueCode: z.string().trim().min(1).max(80).optional(),
  warehouseId: z.coerce.number().int().positive().optional(),
  referenceNo: z.string().trim().max(100).optional(),
  note: z.string().trim().max(500).optional(),
  createdBy: z.coerce.number().int().positive().optional(),
  // Bắt buộc có ít nhất một dòng hàng: không có endpoint thêm dòng vào phiếu đã tạo,
  // nên phiếu rỗng sẽ không bao giờ xác nhận được (GOODS_ISSUE_HAS_NO_ITEMS).
  items: z
    .array(createGoodsIssueItemSchema)
    .min(1, 'Phiếu xuất kho phải có ít nhất một dòng hàng'),
});

export function parseCreateGoodsIssue(input: unknown): CreateGoodsIssueInput {
  return validateInput(createGoodsIssueSchema, input);
}
