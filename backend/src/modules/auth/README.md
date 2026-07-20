# Auth Module

## Mục tiêu nghiệp vụ

Module `auth` chịu trách nhiệm định danh user và cấp quyền truy cập API. Đây là module intern nên đọc đầu tiên vì nhiều module khác phụ thuộc `req.user`, JWT và permission.

## Đọc code theo thứ tự

1. `auth.routes.ts`: danh sách endpoint login/register/refresh/logout/reset.
2. `auth.validation.ts`: contract request body.
3. `auth.controller.ts`: cách lấy IP/user-agent và gọi service.
4. `auth.service.ts`: logic token, password, session, permission.
5. `auth.repository.ts`: SQL với `users`, `roles`, `permissions`, `user_sessions`.
6. `auth.middleware.ts`: `verifyToken` gắn `req.user`.
7. `common/types/express.d.ts`: type augmentation cho `Request.user`.
8. `common/middleware/require-permission.middleware.ts`: kiểm tra permission.

## Endpoint hiện có

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/auth/users` | Danh sách nhân viên/user cho FE |
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/register` | Đăng ký user mới |
| POST | `/auth/refresh` | Rotate refresh token và cấp access token mới |
| POST | `/auth/logout` | Revoke refresh session |
| POST | `/auth/password-reset/request` | Tạo token reset mật khẩu |
| POST | `/auth/password-reset/reset` | Đổi mật khẩu bằng reset token |

## Luồng login

```text
POST /auth/login
  -> parseLoginInput(body, metadata)
  -> login(input)
  -> findLoginUserByEmail(email)
  -> bcrypt.compare(password, password_hash)
  -> markLoginSuccess hoặc markLoginFailure
  -> toAuthUser: gom role + permissions
  -> issueTokenPair
      -> signAccessToken bằng JWT_SECRET
      -> generate refresh token opaque
      -> hash refresh token SHA-256
      -> createSession trong user_sessions
  -> trả accessToken, refreshToken, expiresIn, user
```

## Luồng bảo vệ endpoint

Route nghiệp vụ dùng pattern:

```ts
router.post(
  '/:id/confirm',
  asyncHandler(verifyToken),
  requirePermission('goods_receipts:confirm'),
  asyncHandler(controller),
);
```

`verifyToken` đọc header `Authorization: Bearer <token>`, verify JWT, load active user từ DB, rồi gắn `req.user`.

`requirePermission` đọc `req.user.permissions`. Nếu thiếu permission thì trả 403.

## Bảng dữ liệu chính

- `users`: thông tin user, password hash, role.
- `roles`: vai trò như ADMIN, STAFF.
- `permissions`: quyền chi tiết.
- `role_permissions`: mapping role-quyền.
- `user_sessions`: refresh token hash, TTL, revoked_at.
- `password_reset_tokens`: reset token hash, TTL.

## Khi sửa module này

- Không log password/token raw.
- Refresh token chỉ lưu hash, không lưu token gốc.
- Khi thêm role/permission mới, cập nhật SQL seed và docs quyền trong `backend/docs/overview.md`.
- Không dùng `any` cho JWT payload; cập nhật `auth.model.ts` nếu payload đổi.
- Nếu đổi shape response login/register, cập nhật frontend `authService`.