import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  generateNotificationsController,
  listNotificationsController,
  markNotificationReadController,
} from './notifications.controller';

export const notificationsRouter = Router();

notificationsRouter.get('/', asyncHandler(listNotificationsController));
notificationsRouter.post(
  '/generate',
  asyncHandler(verifyToken),
  requirePermission('notifications:generate'),
  asyncHandler(generateNotificationsController),
);
notificationsRouter.patch(
  '/:id/read',
  asyncHandler(verifyToken),
  requirePermission('notifications:read'),
  asyncHandler(markNotificationReadController),
);
