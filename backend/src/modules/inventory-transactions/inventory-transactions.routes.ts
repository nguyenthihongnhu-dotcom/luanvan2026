import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { verifyToken } from '../auth/auth.module';
import { listInventoryTransactionsController } from './inventory-transactions.controller';

export const inventoryTransactionsRouter = Router();

inventoryTransactionsRouter.get(
  '/',
  asyncHandler(verifyToken),
  asyncHandler(listInventoryTransactionsController),
);
