import { Router } from 'express';
import { asyncHandler } from '../../common/http';
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

catalogRouter.get('/', asyncHandler(listCatalogController));
catalogRouter.get('/categories', asyncHandler(listCategoriesController));
catalogRouter.post('/categories', asyncHandler(createCategoryController));
catalogRouter.put('/categories/:id', asyncHandler(updateCategoryController));
catalogRouter.delete('/categories/:id', asyncHandler(deleteCategoryController));
catalogRouter.get('/products', asyncHandler(listProductsController));
catalogRouter.post('/products', asyncHandler(createProductController));
catalogRouter.put('/products/:id', asyncHandler(updateProductController));
catalogRouter.delete('/products/:id', asyncHandler(deleteProductController));
