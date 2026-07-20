import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import {
  addLocationController,
  addShelfController,
  addZoneController,
  listLocationsController,
  removeLocationLayerController,
  removeShelfLocationsController,
} from './locations.controller';

export const locationsRouter = Router();

locationsRouter.get('/', asyncHandler(listLocationsController));
locationsRouter.post('/', asyncHandler(addLocationController));
locationsRouter.post('/shelves', asyncHandler(addShelfController));
locationsRouter.post('/zones', asyncHandler(addZoneController));
locationsRouter.delete(
  '/shelf/:shelfId',
  asyncHandler(removeShelfLocationsController),
);
locationsRouter.delete('/layer', asyncHandler(removeLocationLayerController));
