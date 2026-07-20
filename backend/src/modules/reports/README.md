# Reports Module

## Mục tiêu nghiệp vụ

Module `reports` cung cấp dữ liệu tổng hợp readonly cho frontend dashboard/báo cáo. Module này không thay đổi tồn kho.

## Đọc code theo thứ tự

1. `reports.routes.ts`: các endpoint report.
2. `reports.validation.ts`: query filters chung.
3. `reports.controller.ts`: gọi từng service report.
4. `reports.service.ts`: service boundary.
5. `reports.repository.ts`: query view và aggregate từ `inventory_transactions`.
6. `warehouse_database_design.md`: xem view database.

## Endpoint hiện có

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/reports` | Mặc định trả product stock report |
| GET | `/reports/product-stock` | Tổng tồn theo sản phẩm/SKU |
| GET | `/reports/near-expiry` | Hàng gần hết hạn |
| GET | `/reports/inventory-movements` | Tổng hợp biến động tồn theo ngày/type |
| GET | `/reports/inventory-transactions` | Log giao dịch tồn dạng report |

## Query params chung

| Param | Type | Mô tả |
| --- | --- | --- |
| `id` | number | Tùy report, thường là product variant id |
| `search` | string | Tìm SKU/tên sản phẩm/lot/reference |
| `warehouseId` | number | Lọc theo kho |
| `productVariantId` | number | Lọc theo SKU/variant |
| `dateFrom` | date string | Từ ngày |
| `dateTo` | date string | Đến ngày |

## Dữ liệu phụ thuộc

```text
vw_product_total_stock -> product-stock
vw_near_expiry_stock -> near-expiry
inventory_transactions -> inventory-movements, inventory-transactions
```

## Luồng product stock report

```text
GET /reports/product-stock
  -> parseReportsFilters
  -> findProductStockReport(filters)
      -> search sku/product/variant
      -> filter warehouseId/productVariantId
      -> SELECT * FROM vw_product_total_stock LIMIT 100
```

## Luồng inventory movement report

```text
GET /reports/inventory-movements
  -> filter warehouse/product/date range
  -> group inventory_transactions theo DATE(created_at), warehouse, productVariant, transaction_type
  -> SUM(quantity), COUNT(*)
```

## Khi sửa module này

- Report phải readonly; không mutate bảng nghiệp vụ.
- Query nặng nên ưu tiên view/index phù hợp.
- Nếu thêm filter mới, cập nhật `reports.validation.ts`, repository và frontend service.
- Nếu số lượng dữ liệu tăng, thêm pagination thay vì `LIMIT 100` cố định.