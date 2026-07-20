# Alerts Module

## Mục tiêu nghiệp vụ

Module `alerts` tạo và đọc cảnh báo vận hành kho, ví dụ tồn thấp, hết hàng, vượt tồn tối đa hoặc hàng gần hết hạn.

## Đọc code theo thứ tự

1. `alerts.routes.ts`: endpoint list và generate.
2. `alerts.validation.ts`: filter id/search/status.
3. `alerts.controller.ts`: parse query/body và gọi service.
4. `alerts.service.ts`: service list/generate.
5. `alerts.repository.ts`: query alerts và SQL sinh cảnh báo từ view tồn.
6. `notifications` module: đọc tiếp để hiểu cách cảnh báo biến thành thông báo.

## Endpoint hiện có

| Method | Path | Mô tả | Permission |
| --- | --- | --- | --- |
| GET | `/alerts` | Danh sách cảnh báo | Không trong demo |
| POST | `/alerts/generate` | Sinh cảnh báo từ tồn hiện tại | `alerts:generate` |

## Query params list

| Param | Type | Mô tả |
| --- | --- | --- |
| `id` | number | Lọc theo alert id |
| `search` | string | Tìm theo title |
| `status` | string | Lọc trạng thái cảnh báo |

## Luồng generate

```text
POST /alerts/generate
  -> verifyToken
  -> requirePermission('alerts:generate')
  -> generateAlertsController
  -> generateInventoryAlerts()
      -> INSERT LOW_STOCK/OUT_OF_STOCK từ vw_product_total_stock
      -> INSERT OVER_MAX_STOCK từ vw_product_total_stock
      -> INSERT NEAR_EXPIRY từ vw_near_expiry_stock
      -> NOT EXISTS để tránh tạo trùng alert OPEN
  -> trả { createdCount }
```

## Dữ liệu phụ thuộc

- `vw_product_total_stock`
- `vw_near_expiry_stock`
- `stock_locations`
- `product_batches`
- `alerts`

## Rule quan trọng

- Generate phải tránh tạo trùng alert đang OPEN cho cùng warehouse/product/batch.
- Alert không trực tiếp thay đổi tồn.
- Alert là đầu vào cho notifications.

## Khi sửa module này

- Nếu thêm loại alert mới, cập nhật enum/status trong schema SQL nếu có.
- Kiểm tra query generate có idempotent không.
- Nếu thêm auto scheduler, không đặt cron logic trực tiếp trong repository; tạo service/job riêng.