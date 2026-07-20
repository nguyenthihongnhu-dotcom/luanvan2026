import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import {
  listInventoryMovementReportController,
  listInventoryTransactionReportController,
  listNearExpiryReportController,
  listProductStockReportController,
  listReportsController,
} from './reports.controller';

export const reportsRouter = Router();

reportsRouter.get('/', asyncHandler(listReportsController));
reportsRouter.get('/product-stock', asyncHandler(listProductStockReportController));
reportsRouter.get('/near-expiry', asyncHandler(listNearExpiryReportController));
reportsRouter.get(
  '/inventory-movements',
  asyncHandler(listInventoryMovementReportController),
);
reportsRouter.get(
  '/inventory-transactions',
  asyncHandler(listInventoryTransactionReportController),
);
