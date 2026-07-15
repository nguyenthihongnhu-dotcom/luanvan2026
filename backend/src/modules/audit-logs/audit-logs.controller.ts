import type { Request, Response } from 'express';
import { listAuditLogs } from './audit-logs.service';
import { parseAuditLogsFilters } from './audit-logs.validation';

export async function listAuditLogsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseAuditLogsFilters(req.query);

  res.json({ data: await listAuditLogs(filters) });
}
