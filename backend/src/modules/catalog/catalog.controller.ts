import type { Request, Response } from 'express';
import { listCatalog } from './catalog.service';
import { parseCatalogFilters } from './catalog.validation';

export async function listCatalogController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseCatalogFilters(req.query);

  res.json({ data: await listCatalog(filters) });
}
