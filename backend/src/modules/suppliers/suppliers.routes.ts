import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import {
  createSupplierController,
  deleteSupplierController,
  listSuppliersController,
  updateSupplierController,
} from './suppliers.controller';

export const suppliersRouter = Router();

suppliersRouter.get('/', asyncHandler(listSuppliersController));
suppliersRouter.post('/', asyncHandler(createSupplierController));
suppliersRouter.put('/:id', asyncHandler(updateSupplierController));
suppliersRouter.delete('/:id', asyncHandler(deleteSupplierController));
