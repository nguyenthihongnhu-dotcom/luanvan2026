import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { verifyToken } from '../auth/auth.module';
import {
  listInventoryMovementReportController,
  listInventoryTransactionReportController,
  listNearExpiryReportController,
  listProductStockReportController,
  listReportsController,
} from './reports.controller';

export const reportsRouter = Router();

reportsRouter.get(
  '/',
  asyncHandler(verifyToken),
  asyncHandler(listReportsController),
);
reportsRouter.get(
  '/product-stock',
  asyncHandler(verifyToken),
  asyncHandler(listProductStockReportController),
);
reportsRouter.get(
  '/near-expiry',
  asyncHandler(verifyToken),
  asyncHandler(listNearExpiryReportController),
);
reportsRouter.get(
  '/inventory-movements',
  asyncHandler(verifyToken),
  asyncHandler(listInventoryMovementReportController),
);
reportsRouter.get(
  '/inventory-transactions',
  asyncHandler(verifyToken),
  asyncHandler(listInventoryTransactionReportController),
);
