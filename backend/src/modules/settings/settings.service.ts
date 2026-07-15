import type { SettingsFilters, SettingsRow } from './settings.model';
import { findSettings as findSettingsRepository } from './settings.repository';

export async function listSettings(
  filters: SettingsFilters,
): Promise<SettingsRow[]> {
  return findSettingsRepository(filters);
}
