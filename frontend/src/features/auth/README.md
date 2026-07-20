# Auth Feature

## Mục tiêu

Feature `auth` xử lý đăng nhập, auth state trong React và modal đăng ký.

## Đọc code theo thứ tự

1. `pages/LoginPage.tsx`: UI đăng nhập và mở register modal.
2. `services/authService.ts`: gọi backend `/auth/login`, lưu access token.
3. `context/AuthProvider.tsx`: giữ user/auth state.
4. `context/useAuth.ts`: hook dùng auth context.
5. `components/RegisterModal.tsx`: UI đăng ký.
6. `types.ts`: type `AuthResponse`, `LoginCredentials`, `RegisterPayload`.

## Luồng login

```text
LoginPage submit
  -> authService.login({ username, password })
  -> POST /auth/login với email/password
  -> mapBackendAuth
      -> setAccessToken(accessToken) vào sessionStorage
      -> map user backend sang shape frontend
  -> AuthProvider.login(result)
  -> redirect/dashboard UI dùng user
```

## Backend API

| Action | API | Ghi chú |
| --- | --- | --- |
| Login | `POST /auth/login` | Đã nối backend |
| Register | `POST /auth/register` | Backend có endpoint, nhưng `authService.register` hiện chưa gọi API thật trong code hiện tại |
| Users | `GET /auth/users` | Dùng ở feature staff |

## Token storage

Access token được lưu bằng `sessionStorage` trong `shared/services/httpClient.ts`:

```text
bambi_wms_access_token
```

`httpClient` tự gắn header `Authorization: Bearer <token>` nếu token tồn tại.

## Khi sửa feature này

- Không lưu password/token vào log.
- Nếu nối register thật, sửa `authService.register`, không sửa trực tiếp `RegisterModal` để gọi `fetch`.
- Nếu đổi shape user backend, cập nhật mapper `mapBackendAuth` và type trong `types.ts`.
- Nếu thêm refresh token tự động, làm ở `httpClient` hoặc auth service, không rải trong từng feature.