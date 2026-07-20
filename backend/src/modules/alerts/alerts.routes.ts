import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  generateAlertsController,
  listAlertsController,
} from './alerts.controller';

export const alertsRouter = Router();

alertsRouter.get('/', asyncHandler(listAlertsController));
alertsRouter.post(
  '/generate',
  asyncHandler(verifyToken),
  requirePermission('alerts:generate'),
  asyncHandler(generateAlertsController),
);
