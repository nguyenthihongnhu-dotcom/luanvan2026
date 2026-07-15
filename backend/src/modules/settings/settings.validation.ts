import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type { SettingsFilters } from './settings.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
});

export function parseSettingsFilters(input: unknown): SettingsFilters {
  return validateInput(filtersSchema, input);
}
