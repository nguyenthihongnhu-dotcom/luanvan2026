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
| POST | `/auth/users/:id/reset-password` | Quản trị viên đặt lại mật khẩu về mặc định | `users:reset_password` |
| POST | `/auth/password-reset/requests` | Nhân viên gửi yêu cầu quên mật khẩu chờ duyệt, có rate limit | Không |
| GET | `/auth/password-reset/requests` | Danh sách yêu cầu quên mật khẩu (lọc theo `status`) | `users:reset_password` |
| POST | `/auth/password-reset/requests/:id/approve` | Duyệt yêu cầu, đặt mật khẩu về mặc định | `users:reset_password` |
| POST | `/auth/password-reset/requests/:id/reject` | Từ chối yêu cầu kèm lý do bắt buộc | `users:reset_password` |

## Đặt lại mật khẩu: hai đường vào, một kết quả

Hệ thống chỉ có **một** cách đặt lại mật khẩu — về `DEFAULT_RESET_PASSWORD` — với hai đường khởi tạo:

| | Quản trị viên chủ động | Nhân viên yêu cầu |
| --- | --- | --- |
| Khởi tạo từ | Nút "Đặt lại mật khẩu", màn hình Nhân viên | Nút "Quên mật khẩu?", màn hình đăng nhập |
| Endpoint | `POST /auth/users/:id/reset-password` | `POST /auth/password-reset/requests` → admin duyệt |
| Cần duyệt | Không, chính admin bấm | Có — `PENDING → APPROVED/REJECTED` |
| Bảng lưu vết | `audit_logs` (`RESET_PASSWORD`) | `password_reset_requests` + `audit_logs` |

Cả hai đường cùng gọi `applyPasswordResetToUser()` trong repository, nên **không thể lệch nhau**: cùng đặt mật khẩu mặc định, cùng mở khóa tài khoản, cùng thu hồi hết phiên đăng nhập.

> Bảng `password_reset_tokens` vẫn còn trong schema nhưng **không còn mã nguồn nào dùng tới** — giữ lại để CSDL cũ và sơ đồ ERD trong báo cáo không bị lệch. Có thể `DROP` nếu muốn dọn.

## Luồng quên mật khẩu chờ duyệt

```text
POST /auth/password-reset/requests        (nhân viên, không cần đăng nhập)
  -> passwordResetRateLimit               (5 lần / 15 phút theo IP + email)
  -> parseCreatePasswordResetRequestInput
  -> requestPasswordResetApproval
      -> findUserByEmailForReset          (chỉ tài khoản ACTIVE, chưa xóa mềm)
      -> createPasswordResetRequest       (idempotent: đã có PENDING thì trả lại dòng cũ)
  -> LUÔN trả { accepted: true }          (không lộ email nào có tài khoản)

POST /auth/password-reset/requests/:id/approve      (quản trị viên)
  -> verifyToken + requirePermission('users:reset_password')
  -> approvePasswordResetRequest
      -> bcrypt.hash(DEFAULT_RESET_PASSWORD, 12)
      -> approvePasswordResetRequestTransaction
          -> lock yêu cầu FOR UPDATE, chặn nếu không còn PENDING
          -> applyPasswordResetToUser()          ← dùng chung với đường admin bấm
              -> lock users FOR UPDATE
              -> users.password_hash = hash mặc định
              -> failed_login_attempts = 0, locked_until = NULL   (mở khóa)
              -> revoke toàn bộ user_sessions đang mở             (bắt buộc)
          -> password_reset_requests.status = 'APPROVED'
          -> insertAuditLog('APPROVE_PASSWORD_RESET')
  -> commit
```

```text
POST /auth/users/:id/reset-password       (quản trị viên chủ động)
  -> verifyToken + requirePermission('users:reset_password')
  -> resetUserPassword
      -> bcrypt.hash(DEFAULT_RESET_PASSWORD, 12)
      -> resetUserPasswordTransaction
          -> applyPasswordResetToUser()      ← đúng ba bước như trên
          -> insertAuditLog('RESET_PASSWORD')
  -> commit
```

`DEFAULT_RESET_PASSWORD` khai báo trong `auth.service.ts`. Đổi giá trị ở đó là đổi cho toàn hệ thống; frontend đọc hằng cùng tên trong `features/staff/services/userService.ts` nên phải sửa cả hai nơi cho khớp.

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
- `password_reset_requests`: yêu cầu quên mật khẩu chờ duyệt, trạng thái và người xử lý.
- `password_reset_tokens`: **không còn dùng** — xem ghi chú ở mục đặt lại mật khẩu.

## Khi sửa module này

- Mọi đường đặt lại mật khẩu phải đi qua `applyPasswordResetToUser()`. Thêm đường mới mà tự viết lại ba bước là sớm muộn sẽ quên bước thu hồi phiên.
- Không bao giờ ghi mật khẩu (kể cả mật khẩu mặc định) vào `audit_logs`: bảng này nhiều vai trò đọc được hơn `users`.
- Đổi `DEFAULT_RESET_PASSWORD` thì phải đổi cả hằng cùng tên ở `frontend/src/features/staff/services/userService.ts`, nếu không giao diện sẽ báo cho người dùng một mật khẩu khác với mật khẩu thật.
- Giữ nguyên quy tắc "luôn trả `accepted: true`" ở endpoint gửi yêu cầu. Phân biệt email tồn tại/không tồn tại là biến màn hình đăng nhập thành công cụ dò tài khoản.
- Nếu database cũ chưa có bảng `password_reset_requests` và quyền `users:reset_password`, chạy `backend/migrations/2026-08-16_password-reset-requests.sql`.
