import type { Request, Response } from 'express';
import { resolveWarehouseScope } from '../../common/access/warehouse-scope';
import { listInventoryTransactions } from './inventory-transactions.service';
import { parseInventoryTransactionsFilters } from './inventory-transactions.validation';

export async function listInventoryTransactionsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseInventoryTransactionsFilters(req.query);
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({
    data: await listInventoryTransactions({ ...filters, warehouseScope }),
  });
}
