import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type {
  CatalogFilters,
  CategoryInput,
  ProductInput,
} from './catalog.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
  status: z.string().trim().min(1).max(50).optional(),
});

const categorySchema = z.object({
  code: z.string().trim().min(1).max(50).optional(),
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(500).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const productSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(150),
  minStock: z.coerce.number().nonnegative().optional(),
  requiresLotTracking: z.coerce.boolean().optional(),
  requiresExpiryTracking: z.coerce.boolean().optional(),
});

export function parseCatalogFilters(input: unknown): CatalogFilters {
  return validateInput(filtersSchema, input);
}

export function parseCategoryInput(input: unknown): CategoryInput {
  return validateInput(categorySchema, input);
}

export function parseProductInput(input: unknown): ProductInput {
  return validateInput(productSchema, input);
}

export function parseCatalogId(input: unknown): number {
  return validateInput(z.coerce.number().int().positive(), input);
}
