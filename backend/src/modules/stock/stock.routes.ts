import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { verifyToken } from '../auth/auth.module';
import {
  listCurrentStockController,
  listNearExpiryStockController,
  previewStockAllocationController,
  quickReceiveStockController,
} from './stock.controller';

export const stockRouter = Router();

stockRouter.get('/current', asyncHandler(listCurrentStockController));
stockRouter.get('/near-expiry', asyncHandler(listNearExpiryStockController));
stockRouter.get('/allocation', asyncHandler(previewStockAllocationController));
// Nhập nhanh làm tăng tồn kho thật nên bắt buộc phải đăng nhập.
stockRouter.post(
  '/quick-receive',
  asyncHandler(verifyToken),
  asyncHandler(quickReceiveStockController),
);
