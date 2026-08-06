import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { verifyToken } from '../auth/auth.module';
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
// Mọi thao tác đổi cấu trúc kho đều phải đăng nhập: trước đây nhóm route này
// không có guard nào nên gọi thẳng từ bên ngoài là sửa được sơ đồ kho.
locationsRouter.post(
  '/',
  asyncHandler(verifyToken),
  asyncHandler(addLocationController),
);
locationsRouter.post(
  '/shelves',
  asyncHandler(verifyToken),
  asyncHandler(addShelfController),
);
locationsRouter.post(
  '/layers',
  asyncHandler(verifyToken),
  asyncHandler(addLayerController),
);
locationsRouter.post(
  '/sync-matrix',
  asyncHandler(verifyToken),
  asyncHandler(syncLocationMatrixController),
);
locationsRouter.put(
  '/shelves/reorder',
  asyncHandler(verifyToken),
  asyncHandler(reorderShelvesController),
);
locationsRouter.post(
  '/zones',
  asyncHandler(verifyToken),
  asyncHandler(addZoneController),
);
locationsRouter.put(
  '/zones/:id/layout',
  asyncHandler(verifyToken),
  asyncHandler(updateZoneLayoutController),
);
locationsRouter.delete(
  '/shelf/:shelfId',
  asyncHandler(verifyToken),
  asyncHandler(removeShelfLocationsController),
);
locationsRouter.delete(
  '/layer',
  asyncHandler(verifyToken),
  asyncHandler(removeLocationLayerController),
);
