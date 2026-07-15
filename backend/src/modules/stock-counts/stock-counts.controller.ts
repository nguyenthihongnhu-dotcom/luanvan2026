import type { Request, Response } from 'express';
import { listStockCounts } from './stock-counts.service';
import { parseStockCountsFilters } from './stock-counts.validation';

export async function listStockCountsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseStockCountsFilters(req.query);

  res.json({ data: await listStockCounts(filters) });
}
