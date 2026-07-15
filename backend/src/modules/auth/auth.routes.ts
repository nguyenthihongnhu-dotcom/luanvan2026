import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import {
  loginController,
  logoutController,
  refreshController,
  requestPasswordResetController,
  resetPasswordController,
} from './auth.controller';

export const authRouter = Router();

authRouter.post('/login', asyncHandler(loginController));
authRouter.post('/refresh', asyncHandler(refreshController));
authRouter.post('/logout', asyncHandler(logoutController));
authRouter.post(
  '/password-reset/request',
  asyncHandler(requestPasswordResetController),
);
authRouter.post('/password-reset/reset', asyncHandler(resetPasswordController));
