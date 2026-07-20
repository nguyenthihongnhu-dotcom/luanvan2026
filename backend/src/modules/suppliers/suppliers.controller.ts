import type { Request, Response } from 'express';
import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  updateSupplier,
} from './suppliers.service';
import {
  parseSupplierId,
  parseSupplierInput,
  parseSuppliersFilters,
} from './suppliers.validation';

export async function listSuppliersController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseSuppliersFilters(req.query);
  res.json({ data: await listSuppliers(filters) });
}

export async function createSupplierController(
  req: Request,
  res: Response,
): Promise<void> {
  res
    .status(201)
    .json({ data: await createSupplier(parseSupplierInput(req.body)) });
}

export async function updateSupplierController(
  req: Request,
  res: Response,
): Promise<void> {
  res.json({
    data: await updateSupplier(
      parseSupplierId(req.params.id),
      parseSupplierInput(req.body),
    ),
  });
}

export async function deleteSupplierController(
  req: Request,
  res: Response,
): Promise<void> {
  res.json({ data: await deleteSupplier(parseSupplierId(req.params.id)) });
}
