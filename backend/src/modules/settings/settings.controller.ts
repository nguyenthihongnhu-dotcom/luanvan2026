import type { Request, Response } from 'express';
import { HttpError } from '../../common/http';
import { listSettings, updateSetting } from './settings.service';
import {
  parseSettingId,
  parseSettingsFilters,
  parseUpdateSettingInput,
} from './settings.validation';

export async function listSettingsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseSettingsFilters(req.query);

  res.json({ data: await listSettings(filters) });
}

export async function updateSettingController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const id = parseSettingId(req.params.id);
  const input = parseUpdateSettingInput(req.body, Number(req.user.id));

  res.json({ data: await updateSetting(id, input) });
}
