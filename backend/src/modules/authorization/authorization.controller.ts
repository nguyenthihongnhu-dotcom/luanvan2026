import type { Request, Response } from 'express';
import { listAuthorization } from './authorization.service';
import { parseAuthorizationFilters } from './authorization.validation';

export async function listAuthorizationController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseAuthorizationFilters(req.query);

  res.json({ data: await listAuthorization(filters) });
}
