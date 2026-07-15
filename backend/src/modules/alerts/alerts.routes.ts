import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { listAlertsController } from './alerts.controller';

export const alertsRouter = Router();

alertsRouter.get('/', asyncHandler(listAlertsController));
