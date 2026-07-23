import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import {
  addLocationController,
  addShelfController,
  addZoneController,
  listLocationsController,
  listLocationHistoryController,
  removeLocationLayerController,
  removeShelfLocationsController,
  reorderShelvesController,
} from './locations.controller';

export const locationsRouter = Router();

locationsRouter.get('/', asyncHandler(listLocationsController));
locationsRouter.get(
  '/:id/history',
  asyncHandler(listLocationHistoryController),
);
locationsRouter.post('/', asyncHandler(addLocationController));
locationsRouter.post('/shelves', asyncHandler(addShelfController));
locationsRouter.put('/shelves/reorder', asyncHandler(reorderShelvesController));
locationsRouter.post('/zones', asyncHandler(addZoneController));
locationsRouter.delete(
  '/shelf/:shelfId',
  asyncHandler(removeShelfLocationsController),
);
locationsRouter.delete('/layer', asyncHandler(removeLocationLayerController));
