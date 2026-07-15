import type { Request, Response } from 'express';
import { listNotifications } from './notifications.service';
import { parseNotificationsFilters } from './notifications.validation';

export async function listNotificationsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseNotificationsFilters(req.query);

  res.json({ data: await listNotifications(filters) });
}
