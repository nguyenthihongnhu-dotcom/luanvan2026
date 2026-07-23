import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { WarehouseInput, WarehousesFilters } from './warehouses.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
  status: z.string().trim().min(1).max(50).optional(),
});

const warehouseInputSchema = z.object({
  code: z.string().trim().min(1).max(50).toUpperCase(),
  name: z.string().trim().min(1).max(150),
  addressLine: z.string().trim().min(1).max(255).optional(),
  ward: z.string().trim().min(1).max(100).optional(),
  district: z.string().trim().min(1).max(100).optional(),
  province: z.string().trim().min(1).max(100).optional(),
  managerUserId: z.coerce.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  description: z.string().trim().min(1).max(1000).optional(),
});

export function parseWarehousesFilters(input: unknown): WarehousesFilters {
  return validateInput(filtersSchema, input);
}

export function parseWarehouseInput(input: unknown): WarehouseInput {
  return validateInput(warehouseInputSchema, input);
}
