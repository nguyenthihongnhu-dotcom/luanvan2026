import type { Request, Response } from 'express';
import { listReports } from './reports.service';
import { parseReportsFilters } from './reports.validation';

export async function listReportsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseReportsFilters(req.query);

  res.json({ data: await listReports(filters) });
}
