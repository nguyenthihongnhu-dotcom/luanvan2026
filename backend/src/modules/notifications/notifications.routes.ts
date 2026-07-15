import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { listNotificationsController } from './notifications.controller';

export const notificationsRouter = Router();

notificationsRouter.get('/', asyncHandler(listNotificationsController));
