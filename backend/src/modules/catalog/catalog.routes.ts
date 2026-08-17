import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { verifyToken } from '../auth/auth.module';
import {
  createCategoryController,
  createProductController,
  deleteCategoryController,
  deleteProductController,
  listCatalogController,
  listCategoriesController,
  listProductsController,
  updateCategoryController,
  updateProductController,
} from './catalog.controller';

export const catalogRouter = Router();

catalogRouter.get(
  '/',

  asyncHandler(verifyToken),

  asyncHandler(listCatalogController),
);
catalogRouter.get(
  '/categories',
  asyncHandler(verifyToken),
  asyncHandler(listCategoriesController),
);
// Thêm/sửa/xóa danh mục và sản phẩm bắt buộc phải đăng nhập.
catalogRouter.post(
  '/categories',
  asyncHandler(verifyToken),
  asyncHandler(createCategoryController),
);
catalogRouter.put(
  '/categories/:id',
  asyncHandler(verifyToken),
  asyncHandler(updateCategoryController),
);
catalogRouter.delete(
  '/categories/:id',
  asyncHandler(verifyToken),
  asyncHandler(deleteCategoryController),
);
catalogRouter.get(
  '/products',
  asyncHandler(verifyToken),
  asyncHandler(listProductsController),
);
catalogRouter.post(
  '/products',
  asyncHandler(verifyToken),
  asyncHandler(createProductController),
);
catalogRouter.put(
  '/products/:id',
  asyncHandler(verifyToken),
  asyncHandler(updateProductController),
);
catalogRouter.delete(
  '/products/:id',
  asyncHandler(verifyToken),
  asyncHandler(deleteProductController),
);
