import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { AuditLogsFilters } from './audit-logs.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
});

export function parseAuditLogsFilters(input: unknown): AuditLogsFilters {
  return validateInput(filtersSchema, input);
}
