import type { Request, Response } from 'express';
import { HttpError } from '../../common/http';
import {
  createWarehouse,
  deleteWarehouse,
  listWarehouses,
  updateWarehouse,
} from './warehouses.service';
import {
  parseWarehouseInput,
  parseWarehousesFilters,
} from './warehouses.validation';

function parseId(value: unknown): number {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Invalid warehouse id', 'INVALID_WAREHOUSE_ID');
  }

  return id;
}

export async function listWarehousesController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseWarehousesFilters(req.query);

  res.json({ data: await listWarehouses(filters) });
}

export async function createWarehouseController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseWarehouseInput(req.body);

  res.status(201).json({ data: await createWarehouse(input) });
}

export async function updateWarehouseController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseId(req.params.id);
  const input = parseWarehouseInput(req.body);

  res.json({ data: await updateWarehouse(id, input) });
}

export async function deleteWarehouseController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseId(req.params.id);

  res.json({ data: await deleteWarehouse(id) });
}
