import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { verifyToken } from '../auth/auth.module';
import {
  createSupplierController,
  deleteSupplierController,
  listSuppliersController,
  updateSupplierController,
} from './suppliers.controller';

export const suppliersRouter = Router();

suppliersRouter.get('/', asyncHandler(listSuppliersController));
// Thêm/sửa/xóa nhà cung cấp bắt buộc phải đăng nhập.
suppliersRouter.post(
  '/',
  asyncHandler(verifyToken),
  asyncHandler(createSupplierController),
);
suppliersRouter.put(
  '/:id',
  asyncHandler(verifyToken),
  asyncHandler(updateSupplierController),
);
suppliersRouter.delete(
  '/:id',
  asyncHandler(verifyToken),
  asyncHandler(deleteSupplierController),
);
