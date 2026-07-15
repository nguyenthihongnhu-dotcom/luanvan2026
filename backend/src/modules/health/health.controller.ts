import type { Request, Response } from 'express';
import { getHealthStatus } from './health.service';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  res.json(await getHealthStatus());
}
