import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { SettingsFilters, UpdateSettingInput } from './settings.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
});

const updateSettingSchema = z.object({
  settingValue: z.unknown(),
  description: z.string().trim().max(255).optional(),
});

export function parseSettingsFilters(input: unknown): SettingsFilters {
  return validateInput(filtersSchema, input);
}

export function parseSettingId(input: unknown): number {
  return validateInput(z.coerce.number().int().positive(), input);
}

export function parseUpdateSettingInput(
  input: unknown,
  updatedBy: number,
): UpdateSettingInput {
  return { ...validateInput(updateSettingSchema, input), updatedBy };
}
