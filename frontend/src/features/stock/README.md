# Stock Feature

## Muc tieu nghiep vu

Module `stock` theo doi ton kho hien tai chi tiet theo vi tri/lo hang va ho tro tinh nang xem truoc phan bo xuat kho (Allocation preview - FEFO).

## Doc code theo thu tu

1. `services/stockService.ts`: goi API xem ton kho hien tai va tinh phan bo.
2. `pages/StockPage.tsx`: man hinh tra cuu ton kho, tim kiem theo SKU/Kho/Vi tri va tool test phan bo xuat hang.

## API su dung

| Method | Path | Mo ta |
|---|---|---|
| GET | `/stock/current` | Danh sach ton kho hien tai theo vi tri & lo |
| POST | `/stock/allocate` | Xem truoc phan bo vi tri lay hang theo thu tu FEFO |

## Luu y

- Ton kho thay doi thuc te chi khi cac chung tu (Receipt/Issue/Transfer/Adjustment) duoc Confirm/Approve.
