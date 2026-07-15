import type { Request, Response } from 'express';
import { listAttachments } from './attachments.service';
import { parseAttachmentsFilters } from './attachments.validation';

export async function listAttachmentsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseAttachmentsFilters(req.query);

  res.json({ data: await listAttachments(filters) });
}
