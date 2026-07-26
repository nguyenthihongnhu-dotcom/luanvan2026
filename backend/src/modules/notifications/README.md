# Notifications Module

## Mục tiêu nghiệp vụ

Module `notifications` quản lý thông báo cho user. Hiện nguồn chính là alert vận hành kho; về sau có thể mở rộng cho phiếu cần duyệt, phiếu bị từ chối hoặc sự kiện hệ thống.

## Đọc code theo thứ tự

1. `notifications.routes.ts`: endpoint list, generate, read-one, read-all.
2. `notifications.validation.ts`: filter list và validate id.
3. `notifications.controller.ts`: lấy `req.user`, gọi service.
4. `notifications.service.ts`: rule sinh thông báo và đánh dấu đọc.
5. `notifications.repository.ts`: SQL trên `notifications`, `alerts`, `users`, `roles`, `user_warehouses`.
6. `alerts` module: nguồn dữ liệu sinh notification hiện tại.

## Endpoints

| Method | Path | Mô tả | Permission |
| --- | --- | --- | --- |
| GET | `/notifications` | Danh sách thông báo của user hiện tại | `notifications:read` |
| POST | `/notifications/generate` | Sinh thông báo từ alert OPEN | `notifications:generate` |
| POST | `/notifications/read-all` | Đánh dấu tất cả thông báo của user hiện tại là đã đọc | `notifications:read` |
| PATCH | `/notifications/:id/read` | Đánh dấu một thông báo của user hiện tại là đã đọc | `notifications:read` |

## Luồng generate từ alerts

```text
POST /notifications/generate
  -> verifyToken
  -> requirePermission('notifications:generate')
  -> generateNotificationsFromAlerts()
      -> lấy alerts OPEN
      -> ưu tiên alert.assigned_to nếu có
      -> nếu không có assigned_to, lấy user primary warehouse từ user_warehouses
      -> nếu vẫn không có, fallback ADMIN/WAREHOUSE_MANAGER active
      -> INSERT notifications
      -> NOT EXISTS để tránh tạo trùng cho cùng alert/user
  -> emit Socket.IO `notification:new` đến room user:{user_id}
  -> trả { createdCount }
```

## Dữ liệu phụ thuộc

- `notifications`
- `alerts`
- `users`
- `roles`
- `user_warehouses`

## Rule quan trọng

- Không tạo notification trùng cho cùng `reference_type/reference_id/user_id`.
- `GET /notifications` phải đi qua `verifyToken`, `notifications:read` và luôn lọc theo `req.user.id`; không trả thông báo của user khác.
- `read` và `read-all` phải xử lý theo user hiện tại, tránh user này đánh dấu thông báo của user khác.
- Realtime dùng Socket.IO room `user:{id}`. Backend chỉ emit sau khi DB ghi notification thành công; frontend nhận `notification:new` rồi chèn vào đầu danh sách nếu chưa có id đó.
- Frontend chỉ nên hiển thị mutation nếu user có permission tương ứng.
