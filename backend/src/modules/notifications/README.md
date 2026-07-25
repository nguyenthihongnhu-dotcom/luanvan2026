# Notifications Module

## Mục tiêu nghiệp vụ

Module `notifications` đọc và sinh thông báo cho user từ các cảnh báo hoặc sự kiện hệ thống. Nó là cầu nối từ dữ liệu vận hành sang trải nghiệm người dùng.

## Đọc code theo thứ tự

1. `notifications.routes.ts`: endpoint list và generate.
2. `notifications.validation.ts`: filter id/search.
3. `notifications.controller.ts`: parse query và gọi service.
4. `notifications.service.ts`: list/generate.
5. `notifications.repository.ts`: query notifications và sinh notification từ alerts.
6. `alerts` module: nguồn dữ liệu chính cho generate hiện tại.

## Endpoint hiện có

| Method | Path | Mô tả | Permission |
| --- | --- | --- | --- |
| GET | `/notifications` | Danh sách thông báo | Không trong demo |
| POST | `/notifications/generate` | Sinh thông báo từ alert OPEN | `notifications:generate` |
| POST | `/notifications/read-all` | Đánh dấu tất cả thông báo của user hiện tại là đã đọc | `notifications:read` |
| PATCH | `/notifications/:id/read` | Đánh dấu một thông báo là đã đọc | `notifications:read` |

## Luồng generate từ alerts

```text
POST /notifications/generate
  -> verifyToken
  -> requirePermission('notifications:generate')
  -> generateNotificationsFromAlerts()
      -> lấy alerts OPEN
      -> ưu tiên assigned_to nếu có
      -> nếu không có assigned_to, lấy user primary warehouse từ user_warehouses
      -> nếu vẫn không có, fallback ADMIN/WAREHOUSE_MANAGER active
      -> INSERT notifications
      -> NOT EXISTS để tránh tạo trùng notification cho cùng alert/user
  -> trả { createdCount }
```

## Dữ liệu phụ thuộc

- `alerts`
- `notifications`
- `users`
- `roles`
- `user_warehouses`

## Khi sửa module này

- Nếu thông báo theo user hiện tại, endpoint list nên lọc bằng `req.user.id` khi bật auth chặt.
- Nếu thêm realtime, service có thể emit qua Socket.IO sau khi insert DB.
- Không tạo notification trùng cho cùng `reference_type/reference_id/user_id`.
- Không để notification generate phụ thuộc frontend state.