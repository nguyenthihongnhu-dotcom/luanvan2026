# Settings Module

## Mục Tiêu Nghiệp Vụ

Module `settings` quản lý cấu hình ứng dụng lưu trong bảng `app_settings`. Đây là cấu hình nghiệp vụ/runtime có thể hiển thị hoặc chỉnh từ UI admin, không phải nơi lưu secret.

## Đọc Code Theo Thứ Tự

1. `settings.routes.ts`: `GET /settings`, `POST /settings/seed-defaults`, `PUT /settings/:id` và permission `settings:update`.
2. `settings.validation.ts`: query filters, id param, body update.
3. `settings.controller.ts`: lấy `req.user.id` cho seed/update.
4. `settings.service.ts`: danh sách cấu hình mặc định, service boundary và lỗi 404.
5. `settings.repository.ts`: query/update/seed `app_settings`.
6. `config/config.ts`: cấu hình môi trường thật từ `.env`.

## Endpoints

| Method | Path | Mô tả | Auth |
| --- | --- | --- | --- |
| GET | `/settings` | Danh sách app settings | Không |
| POST | `/settings/seed-defaults` | Tạo các cấu hình mặc định bằng `INSERT IGNORE` | `settings:update` |
| PUT | `/settings/:id` | Cập nhật `setting_value`, `description`, `updated_by` | `settings:update` |

## Query Params

| Param | Type | Mô tả |
| --- | --- | --- |
| `id` | number | Lọc theo setting id |
| `search` | string | Tìm theo `setting_key` |

## Default Settings

`POST /settings/seed-defaults` hiện tạo các khóa mặc định nếu chưa tồn tại:

| Key | Value mặc định | Mô tả |
| --- | --- | --- |
| `warehouse.default_code` | `"HCM01"` | Mã kho mặc định khi tạo dữ liệu vận hành |
| `stock.low_stock_threshold_percent` | `20` | Ngưỡng cảnh báo tồn thấp |
| `stock.expiry_warning_days` | `30` | Số ngày cảnh báo gần hết hạn |
| `quick_receive.require_lot_number` | `false` | Bắt buộc nhập lô khi nhập nhanh bằng QR |
| `notifications.auto_generate_from_alerts` | `true` | Tự động sinh thông báo từ cảnh báo |

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