import type { Request, Response } from 'express';
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

  res.json({ data: await listReports(filters) });
}

export async function listProductStockReportController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseReportsFilters(req.query);

  res.json({ data: await listProductStockReport(filters) });
}

export async function listNearExpiryReportController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseReportsFilters(req.query);

  res.json({ data: await listNearExpiryReport(filters) });
}

export async function listInventoryMovementReportController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseReportsFilters(req.query);

  res.json({ data: await listInventoryMovementReport(filters) });
}

export async function listInventoryTransactionReportController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseReportsFilters(req.query);

  res.json({ data: await listInventoryTransactionReport(filters) });
}
