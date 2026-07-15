import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { listStockCountsController } from './stock-counts.controller';

export const stockCountsRouter = Router();

stockCountsRouter.get('/', asyncHandler(listStockCountsController));
