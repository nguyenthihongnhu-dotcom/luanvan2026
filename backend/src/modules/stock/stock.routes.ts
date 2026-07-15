import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import {
  listCurrentStockController,
  listNearExpiryStockController,
  previewStockAllocationController,
} from './stock.controller';

export const stockRouter = Router();

stockRouter.get('/current', asyncHandler(listCurrentStockController));
stockRouter.get('/near-expiry', asyncHandler(listNearExpiryStockController));
stockRouter.get('/allocation', asyncHandler(previewStockAllocationController));
