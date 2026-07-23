# Auth Module

## Mục tiêu nghiệp vụ

Module `auth` chịu trách nhiệm định danh user, cấp token, quản lý session và cung cấp API quản trị user cho frontend Nhân viên.

## Đọc code theo thứ tự

1. `auth.routes.ts`: endpoint login/register/refresh/logout/reset và `/auth/users`.
2. `auth.validation.ts`: Zod schema cho request body.
3. `auth.controller.ts`: lấy metadata IP/user-agent và gọi service.
4. `auth.service.ts`: logic password, token, session, register public và create user quản trị.
5. `auth.repository.ts`: SQL với `users`, `roles`, `permissions`, `user_sessions`.
6. `auth.middleware.ts`: `verifyToken` gắn `req.user`.
7. `common/middleware/require-permission.middleware.ts`: kiểm tra permission.
8. `common/middleware/rate-limit.middleware.ts`: giới hạn login/reset theo IP + email.

## Endpoint hiện có

| Method | Path | Mô tả | Auth guard |
| --- | --- | --- | --- |
| GET | `/auth/users` | Danh sách user cho FE Nhân viên | `users:read` |
| POST | `/auth/users` | Admin tạo user theo role | `users:create` |
| PUT | `/auth/users/:id` | Cập nhật user, role, trạng thái | `users:update` |
| DELETE | `/auth/users/:id` | Xóa mềm user | `users:delete` |
| POST | `/auth/login` | Đăng nhập, có rate limit | Không |
| POST | `/auth/register` | Đăng ký public, luôn tạo role `STAFF` | Không |
| POST | `/auth/refresh` | Rotate refresh token và cấp access token mới | Không |
| POST | `/auth/logout` | Revoke refresh session | Không |
| POST | `/auth/password-reset/request` | Tạo token reset mật khẩu, có rate limit | Không |
| POST | `/auth/password-reset/reset` | Đổi mật khẩu bằng reset token | Không |

## Trạng thái bảo mật auth

- `/auth/users` đã yêu cầu `verifyToken` và permission tương ứng.
- `/auth/register` không tin `roleCode` từ client; service luôn ép role `STAFF`.
- Login bị giới hạn 10 lần/15 phút theo IP + email.
- Password reset request bị giới hạn 5 lần/15 phút theo IP + email.
- Nếu database cũ chưa có permission `users:*`, chạy lại phần seed permissions trong `warehouse_management_mysql.sql` rồi đăng nhập lại để token chứa permission mới.

## Luồng login

```text
POST /auth/login
  -> loginRateLimit
  -> parseLoginInput(body, metadata)
  -> login(input)
  -> findLoginUserByEmail(email)
  -> bcrypt.compare(password, password_hash)
  -> markLoginSuccess/markLoginFailure
  -> issueTokenPair
  -> createSession(refresh hash)
```

## Luồng bảo vệ endpoint

```text
request
  -> verifyToken
  -> verifyAccessToken
  -> findActiveAuthUserById
  -> req.user = { id, role, permissions }
  -> requirePermission('<permission-code>')
  -> controller
```

`requirePermission` đọc `req.user.permissions`. Nếu thiếu token trả 401, thiếu permission trả 403.

## Bảng dữ liệu chính

- `users`: tài khoản, password hash, trạng thái, lock login.
- `roles`: vai trò như `ADMIN`, `WAREHOUSE_MANAGER`, `STAFF`, `AUDITOR`.
- `permissions`: quyền chi tiết.
- `role_permissions`: mapping role-quyền.
- `user_sessions`: refresh token hash, expiry, revoke.
- `password_reset_tokens`: reset token hash, expiry, used flag.
