import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import {
  addLocationController,
  addLayerController,
  addShelfController,
  addZoneController,
  listLocationsController,
  listLocationHistoryController,
  listZonesController,
  removeLocationLayerController,
  removeShelfLocationsController,
  reorderShelvesController,
  syncLocationMatrixController,
  updateZoneLayoutController,
} from './locations.controller';

export const locationsRouter = Router();

locationsRouter.get('/', asyncHandler(listLocationsController));
// Phải khai báo trước '/:id/history' để 'zones' không bị bắt nhầm thành :id
locationsRouter.get('/zones', asyncHandler(listZonesController));
locationsRouter.get(
  '/:id/history',
  asyncHandler(listLocationHistoryController),
);
locationsRouter.post('/', asyncHandler(addLocationController));
locationsRouter.post('/shelves', asyncHandler(addShelfController));
locationsRouter.post('/layers', asyncHandler(addLayerController));
locationsRouter.post(
  '/sync-matrix',
  asyncHandler(syncLocationMatrixController),
);
locationsRouter.put('/shelves/reorder', asyncHandler(reorderShelvesController));
locationsRouter.post('/zones', asyncHandler(addZoneController));
locationsRouter.put(
  '/zones/:id/layout',
  asyncHandler(updateZoneLayoutController),
);
locationsRouter.delete(
  '/shelf/:shelfId',
  asyncHandler(removeShelfLocationsController),
);
locationsRouter.delete('/layer', asyncHandler(removeLocationLayerController));
