import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { verifyToken } from '../auth/auth.module';
import {
  createBatchController,
  deleteBatchController,
  listBatchesController,
  updateBatchController,
} from './batches.controller';

export const batchesRouter = Router();

batchesRouter.get(
  '/',

  asyncHandler(verifyToken),

  asyncHandler(listBatchesController),
);
// Thêm/sửa/xóa lô hàng bắt buộc phải đăng nhập.
batchesRouter.post(
  '/',
  asyncHandler(verifyToken),
  asyncHandler(createBatchController),
);
batchesRouter.put(
  '/:id',
  asyncHandler(verifyToken),
  asyncHandler(updateBatchController),
);
batchesRouter.delete(
  '/:id',
  asyncHandler(verifyToken),
  asyncHandler(deleteBatchController),
);
