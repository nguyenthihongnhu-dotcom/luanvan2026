import type { Request, Response } from 'express';
import { listInventoryTransactions } from './inventory-transactions.service';
import { parseInventoryTransactionsFilters } from './inventory-transactions.validation';

export async function listInventoryTransactionsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseInventoryTransactionsFilters(req.query);

  res.json({ data: await listInventoryTransactions(filters) });
}
