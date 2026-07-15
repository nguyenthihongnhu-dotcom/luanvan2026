import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { listSettingsController } from './settings.controller';

export const settingsRouter = Router();

settingsRouter.get('/', asyncHandler(listSettingsController));
