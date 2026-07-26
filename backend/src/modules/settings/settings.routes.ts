import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  listSettingsController,
  seedDefaultSettingsController,
  updateSettingController,
} from './settings.controller';

export const settingsRouter = Router();

settingsRouter.get('/', asyncHandler(listSettingsController));
settingsRouter.post(
  '/seed-defaults',
  asyncHandler(verifyToken),
  requirePermission('settings:update'),
  asyncHandler(seedDefaultSettingsController),
);
settingsRouter.put(
  '/:id',
  asyncHandler(verifyToken),
  requirePermission('settings:update'),
  asyncHandler(updateSettingController),
);
