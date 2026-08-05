# Stock Counts Feature

## Muc tieu nghiep vu

Module `stock-counts` thuc hien quy trinh kiem ke ton kho thuc te, so sanh voi du lieu he thong va tao phieu dieu chinh ton kho tu dong neu co chanh lech.

## Doc code theo thu tu

1. `services/stockCountService.ts`: goi cac API theo quy trinh kiem ke (Create -> Start -> Count -> Submit -> Approve).
2. `pages/StockCountsPage.tsx`: danh sach phieu kiem ke, tao phieu, va modal nhap so luong dem thuc te theo vi tri.

## API su dung

| Method | Path | Mo ta | Permission |
|---|---|---|---|
| GET | `/stock-counts` | Lay danh sach phieu kiem ke | - |
| POST | `/stock-counts` | Tao phieu kiem ke (DRAFT) | `stock_counts:create` |
| POST | `/stock-counts/:id/start` | Bat dau kiem ke (IN_PROGRESS) | `stock_counts:start` |
| PATCH | `/stock-counts/:id/count` | Ghi nhan so luong dem thuc te | `stock_counts:count` |
| POST | `/stock-counts/:id/submit` | Gui phieu kiem ke (SUBMITTED) | `stock_counts:submit` |
| POST | `/stock-counts/:id/approve` | Duyet phieu kiem ke (APPROVED) | `stock_counts:approve` |

## Luong kiem ke

```
DRAFT -> IN_PROGRESS -> SUBMITTED -> APPROVED / REJECTED -> COMPLETED
```
