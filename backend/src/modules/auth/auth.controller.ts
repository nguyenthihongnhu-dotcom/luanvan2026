import type { Request, Response } from 'express';
import {
  login,
  logout,
  refresh,
  requestPasswordReset,
  resetPassword,
} from './auth.service';
import {
  parseLoginInput,
  parseLogoutInput,
  parseRefreshInput,
  parseRequestPasswordResetInput,
  parseResetPasswordInput,
} from './auth.validation';

function getRequestMetadata(req: Request): {
  userAgent?: string;
  ipAddress?: string;
} {
  return {
    userAgent: req.header('user-agent'),
    ipAddress: req.ip,
  };
}

export async function loginController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseLoginInput(req.body, getRequestMetadata(req));

  res.json({ data: await login(input) });
}

export async function refreshController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseRefreshInput(req.body, getRequestMetadata(req));

  res.json({ data: await refresh(input) });
}

export async function logoutController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseLogoutInput(req.body);

  res.json({ data: await logout(input) });
}

export async function requestPasswordResetController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseRequestPasswordResetInput(req.body);

  res.json({ data: await requestPasswordReset(input) });
}

export async function resetPasswordController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseResetPasswordInput(req.body);

  res.json({ data: await resetPassword(input) });
}
