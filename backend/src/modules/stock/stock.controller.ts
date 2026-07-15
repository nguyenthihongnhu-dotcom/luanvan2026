import type { Request, Response } from 'express';
import {
  listCurrentStock,
  listNearExpiryStock,
  previewStockAllocation,
} from './stock.service';
import {
  parseNearExpiryFilters,
  parseStockAllocationInput,
  parseStockFilters,
} from './stock.validation';

export async function listCurrentStockController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseStockFilters(req.query);

  res.json({ data: await listCurrentStock(filters) });
}

export async function listNearExpiryStockController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseNearExpiryFilters(req.query);

  res.json({ data: await listNearExpiryStock(filters) });
}

export async function previewStockAllocationController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseStockAllocationInput(req.query);

  res.json({ data: await previewStockAllocation(input) });
}
