import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../http';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  keyGenerator?: (req: Request) => string;
};

const buckets = new Map<string, RateLimitEntry>();

function normalizePart(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase();
}

export function authIdentityKey(req: Request): string {
  const email = normalizePart(
    (req.body as { email?: unknown } | undefined)?.email,
  );
  return `${req.ip}:${email || 'anonymous'}`;
}

export function rateLimit(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const identity = options.keyGenerator?.(req) ?? req.ip ?? 'unknown';
    const key = `${options.keyPrefix}:${identity}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    current.count += 1;

    if (current.count > options.maxRequests) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      next(new HttpError(429, 'Too many requests', 'RATE_LIMITED'));
      return;
    }

    next();
  };
}

export const loginRateLimit = rateLimit({
  keyPrefix: 'auth-login',
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  keyGenerator: authIdentityKey,
});

export const passwordResetRateLimit = rateLimit({
  keyPrefix: 'password-reset',
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  keyGenerator: authIdentityKey,
});
