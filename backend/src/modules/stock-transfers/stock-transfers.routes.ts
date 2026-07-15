import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  confirmStockTransferController,
  listStockTransfersController,
} from './stock-transfers.controller';

export const stockTransfersRouter = Router();

stockTransfersRouter.get('/', asyncHandler(listStockTransfersController));
stockTransfersRouter.post(
  '/:id/confirm',
  asyncHandler(verifyToken),
  requirePermission('stock_transfers:confirm'),
  asyncHandler(confirmStockTransferController),
);
