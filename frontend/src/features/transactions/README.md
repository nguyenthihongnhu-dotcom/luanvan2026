# Transactions Feature

## Muc tieu nghiep vu

Module `transactions` la trung tam quan ly cac chung tu kho bao gom: Phieu nhap (Goods Receipts), Phieu xuat (Goods Issues), va Phieu dieu chinh (Stock Adjustments).

## Doc code theo thu tu

1. `services/transactionService.ts`: goi API CRUD va confirm/reverse/approve cho 3 loai phieu.
2. `hooks/useTransactions.ts`: hook tong hop danh sach giao dich tu nhap/xuat/dieu chinh.
3. `pages/TransactionsPage.tsx`: bang tong hop tat ca phieu kho, bo loc theo loai/trang thai/ngay, va xuat CSV.
4. `pages/TransactionDetailPage.tsx`: xem chi tiet va thao tac tren 1 phieu kho.
5. `components/TransactionModal.tsx`: modal tao phieu nhap/xuat/dieu chinh moi.
6. `components/TransactionDetailModal.tsx`: modal xem nhanh chi tiet va xac nhan/dao phieu.

## API su dung

| Method | Path | Mo ta | Permission |
|---|---|---|---|
| GET/POST | `/goods-receipts` | Quan ly phieu nhap | `goods_receipts:confirm` |
| POST | `/goods-receipts/:id/confirm` | Xac nhan nhap kho | `goods_receipts:confirm` |
| POST | `/goods-receipts/:id/reverse` | Dao phieu nhap | `goods_receipts:reverse` |
| GET/POST | `/goods-issues` | Quan ly phieu xuat | `goods_issues:confirm` |
| POST | `/goods-issues/:id/confirm` | Xac nhan xuat kho | `goods_issues:confirm` |
| GET/POST | `/stock-adjustments` | Quan ly phieu dieu chinh | `stock_adjustments:approve` |

