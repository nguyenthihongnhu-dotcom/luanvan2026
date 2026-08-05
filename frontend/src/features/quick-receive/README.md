# Quick Receive Feature

## Muc tieu nghiep vu

Module `quick-receive` cung cap giao dien nhan hang nhanh (Optimized cho thiet bi di dong / may quat barcode). Cho phep nhan hang, chon vi tri kho va tao/xac nhan phieu nhap ngay lap tuc.

## Doc code theo thu tu

1. `services/quickReceiveService.ts`: goi API tao phieu nhap nhanh va tu dong confirm.
2. `pages/QuickReceivePage.tsx`: man hinh quat ma vach, nhap SKU, chon vi tri va so luong.

## API su dung

| Method | Path | Mo ta |
|---|---|---|
| POST | `/goods-receipts` | Tao phieu nhap moi tu quat ma |
| POST | `/goods-receipts/:id/confirm` | Tu dong xac nhan phieu nhap de tang ton kho ngay |

## Luu y

- Quick receive bo qua buoc luu nhap (DRAFT) va confirm ngay trong mot luong thao tac.
- Phu hop voi nhan vien kho thao tac nhanh tai khu vuc nhan hang.
