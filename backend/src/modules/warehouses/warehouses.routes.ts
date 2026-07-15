import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { listWarehousesController } from './warehouses.controller';

export const warehousesRouter = Router();

warehousesRouter.get('/', asyncHandler(listWarehousesController));
