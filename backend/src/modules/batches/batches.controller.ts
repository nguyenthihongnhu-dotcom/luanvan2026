import type { Request, Response } from 'express';
import {
  createBatch,
  deleteBatch,
  listBatches,
  updateBatch,
} from './batches.service';
import {
  parseBatchesFilters,
  parseBatchId,
  parseCreateBatchInput,
  parseUpdateBatchInput,
} from './batches.validation';

export async function listBatchesController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseBatchesFilters(req.query);

  res.json({ data: await listBatches(filters) });
}

export async function createBatchController(
  req: Request,
  res: Response,
): Promise<void> {
  const payload = parseCreateBatchInput(req.body);
  const result = await createBatch(payload);

  res.status(201).json({ data: result });
}

export async function updateBatchController(
  req: Request,
  res: Response,
): Promise<void> {
  const payload = parseUpdateBatchInput({
    ...(req.body as Record<string, unknown>),
    id: req.params.id,
  });

  res.json({ data: await updateBatch(payload) });
}

export async function deleteBatchController(
  req: Request,
  res: Response,
): Promise<void> {
  const batchId = parseBatchId(req.params.id);

  res.json({ data: await deleteBatch(batchId) });
}
