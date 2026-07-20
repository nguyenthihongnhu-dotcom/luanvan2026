# Backend Module Docs

Docs chi tiết của từng tính năng nằm ngay trong module tương ứng:

```text
backend/src/modules/<module>/README.md
```

Trang này sắp xếp module theo thứ tự nên đọc và thứ tự phụ thuộc để dự án vận hành trơn tru.

## 1. Foundation

Đọc để hiểu app boot, health, docs API và error handling.

- [health](../../src/modules/health/README.md)
- [openapi](../../src/modules/openapi/README.md)

Code nền liên quan:

```text
backend/src/app.ts
backend/src/common/http.ts
backend/src/common/validation/validate.ts
backend/src/config/config.ts
backend/src/database/db.ts
```

## 2. Identity & Permission

Đọc trước khi sửa endpoint có confirm/approve/generate.

- [auth](../../src/modules/auth/README.md)
- [authorization](../../src/modules/authorization/README.md)

Code nền liên quan:

```text
backend/src/common/types/express.d.ts
backend/src/common/middleware/require-permission.middleware.ts
```

## 3. Master Data

Các module này tạo dữ liệu nền. Thiếu chúng thì stock/document/report khó hoạt động.

- [warehouses](../../src/modules/warehouses/README.md)
- [locations](../../src/modules/locations/README.md)
- [catalog](../../src/modules/catalog/README.md)
- [suppliers](../../src/modules/suppliers/README.md)
- [batches](../../src/modules/batches/README.md)

Dependency chính:

```text
warehouses -> locations -> stock_locations
catalog -> product_variants -> batches -> stock_locations
suppliers -> goods_receipts
```

## 4. Stock Core

Đọc trước khi đụng nghiệp vụ nhập/xuất/chuyển/điều chỉnh.

- [stock](../../src/modules/stock/README.md)
- [inventory-transactions](../../src/modules/inventory-transactions/README.md)

Dependency chính:

```text
stock_locations -> stock reports/allocation
inventory_transactions <- mọi flow confirm/approve/reverse
```

## 5. Inventory Documents

Các module này thay đổi tồn kho thật khi confirm/approve.

- [goods-receipts](../../src/modules/goods-receipts/README.md)
- [goods-issues](../../src/modules/goods-issues/README.md)
- [stock-transfers](../../src/modules/stock-transfers/README.md)
- [stock-counts](../../src/modules/stock-counts/README.md)
- [stock-adjustments](../../src/modules/stock-adjustments/README.md)

Dependency chính:

```text
goods_receipts -> stock_locations + inventory_transactions
goods_issues -> allocation + stock_locations + inventory_transactions
stock_transfers -> source stock + destination stock + inventory_transactions
stock_counts -> stock_count_items -> stock_adjustments
stock_adjustments -> stock_locations + inventory_transactions
```

## 6. Operations & Reporting

Đọc sau khi hiểu stock core.

- [reports](../../src/modules/reports/README.md)
- [alerts](../../src/modules/alerts/README.md)
- [notifications](../../src/modules/notifications/README.md)
- [audit-logs](../../src/modules/audit-logs/README.md)
- [attachments](../../src/modules/attachments/README.md)
- [settings](../../src/modules/settings/README.md)

Dependency chính:

```text
stock_locations + inventory_transactions -> reports
stock_locations + product_batches -> alerts
alerts/users -> notifications
business actions -> audit_logs
business entities -> attachments
app_settings -> runtime/business configuration
```

## Khi thêm module mới

1. Xác định module nằm ở tầng nào.
2. Tạo README ngay trong `src/modules/<module>/README.md`.
3. Cập nhật `backend/docs/overview.md` nếu module ảnh hưởng dependency tổng.
4. Cập nhật file index này nếu module cần intern đọc theo thứ tự.