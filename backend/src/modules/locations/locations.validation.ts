import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type {
  CreateLocationInput,
  CreateLayerInput,
  CreateShelfInput,
  CreateZoneInput,
  ReorderShelvesInput,
  SyncLocationMatrixInput,
  LocationFilters,
  UpdateZoneLayoutInput,
  ZoneFilters,
} from './location.model';

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

const createZoneSchema = z.object({
  warehouseId: z.coerce.number().int().positive().optional(),
  code: z.string().trim().min(1).max(30).toUpperCase(),
  name: z.string().trim().max(100).optional(),
  shelfCount: z.coerce.number().int().positive().max(20).optional(),
  layerCount: z.coerce.number().int().positive().max(20).optional(),
  gridRow: z.coerce.number().int().min(0).max(200).nullable().optional(),
  gridCol: z.coerce.number().int().min(0).max(200).nullable().optional(),
  gridSize: z.coerce.number().int().positive().max(50).nullable().optional(),
});

const zoneFiltersSchema = z.object({
  warehouseId: z.coerce.number().int().positive(),
});

const updateZoneLayoutSchema = z.object({
  zoneId: z.coerce.number().int().positive(),
  gridRow: z.coerce.number().int().min(0).max(200).nullable(),
  gridCol: z.coerce.number().int().min(0).max(200).nullable(),
  gridSize: z.coerce.number().int().positive().max(50).nullable(),
  gridOrientation: z.enum(['HORIZONTAL', 'VERTICAL']).optional(),
});

const createShelfSchema = z.object({
  zoneCode: z.string().trim().min(1).max(30).toUpperCase(),
  warehouseId: z.coerce.number().int().positive().optional(),
  code: z.string().trim().min(1).max(30).optional(),
  name: z.string().trim().max(100).optional(),
  layerCount: z.coerce.number().int().positive().max(20).optional(),
});

const createLayerSchema = z.object({
  zoneCode: z.string().trim().min(1).max(30).toUpperCase(),
  warehouseId: z.coerce.number().int().positive().optional(),
  layerNo: z.coerce.number().int().positive().max(20).optional(),
});

const syncLocationMatrixSchema = z.object({
  zoneCode: z.string().trim().min(1).max(30).toUpperCase(),
  warehouseId: z.coerce.number().int().positive().optional(),
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

export function parseCreateShelf(input: unknown): CreateShelfInput {
  return validateInput(createShelfSchema, input);
}

export function parseCreateLayer(input: unknown): CreateLayerInput {
  return validateInput(createLayerSchema, input);
}

export function parseSyncLocationMatrix(
  input: unknown,
): SyncLocationMatrixInput {
  return validateInput(syncLocationMatrixSchema, input);
}

export function parseCreateZone(input: unknown): CreateZoneInput {
  return validateInput(createZoneSchema, input);
}

export function parseZoneFilters(input: unknown): ZoneFilters {
  return validateInput(zoneFiltersSchema, input);
}

export function parseUpdateZoneLayout(input: unknown): UpdateZoneLayoutInput {
  return validateInput(updateZoneLayoutSchema, input);
}

const reorderShelvesSchema = z.object({
  shelfIds: z.array(z.coerce.number().int().positive()).min(1).max(100),
});

export function parseReorderShelves(input: unknown): ReorderShelvesInput {
  return validateInput(reorderShelvesSchema, input);
}
