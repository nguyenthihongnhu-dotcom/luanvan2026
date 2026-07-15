import type { Request, Response } from 'express';
import { listAlerts } from './alerts.service';
import { parseAlertsFilters } from './alerts.validation';

export async function listAlertsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseAlertsFilters(req.query);

  res.json({ data: await listAlerts(filters) });
}
