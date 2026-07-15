import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  approveStockAdjustmentController,
  listStockAdjustmentsController,
} from './stock-adjustments.controller';

export const stockAdjustmentsRouter = Router();

stockAdjustmentsRouter.get('/', asyncHandler(listStockAdjustmentsController));
stockAdjustmentsRouter.post(
  '/:id/approve',
  asyncHandler(verifyToken),
  requirePermission('stock_adjustments:approve'),
  asyncHandler(approveStockAdjustmentController),
);
