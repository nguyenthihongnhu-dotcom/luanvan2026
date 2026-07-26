# Alerts Module

## Mục tiêu nghiệp vụ

Module `alerts` quản lý cảnh báo vận hành kho: tồn thấp, hết hàng, vượt tồn tối đa, hàng gần hết hạn. Alert không làm thay đổi tồn kho, nó chỉ phản ánh trạng thái cần người vận hành xử lý.

## Đọc code theo thứ tự

1. `alerts.routes.ts`: endpoint list, generate, read, resolve.
2. `alerts.validation.ts`: filter list và validate route params.
3. `alerts.controller.ts`: parse query/body, lấy user từ `req.user`.
4. `alerts.service.ts`: orchestration cho list/generate/read/resolve.
5. `alerts.repository.ts`: SQL đọc alert và sinh alert từ view tồn.
6. `notifications` module: biến alert thành thông báo cho user.

## Endpoints

| Method | Path | Mô tả | Permission |
| --- | --- | --- | --- |
| GET | `/alerts` | Danh sách cảnh báo | Không trong scope demo |
| POST | `/alerts/generate` | Sinh cảnh báo từ tồn hiện tại | `alerts:generate` |
| PATCH | `/alerts/:id/read` | Đánh dấu đã đọc | `alerts:read` |
| PATCH | `/alerts/:id/resolve` | Đánh dấu đã xử lý | `alerts:resolve` |

## Query params list

| Param | Type | Mô tả |
| --- | --- | --- |
| `id` | number | Lọc theo alert id |
| `search` | string | Tìm theo tiêu đề/nội dung |
| `status` | string | Lọc trạng thái cảnh báo |

## Luồng generate

```text
POST /alerts/generate
  -> verifyToken
  -> requirePermission('alerts:generate')
  -> generateAlertsController
  -> generateInventoryAlerts()
      -> đọc vw_product_total_stock và vw_near_expiry_stock
      -> tạo LOW_STOCK / OUT_OF_STOCK / OVER_MAX_STOCK / NEAR_EXPIRY
      -> dùng NOT EXISTS để tránh tạo trùng alert OPEN
  -> trả { createdCount }
```

## Trạng thái

- `OPEN`: cảnh báo mới, chưa xử lý.
- `READ`: user đã đọc nhưng chưa resolve.
- `RESOLVED`: cảnh báo đã xử lý xong.

## Dữ liệu phụ thuộc

- `alerts`
- `vw_product_total_stock`
- `vw_near_expiry_stock`
- `stock_locations`
- `product_batches`

## Rule quan trọng

- Generate phải idempotent, chạy nhiều lần không tạo trùng cảnh báo đang mở.
- `read` chỉ thay đổi trạng thái đọc, không được coi là đã xử lý nghiệp vụ.
- `resolve` cần lưu người xử lý/thời điểm xử lý để frontend không phải tự đoán trạng thái.
- Nếu thêm scheduler tự động, đặt ở service/job riêng; repository chỉ giữ SQL.