import { HttpError } from '../../common/http';
import type {
  SettingMutationResult,
  SettingsFilters,
  SettingsRow,
  UpdateSettingInput,
} from './settings.model';
import {
  findSettings as findSettingsRepository,
  updateSettingRepository,
} from './settings.repository';

export async function listSettings(
  filters: SettingsFilters,
): Promise<SettingsRow[]> {
  return findSettingsRepository(filters);
}

export async function updateSetting(
  id: number,
  input: UpdateSettingInput,
): Promise<SettingMutationResult> {
  const affectedRows = await updateSettingRepository(id, input);
  if (affectedRows === 0) {
    throw new HttpError(404, 'Setting not found', 'SETTING_NOT_FOUND');
  }
  return { affectedRows };
}
