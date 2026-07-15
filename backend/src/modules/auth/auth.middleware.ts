import type { NextFunction, Request, Response } from 'express';
import { extractBearerToken, verifyAccessToken } from './auth.service';

export async function verifyToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractBearerToken(req.header('authorization'));
    req.user = await verifyAccessToken(token);
    next();
  } catch (error) {
    next(error);
  }
}
