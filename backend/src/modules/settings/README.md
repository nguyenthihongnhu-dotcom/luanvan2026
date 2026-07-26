# Settings Module

## Mục Tiêu Nghiệp Vụ

Module `settings` quản lý cấu hình ứng dụng lưu trong bảng `app_settings`. Đây là cấu hình nghiệp vụ/runtime có thể hiển thị hoặc chỉnh từ UI admin, không phải nơi lưu secret.

## Đọc Code Theo Thứ Tự

1. `settings.routes.ts`: `GET /settings`, `PUT /settings/:id` và permission `settings:update`.
2. `settings.validation.ts`: query filters, id param, body update.
3. `settings.controller.ts`: lấy `req.user.id` cho update.
4. `settings.service.ts`: service boundary và lỗi 404.
5. `settings.repository.ts`: query/update `app_settings`.
6. `config/config.ts`: cấu hình môi trường thật từ `.env`.

## Endpoints

| Method | Path | Mô tả | Auth |
| --- | --- | --- | --- |
| GET | `/settings` | Danh sách app settings | Không |
| PUT | `/settings/:id` | Cập nhật `setting_value`, `description`, `updated_by` | `settings:update` |

## Query Params

| Param | Type | Mô tả |
| --- | --- | --- |
| `id` | number | Lọc theo setting id |
| `search` | string | Tìm theo `setting_key` |

## Update Body

```json
{
  "settingValue": { "any": "json" },
  "description": "Mô tả cấu hình"
}
```

`settingValue` được lưu vào MySQL JSON. Frontend phải validate JSON trước khi gửi, backend vẫn parse bằng Zod và ghi `updated_by` từ token.

## Phân Biệt Settings Và Env

```text
.env/config.ts
  -> secret, database URL, JWT secret, port, CORS

app_settings/settings module
  -> cấu hình nghiệp vụ có thể quản trị, ví dụ ngưỡng cảnh báo hoặc tùy chọn UI
```

Không lưu JWT secret, database password, API key, private key hoặc token dịch vụ ngoài trong `app_settings`.
