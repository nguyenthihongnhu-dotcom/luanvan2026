import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { listInventoryTransactionsController } from './inventory-transactions.controller';

export const inventoryTransactionsRouter = Router();

inventoryTransactionsRouter.get(
  '/',
  asyncHandler(listInventoryTransactionsController),
);
