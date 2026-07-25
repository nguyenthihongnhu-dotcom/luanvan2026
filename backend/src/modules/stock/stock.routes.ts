import { Router } from 'express';
import { asyncHandler } from '../../common/http';
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
stockRouter.post('/quick-receive', asyncHandler(quickReceiveStockController));
