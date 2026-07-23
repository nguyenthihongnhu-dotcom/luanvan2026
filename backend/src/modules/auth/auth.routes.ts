import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import {
  passwordResetRateLimit,
  loginRateLimit,
} from '../../common/middleware/rate-limit.middleware';
import { requirePermission, verifyToken } from './auth.module';
import {
  createUserController,
  deleteUserController,
  listUsersController,
  loginController,
  logoutController,
  refreshController,
  registerController,
  requestPasswordResetController,
  resetPasswordController,
  updateUserController,
} from './auth.controller';

export const authRouter = Router();

authRouter.get(
  '/users',
  asyncHandler(verifyToken),
  requirePermission('users:read'),
  asyncHandler(listUsersController),
);
authRouter.post(
  '/users',
  asyncHandler(verifyToken),
  requirePermission('users:create'),
  asyncHandler(createUserController),
);
authRouter.put(
  '/users/:id',
  asyncHandler(verifyToken),
  requirePermission('users:update'),
  asyncHandler(updateUserController),
);
authRouter.delete(
  '/users/:id',
  asyncHandler(verifyToken),
  requirePermission('users:delete'),
  asyncHandler(deleteUserController),
);
authRouter.post('/login', loginRateLimit, asyncHandler(loginController));
authRouter.post('/register', asyncHandler(registerController));
authRouter.post('/refresh', asyncHandler(refreshController));
authRouter.post('/logout', asyncHandler(logoutController));
authRouter.post(
  '/password-reset/request',
  passwordResetRateLimit,
  asyncHandler(requestPasswordResetController),
);
authRouter.post('/password-reset/reset', asyncHandler(resetPasswordController));
