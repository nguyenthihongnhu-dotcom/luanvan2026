import type { Request, Response } from 'express';
import { HttpError } from '../../common/http';
import {
  generateAlerts,
  listAlerts,
  markAlertRead,
  resolveAlert,
} from './alerts.service';
import { parseAlertId, parseAlertsFilters } from './alerts.validation';

export async function listAlertsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseAlertsFilters(req.query);

  res.json({ data: await listAlerts(filters) });
}

export async function generateAlertsController(
  _req: Request,
  res: Response,
): Promise<void> {
  res.json({ data: await generateAlerts() });
}

export async function markAlertReadController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const alertId = parseAlertId(req.params.id);
  res.json({ data: await markAlertRead(alertId) });
}

export async function resolveAlertController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const alertId = parseAlertId(req.params.id);
  res.json({ data: await resolveAlert(alertId, Number(req.user.id)) });
}
