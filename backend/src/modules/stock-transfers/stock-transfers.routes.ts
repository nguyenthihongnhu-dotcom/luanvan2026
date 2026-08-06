import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  confirmStockTransferController,
  createStockTransferController,
  listStockTransfersController,
  reverseStockTransferController,
} from './stock-transfers.controller';

export const stockTransfersRouter = Router();

stockTransfersRouter.get('/', asyncHandler(listStockTransfersController));
// Tạo phiếu chuyển kho cũng phải đăng nhập, đồng bộ với confirm/reverse bên dưới.
stockTransfersRouter.post(
  '/',
  asyncHandler(verifyToken),
  asyncHandler(createStockTransferController),
);
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
