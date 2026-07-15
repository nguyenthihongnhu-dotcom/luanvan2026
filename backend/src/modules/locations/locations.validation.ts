import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { CreateLocationInput, LocationFilters } from './location.model';

const locationStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'LOCKED',
  'MAINTENANCE',
  'FULL',
]);
const locationTypeSchema = z.enum([
  'STANDARD',
  'COLD',
  'BULKY',
  'SECURE',
  'DAMAGED',
  'RETURN',
]);

const locationFiltersSchema = z.object({
  warehouseId: z.coerce.number().int().positive().optional(),
  status: locationStatusSchema.optional(),
});

const createLocationSchema = z.object({
  shelfId: z.coerce.number().int().positive(),
  code: z.string().trim().min(1).max(100),
  layerNo: z.coerce.number().int().positive(),
  name: z.string().trim().max(120).optional(),
  locationType: locationTypeSchema.optional(),
  maxCapacity: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().max(500).optional(),
});

const layerDeleteSchema = z.object({
  shelfId: z.coerce.number().int().positive(),
  layerNo: z.coerce.number().int().positive(),
});

export function parseLocationFilters(input: unknown): LocationFilters {
  return validateInput(locationFiltersSchema, input);
}

export function parseCreateLocation(input: unknown): CreateLocationInput {
  return validateInput(createLocationSchema, input);
}

export function parseShelfId(input: unknown): number {
  return validateInput(z.coerce.number().int().positive(), input);
}

export function parseLayerDeleteQuery(input: unknown): {
  shelfId: number;
  layerNo: number;
} {
  return validateInput(layerDeleteSchema, input);
}
