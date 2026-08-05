# Reports Feature

## Muc tieu nghiep vu

Module `reports` cung cap cac bao cao tong hop: Ton kho theo vi tri, hang sap het han (near-expiry), va lich su xuat nhap ton theo thoi gian.

## Doc code theo thu tu

1. `services/reportService.ts`: goi cac endpoint bao cao tu backend.
2. `pages/ReportsPage.tsx`: hien thi dashboard bao cao voi bieu do va bang du lieu.

## API su dung

| Method | Path | Mo ta |
|---|---|---|
| GET | `/reports/product-stock` | Báo cáo tồn kho tổng hợp |
| GET | `/reports/near-expiry` | Báo cáo sản phẩm cận hạn sử dụng |
| GET | `/reports/stock-movement` | Báo cáo biến động nhập xuất tồn |

## Luu y

- Du lieu bao cao la Read-only.
- Du lieu phan tich dua tren `inventory_transactions` va views ton kho hien tai.
