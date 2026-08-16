import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import {
  passwordResetRateLimit,
  loginRateLimit,
} from '../../common/middleware/rate-limit.middleware';
import { requirePermission } from '../../common/middleware/require-permission.middleware';
import { verifyToken } from './auth.middleware';
import {
  approvePasswordResetRequestController,
  createPasswordResetRequestController,
  createUserController,
  deleteUserController,
  listPasswordResetRequestsController,
  listUsersController,
  loginController,
  logoutController,
  refreshController,
  registerController,
  rejectPasswordResetRequestController,
  resetUserPasswordController,
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
// Đặt lại mật khẩu về giá trị mặc định. Hai đường vào, một kết quả:
//   1. Quản trị viên chủ động đặt lại cho một nhân viên.
//   2. Nhân viên gửi yêu cầu từ màn hình đăng nhập, quản trị viên duyệt.
// Đường 2 không cần đăng nhập nên phải chặn spam bằng rate limit.
authRouter.post(
  '/users/:id/reset-password',
  asyncHandler(verifyToken),
  requirePermission('users:reset_password'),
  asyncHandler(resetUserPasswordController),
);
authRouter.post(
  '/password-reset/requests',
  passwordResetRateLimit,
  asyncHandler(createPasswordResetRequestController),
);
authRouter.get(
  '/password-reset/requests',
  asyncHandler(verifyToken),
  requirePermission('users:reset_password'),
  asyncHandler(listPasswordResetRequestsController),
);
authRouter.post(
  '/password-reset/requests/:id/approve',
  asyncHandler(verifyToken),
  requirePermission('users:reset_password'),
  asyncHandler(approvePasswordResetRequestController),
);
authRouter.post(
  '/password-reset/requests/:id/reject',
  asyncHandler(verifyToken),
  requirePermission('users:reset_password'),
  asyncHandler(rejectPasswordResetRequestController),
);
