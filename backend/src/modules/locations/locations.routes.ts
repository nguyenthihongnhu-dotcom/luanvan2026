import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import {
  addLocationController,
  listLocationsController,
  removeLocationLayerController,
  removeShelfLocationsController,
} from './locations.controller';

export const locationsRouter = Router();

locationsRouter.get('/', asyncHandler(listLocationsController));
locationsRouter.post('/', asyncHandler(addLocationController));
locationsRouter.delete(
  '/shelf/:shelfId',
  asyncHandler(removeShelfLocationsController),
);
locationsRouter.delete('/layer', asyncHandler(removeLocationLayerController));
