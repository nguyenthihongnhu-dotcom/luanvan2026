import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  confirmGoodsReceiptController,
  listGoodsReceiptsController,
  createGoodsReceiptController,
  reverseGoodsReceiptController,
} from './goods-receipts.controller';

export const goodsReceiptsRouter = Router();

goodsReceiptsRouter.get('/', asyncHandler(listGoodsReceiptsController));
goodsReceiptsRouter.post('/', asyncHandler(createGoodsReceiptController));
goodsReceiptsRouter.post(
  '/:id/confirm',
  asyncHandler(verifyToken),
  requirePermission('goods_receipts:confirm'),
  asyncHandler(confirmGoodsReceiptController),
);
goodsReceiptsRouter.post(
  '/:id/reverse',
  asyncHandler(verifyToken),
  requirePermission('goods_receipts:reverse'),
  asyncHandler(reverseGoodsReceiptController),
);
