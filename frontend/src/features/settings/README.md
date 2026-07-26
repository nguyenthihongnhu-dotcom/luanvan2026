# Settings Feature

## Route

`/settings`

## Mục đích

Xem, lọc, tạo cấu hình mặc định và chỉnh cấu hình hệ thống lưu trong `app_settings`.

## Luồng code

- `pages/SettingsPage.tsx`: list/filter setting key, render JSON value, mở modal sửa và hiển thị trạng thái rỗng.
- `services/settingService.ts`: gọi `GET /settings`, `POST /settings/seed-defaults`, `PUT /settings/:id`.

## Quyền

- Xem danh sách: không yêu cầu permission riêng ở route backend hiện tại.
- Tạo cấu hình mặc định: cần `settings:update`.
- Sửa cấu hình: cần `settings:update`.

## Empty State

Nếu bảng `app_settings` rỗng, UI hiển thị thông báo nghiệp vụ và nút `Tạo cấu hình mặc định` cho tài khoản có quyền. Backend dùng `INSERT IGNORE`, nên bấm lại không tạo trùng key.

## Lưu ý

- Giá trị cấu hình được nhập dưới dạng JSON hợp lệ.
- Không đưa secret như JWT secret, database password, API key hoặc private key vào `app_settings`.