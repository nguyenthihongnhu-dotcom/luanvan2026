# Inventory Transactions Feature

## Muc tieu nghiep vu

Module `inventory-transactions` hien thi lich su bien dong ton kho: moi lan nhap/xuat/chuyen/dieu chinh duoc ghi lai thanh 1 dong giao dich. Append-only, khong the sua.

## Doc code theo thu tu

1. `services/inventoryTransactionService.ts`: goi GET /inventory-transactions, map sang InventoryTransaction.
2. `pages/InventoryTransactionsPage.tsx`: hien thi bang, filter theo SKU / loai giao dich / khoang thoi gian.

## API su dung

| Method | Path | Mo ta |
|---|---|---|
| GET | `/inventory-transactions` | Lich su bien dong ton kho |

## Thong tin hien thi

| Cot | Y nghia |
|---|---|
| Loai | INBOUND / OUTBOUND / TRANSFER_IN / TRANSFER_OUT / ADJUSTMENT |
| SKU | Ma san pham |
| Vi tri | Khu - Ke - Tang |
| So luong | +/- so luong thay doi |
| Ton truoc / sau | Snapshot tai thoi diem giao dich |
| Nguoi thuc hien | Nhan vien tao chung tu |
| Thoi gian | Timestamp ghi nhan |

## Luu y

- inventory_transactions la append-only ca o frontend lan backend.
- Moi confirm/reverse phieu tao it nhat 1 dong giao dich.
- Dung man nay de doi soat khi ton khong khop voi chung tu.
