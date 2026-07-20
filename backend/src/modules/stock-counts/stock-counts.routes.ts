import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  approveStockCountController,
  createStockCountController,
  listStockCountItemsController,
  listStockCountsController,
  recordStockCountItemController,
  startStockCountController,
  submitStockCountController,
} from './stock-counts.controller';

export const stockCountsRouter = Router();

stockCountsRouter.get('/', asyncHandler(listStockCountsController));
stockCountsRouter.get('/:id/items', asyncHandler(listStockCountItemsController));
stockCountsRouter.post(
  '/',
  asyncHandler(verifyToken),
  requirePermission('stock_counts:create'),
  asyncHandler(createStockCountController),
);
stockCountsRouter.post(
  '/:id/start',
  asyncHandler(verifyToken),
  requirePermission('stock_counts:start'),
  asyncHandler(startStockCountController),
);
stockCountsRouter.patch(
  '/:id/items/:itemId/count',
  asyncHandler(verifyToken),
  requirePermission('stock_counts:count'),
  asyncHandler(recordStockCountItemController),
);
stockCountsRouter.post(
  '/:id/submit',
  asyncHandler(verifyToken),
  requirePermission('stock_counts:submit'),
  asyncHandler(submitStockCountController),
);
stockCountsRouter.post(
  '/:id/approve',
  asyncHandler(verifyToken),
  requirePermission('stock_counts:approve'),
  asyncHandler(approveStockCountController),
);
