import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  generateNotificationsController,
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
} from './notifications.controller';

export const notificationsRouter = Router();

// Ba route dưới đây chỉ đụng tới thông báo của chính người đăng nhập: controller
// ép user_id = req.user.id và repository lọc theo cột đó. Thêm requirePermission
// chỉ chặn nhầm chính người nhận (vai trò STAFF không được cấp quyền nên nhận
// được thông báo mà không đọc nổi), chứ không bảo vệ thêm dữ liệu của ai.
notificationsRouter.get(
  '/',
  asyncHandler(verifyToken),
  asyncHandler(listNotificationsController),
);
notificationsRouter.post(
  '/generate',
  asyncHandler(verifyToken),
  requirePermission('notifications:generate'),
  asyncHandler(generateNotificationsController),
);
notificationsRouter.post(
  '/read-all',
  asyncHandler(verifyToken),
  asyncHandler(markAllNotificationsReadController),
);
notificationsRouter.patch(
  '/:id/read',
  asyncHandler(verifyToken),
  asyncHandler(markNotificationReadController),
);
