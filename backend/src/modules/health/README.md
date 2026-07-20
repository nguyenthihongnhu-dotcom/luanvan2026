# Health Module

## Mục tiêu kỹ thuật

Module `health` dùng để kiểm tra backend và database còn hoạt động. Đây là endpoint đầu tiên nên gọi khi debug local.

## Đọc code theo thứ tự

1. `health.routes.ts`: endpoint `/` dưới base `/health`.
2. `health.controller.ts`: trả response từ service.
3. `health.service.ts`: query `SELECT 1` để kiểm tra MySQL.
4. `database/db.ts`: connection pool MySQL.

## Endpoint hiện có

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/health` | Kiểm tra service và database |

## Response mẫu

```json
{
  "status": "ok",
  "database": "ok",
  "service": "warehouse-api"
}
```

## Khi endpoint này lỗi

Kiểm tra theo thứ tự:

1. Backend đã chạy chưa.
2. `.env` có `DATABASE_URL` đúng chưa.
3. MySQL/WAMP service đã bật chưa.
4. Database đã được tạo/import schema chưa.
5. User/password MySQL đúng chưa.

## Lưu ý

- Không thêm query nặng vào health check.
- Không expose thông tin nhạy cảm trong health response.
- Nếu cần readiness/liveness riêng cho production, tách endpoint rõ ràng.