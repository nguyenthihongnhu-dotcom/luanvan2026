# Stock Module

## Mục tiêu nghiệp vụ

Module `stock` là phần đọc tồn kho và preview phân bổ. Nó không tạo phiếu và không mutate tồn trong các endpoint hiện tại.

## Đọc code theo thứ tự

1. `stock.routes.ts`: current, near-expiry, allocation.
2. `stock.validation.ts`: query params hợp lệ.
3. `stock.controller.ts`: parse query.
4. `stock.service.ts`: gọi repository.
5. `stock.repository.ts`: query view/tồn và thuật toán allocation.

## Endpoint hiện có

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/stock/current` | Tồn hiện tại theo vị trí/lô/SKU |
| GET | `/stock/near-expiry` | Hàng gần hết hạn |
| GET | `/stock/allocation` | Preview FEFO/FIFO allocation |

## Allocation preview

```text
GET /stock/allocation?warehouseId=1&productVariantId=10&quantity=5&strategy=FEFO
  -> parse query
  -> tìm stock_locations available
  -> sort theo FEFO hoặc FIFO
  -> trả danh sách batch/location sẽ lấy
  -> không update database
```

## Khi sửa module này

- Giữ endpoint readonly nếu tên là preview/list.
- Nếu logic allocation thay đổi, kiểm tra goods issue vì xuất kho thật cần cùng nguyên tắc.
- Không dùng report query nặng trực tiếp cho màn realtime nếu dữ liệu lớn; cân nhắc view/index.