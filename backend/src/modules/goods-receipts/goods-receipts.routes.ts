import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  confirmGoodsReceiptController,
  listGoodsReceiptsController,
  createGoodsReceiptController,
  getGoodsReceiptDetailController,
  reverseGoodsReceiptController,
} from './goods-receipts.controller';

export const goodsReceiptsRouter = Router();

goodsReceiptsRouter.get(
  '/',
  asyncHandler(verifyToken),
  asyncHandler(listGoodsReceiptsController),
);
goodsReceiptsRouter.get(
  '/:id',
  asyncHandler(verifyToken),
  asyncHandler(getGoodsReceiptDetailController),
);
goodsReceiptsRouter.post(
  '/',
  asyncHandler(verifyToken),
  asyncHandler(createGoodsReceiptController),
);
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
