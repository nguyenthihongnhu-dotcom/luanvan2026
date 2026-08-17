import type { Request, Response } from 'express';
import { resolveWarehouseScope } from '../../common/access/warehouse-scope';
import {
  listInventoryMovementReport,
  listInventoryTransactionReport,
  listNearExpiryReport,
  listProductStockReport,
  listReports,
} from './reports.service';
import { parseReportsFilters } from './reports.validation';

export async function listReportsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseReportsFilters(req.query);
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({
    data: await listReports({ ...filters, warehouseScope }),
  });
}

export async function listProductStockReportController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseReportsFilters(req.query);
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({
    data: await listProductStockReport({ ...filters, warehouseScope }),
  });
}

export async function listNearExpiryReportController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseReportsFilters(req.query);
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({
    data: await listNearExpiryReport({ ...filters, warehouseScope }),
  });
}

export async function listInventoryMovementReportController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseReportsFilters(req.query);
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({
    data: await listInventoryMovementReport({ ...filters, warehouseScope }),
  });
}

export async function listInventoryTransactionReportController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseReportsFilters(req.query);
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({
    data: await listInventoryTransactionReport({ ...filters, warehouseScope }),
  });
}
