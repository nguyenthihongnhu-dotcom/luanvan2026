# Stock Transfers Feature

## Muc tieu nghiep vu

Module `transfers` quan ly phieu chuyen kho/chuyen vi tri noi bo giua cac vi tri hoac giua cac kho.

## Doc code theo thu tu

1. `services/transferService.ts`: quan ly API chuyen kho (`/stock-transfers`).
2. `pages/TransfersPage.tsx`: danh sach phieu chuyen kho, modal tao phieu, chi tiet va cac thao tac Xac nhan / Dao phieu.

## API su dung

| Method | Path | Mo ta | Permission |
|---|---|---|---|
| GET | `/stock-transfers` | Danh sach phieu chuyen kho | - |
| POST | `/stock-transfers` | Tao phieu chuyen kho (DRAFT) | - |
| POST | `/stock-transfers/:id/confirm` | Xac nhan chuyen kho (Tru kho nguon, tang kho dich) | `stock_transfers:confirm` |
| POST | `/stock-transfers/:id/reverse` | Dao phieu chuyen kho (Hoan lai ton kho) | `stock_transfers:reverse` |

