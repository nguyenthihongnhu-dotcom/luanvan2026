import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import {
  createBatchController,
  deleteBatchController,
  listBatchesController,
  updateBatchController,
} from './batches.controller';

export const batchesRouter = Router();

batchesRouter.get('/', asyncHandler(listBatchesController));
batchesRouter.post('/', asyncHandler(createBatchController));
batchesRouter.put('/:id', asyncHandler(updateBatchController));
batchesRouter.delete('/:id', asyncHandler(deleteBatchController));
