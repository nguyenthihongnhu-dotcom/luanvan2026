import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  confirmStockTransferController,
  listStockTransfersController,
  reverseStockTransferController,
} from './stock-transfers.controller';

export const stockTransfersRouter = Router();

stockTransfersRouter.get('/', asyncHandler(listStockTransfersController));
stockTransfersRouter.post(
  '/:id/confirm',
  asyncHandler(verifyToken),
  requirePermission('stock_transfers:confirm'),
  asyncHandler(confirmStockTransferController),
);
stockTransfersRouter.post(
  '/:id/reverse',
  asyncHandler(verifyToken),
  requirePermission('stock_transfers:reverse'),
  asyncHandler(reverseStockTransferController),
);