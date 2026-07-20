# Settings Module

## Mục tiêu nghiệp vụ

Module `settings` đọc cấu hình ứng dụng lưu trong bảng `app_settings`. Đây là cấu hình nghiệp vụ/runtime có thể hiển thị hoặc dùng bởi backend, không phải nơi lưu secret.

## Đọc code theo thứ tự

1. `settings.routes.ts`: endpoint list.
2. `settings.validation.ts`: query filters.
3. `settings.controller.ts`: parse query.
4. `settings.service.ts`: service boundary.
5. `settings.repository.ts`: query `app_settings`.
6. `config/config.ts`: cấu hình môi trường thật từ `.env`.

## Endpoint hiện có

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/settings` | Danh sách app settings |

## Query params

| Param | Type | Mô tả |
| --- | --- | --- |
| `id` | number | Lọc theo setting id |
| `search` | string | Tìm theo `setting_key` |

## Phân biệt settings và env

```text
.env/config.ts
  -> secret, database URL, JWT secret, port, CORS

app_settings/settings module
  -> cấu hình nghiệp vụ có thể quản trị, ví dụ ngưỡng cảnh báo hoặc tùy chọn UI
```

## Không được lưu ở settings public

- JWT secret.
- Database password.
- API key bên thứ ba.
- Private key.
- Token truy cập dịch vụ ngoài.

## Khi mở rộng module này

- Nếu thêm update setting, cần auth/permission riêng.
- Validate kiểu dữ liệu setting, tránh mọi value đều là string không kiểm soát.
- Có thể thêm cache nhưng phải có cơ chế invalidate rõ.