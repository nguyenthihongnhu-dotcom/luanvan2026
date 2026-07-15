import type { Request, Response } from 'express';
import { listSuppliers } from './suppliers.service';
import { parseSuppliersFilters } from './suppliers.validation';

export async function listSuppliersController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseSuppliersFilters(req.query);

  res.json({ data: await listSuppliers(filters) });
}
