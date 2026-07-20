import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  approveStockAdjustmentController,
  cancelStockAdjustmentController,
  listStockAdjustmentsController,
  createStockAdjustmentController,
  rejectStockAdjustmentController,
} from './stock-adjustments.controller';

export const stockAdjustmentsRouter = Router();

stockAdjustmentsRouter.get('/', asyncHandler(listStockAdjustmentsController));
stockAdjustmentsRouter.post('/', asyncHandler(createStockAdjustmentController));
stockAdjustmentsRouter.post(
  '/:id/approve',
  asyncHandler(verifyToken),
  requirePermission('stock_adjustments:approve'),
  asyncHandler(approveStockAdjustmentController),
);
stockAdjustmentsRouter.post(
  '/:id/reject',
  asyncHandler(verifyToken),
  requirePermission('stock_adjustments:reject'),
  asyncHandler(rejectStockAdjustmentController),
);
stockAdjustmentsRouter.post(
  '/:id/cancel',
  asyncHandler(verifyToken),
  requirePermission('stock_adjustments:cancel'),
  asyncHandler(cancelStockAdjustmentController),
);
