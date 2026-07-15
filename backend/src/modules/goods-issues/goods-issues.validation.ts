import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { GoodsIssuesFilters } from './goods-issues.model';
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
