import type { Request, Response } from 'express';
import { resolveWarehouseScope } from '../../common/access/warehouse-scope';
import {
  listCurrentStock,
  listNearExpiryStock,
  previewStockAllocation,
  quickReceiveStock,
} from './stock.service';
import {
  parseNearExpiryFilters,
  parseStockAllocationInput,
  parseStockFilters,
  parseQuickReceiveInput,
} from './stock.validation';

export async function listCurrentStockController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseStockFilters(req.query);
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({ data: await listCurrentStock({ ...filters, warehouseScope }) });
}

export async function listNearExpiryStockController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseNearExpiryFilters(req.query);
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({ data: await listNearExpiryStock({ ...filters, warehouseScope }) });
}

export async function previewStockAllocationController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseStockAllocationInput(req.query);

  res.json({ data: await previewStockAllocation(input) });
}

export async function quickReceiveStockController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseQuickReceiveInput(req.body);

  res.status(201).json({ data: await quickReceiveStock(input) });
}
