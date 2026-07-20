import type { Request, Response } from 'express';
import {
  generateNotifications,
  listNotifications,
} from './notifications.service';
import { parseNotificationsFilters } from './notifications.validation';

export async function listNotificationsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseNotificationsFilters(req.query);

  res.json({ data: await listNotifications(filters) });
}

export async function generateNotificationsController(
  _req: Request,
  res: Response,
): Promise<void> {
  res.json({ data: await generateNotifications() });
}
