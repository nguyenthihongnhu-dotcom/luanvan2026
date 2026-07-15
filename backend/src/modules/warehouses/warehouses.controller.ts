import type { Request, Response } from 'express';
import { listWarehouses } from './warehouses.service';
import { parseWarehousesFilters } from './warehouses.validation';

export async function listWarehousesController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseWarehousesFilters(req.query);

  res.json({ data: await listWarehouses(filters) });
}
