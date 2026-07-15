import type { Request, Response } from 'express';
import { listBatches } from './batches.service';
import { parseBatchesFilters } from './batches.validation';

export async function listBatchesController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseBatchesFilters(req.query);

  res.json({ data: await listBatches(filters) });
}
