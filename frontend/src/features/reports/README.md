# Reports Feature

## Route

`/reports`

## Mục đích

Dashboard báo cáo riêng cho tồn kho, lô gần hết hạn, biến động tồn và transaction report.

## Luồng code

- `pages/ReportsPage.tsx`: tab report, filter chung, bảng động theo key backend trả về.
- `services/reportService.ts`: gọi `/reports/product-stock`, `/reports/near-expiry`, `/reports/inventory-movements`, `/reports/inventory-transactions`.

## Lưu ý

- Không hardcode mock dữ liệu. Nếu report trống thì hiển thị empty state của table.
