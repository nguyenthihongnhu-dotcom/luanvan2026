# Settings Feature

## Route

`/settings`

## Mục đích

Xem cấu hình hệ thống lưu trong `app_settings`.

## Luồng code

- `pages/SettingsPage.tsx`: list/filter setting key và render JSON value.
- `services/settingService.ts`: gọi `GET /settings`.

## Lưu ý

- Backend chưa có endpoint update setting, nên màn này chỉ đọc dữ liệu.
