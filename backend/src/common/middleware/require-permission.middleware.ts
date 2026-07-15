import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../http';

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(401, 'Authentication required', 'AUTH_REQUIRED'));
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      next(new HttpError(403, 'Permission denied', 'PERMISSION_DENIED'));
      return;
    }

    next();
  };
}
