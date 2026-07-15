import type { Request, Response } from 'express';
import { listSettings } from './settings.service';
import { parseSettingsFilters } from './settings.validation';

export async function listSettingsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseSettingsFilters(req.query);

  res.json({ data: await listSettings(filters) });
}
