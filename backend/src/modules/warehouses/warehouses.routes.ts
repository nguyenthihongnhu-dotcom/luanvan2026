import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  createWarehouseController,
  deleteWarehouseController,
  listWarehousesController,
  updateWarehouseController,
} from './warehouses.controller';

export const warehousesRouter = Router();

warehousesRouter.get('/', asyncHandler(listWarehousesController));
warehousesRouter.post(
  '/',
  asyncHandler(verifyToken),
  requirePermission('warehouses:create'),
  asyncHandler(createWarehouseController),
);
warehousesRouter.put(
  '/:id',
  asyncHandler(verifyToken),
  requirePermission('warehouses:update'),
  asyncHandler(updateWarehouseController),
);
warehousesRouter.delete(
  '/:id',
  asyncHandler(verifyToken),
  requirePermission('warehouses:delete'),
  asyncHandler(deleteWarehouseController),
);
