import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  generateAlertsController,
  listAlertsController,
  markAlertReadController,
  resolveAlertController,
} from './alerts.controller';

export const alertsRouter = Router();

alertsRouter.get('/', asyncHandler(listAlertsController));
alertsRouter.post(
  '/generate',
  asyncHandler(verifyToken),
  requirePermission('alerts:generate'),
  asyncHandler(generateAlertsController),
);
alertsRouter.patch(
  '/:id/read',
  asyncHandler(verifyToken),
  requirePermission('alerts:read'),
  asyncHandler(markAlertReadController),
);
alertsRouter.patch(
  '/:id/resolve',
  asyncHandler(verifyToken),
  requirePermission('alerts:resolve'),
  asyncHandler(resolveAlertController),
);
