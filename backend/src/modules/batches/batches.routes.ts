import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { listBatchesController } from './batches.controller';

export const batchesRouter = Router();

batchesRouter.get('/', asyncHandler(listBatchesController));
