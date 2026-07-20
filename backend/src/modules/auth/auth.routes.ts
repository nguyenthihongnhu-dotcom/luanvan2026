import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import {
  loginController,
  logoutController,
  refreshController,
  requestPasswordResetController,
  resetPasswordController,
  registerController,
  listUsersController,
} from './auth.controller';

export const authRouter = Router();

authRouter.get('/users', asyncHandler(listUsersController));
authRouter.post('/login', asyncHandler(loginController));
authRouter.post('/register', asyncHandler(registerController));
authRouter.post('/refresh', asyncHandler(refreshController));
authRouter.post('/logout', asyncHandler(logoutController));
authRouter.post(
  '/password-reset/request',
  asyncHandler(requestPasswordResetController),
);
authRouter.post('/password-reset/reset', asyncHandler(resetPasswordController));
