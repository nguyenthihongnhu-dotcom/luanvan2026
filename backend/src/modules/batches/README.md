# Batches Module

## Mục tiêu nghiệp vụ

Module `batches` đọc danh sách lô hàng sản phẩm. Lô hàng quan trọng với ngành Mẹ & Bé vì nhiều sản phẩm có hạn sử dụng và cần xuất theo FEFO.

## Đọc code theo thứ tự

1. `batches.routes.ts`: endpoint list.
2. `batches.validation.ts`: filter id/search/status.
3. `batches.controller.ts`: parse query.
4. `batches.service.ts`: service boundary.
5. `batches.repository.ts`: query bảng `product_batches`.
6. `catalog` và `stock` module để hiểu batch được tạo/dùng ra sao.

## Endpoint hiện có

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/batches` | Danh sách product batches |

## Query params

| Param | Type | Mô tả |
| --- | --- | --- |
| `id` | number | Lọc theo batch id |
| `search` | string | Tìm theo `lot_number` |
| `status` | string | Lọc trạng thái batch |

## Vai trò trong flow tồn kho

```text
product_variants
  -> product_batches
    -> stock_locations
      -> allocation FEFO/FIFO
      -> near-expiry report
      -> alerts NEAR_EXPIRY
```

## Khi sửa module này

- Nếu thêm API tạo batch, phải kiểm tra product variant tồn tại.
- Nếu batch có expiry date, format date phải thống nhất với MySQL.
- Không xóa batch đã có tồn hoặc transaction; dùng soft delete/status nếu cần.
- FEFO phụ thuộc `expiry_date`, nên không được để dữ liệu hạn sử dụng sai cho SKU tracking expiry.