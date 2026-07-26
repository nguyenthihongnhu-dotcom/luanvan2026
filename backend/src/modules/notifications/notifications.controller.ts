import type { Request, Response } from 'express';
import { HttpError } from '../../common/http';
import {
  generateNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './notifications.service';
import {
  parseNotificationId,
  parseNotificationsFilters,
} from './notifications.validation';

export async function listNotificationsController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const filters = parseNotificationsFilters(req.query);

  res.json({
    data: await listNotifications({
      ...filters,
      userId: Number(req.user.id),
    }),
  });
}

export async function generateNotificationsController(
  _req: Request,
  res: Response,
): Promise<void> {
  res.json({ data: await generateNotifications() });
}

export async function markNotificationReadController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const notificationId = parseNotificationId(req.params.id);
  res.json({
    data: await markNotificationRead(notificationId, Number(req.user.id)),
  });
}

export async function markAllNotificationsReadController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  res.json({ data: await markAllNotificationsRead(Number(req.user.id)) });
}
