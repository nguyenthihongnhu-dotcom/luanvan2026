import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { SupplierInput, SuppliersFilters } from './suppliers.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
  status: z.string().trim().min(1).max(50).optional(),
});

const supplierSchema = z.object({
  code: z.string().trim().min(1).max(50).optional(),
  name: z.string().trim().min(1).max(200),
  taxCode: z.string().trim().max(50).optional(),
  contactName: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email().max(191).optional(),
  address: z.string().trim().max(500).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export function parseSuppliersFilters(input: unknown): SuppliersFilters {
  return validateInput(filtersSchema, input);
}

export function parseSupplierInput(input: unknown): SupplierInput {
  return validateInput(supplierSchema, input);
}

export function parseSupplierId(input: unknown): number {
  return validateInput(z.coerce.number().int().positive(), input);
}
