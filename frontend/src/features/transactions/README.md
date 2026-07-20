# Transactions Feature

## Mục tiêu

Feature `transactions` hiển thị lịch sử giao dịch kho và tạo header giao dịch nhập/xuất/điều chỉnh.

## Đọc code theo thứ tự

1. `pages/TransactionsPage.tsx`: table, filter loại giao dịch, labels tiếng Việt.
2. `hooks/useTransactions.ts`: state list/modal/detail/form, load/create transaction.
3. `services/transactionService.ts`: gọi nhiều endpoint backend và merge thành một list.
4. `components/TransactionModal.tsx`: form tạo giao dịch.
5. `components/TransactionDetailModal.tsx`: modal chi tiết.

## Backend API

| Loại | List API | Create API |
| --- | --- | --- |
| Nhập kho | `GET /goods-receipts` | `POST /goods-receipts` |
| Xuất kho | `GET /goods-issues` | `POST /goods-issues` |
| Điều chỉnh | `GET /stock-adjustments` | `POST /stock-adjustments` |

## Luồng list giao dịch

```text
TransactionsPage
  -> useTransactions
  -> transactionService.listTransactions
      -> Promise.all GET receipts/issues/adjustments
      -> map mỗi row sang Transaction
      -> loai = NHAP/XUAT/DIEU_CHINH
      -> sort theo ngày giảm dần
  -> page map loai/status sang tiếng Việt
```

## Lưu ý hiện tại

- Create hiện mới tạo header phiếu, chưa tạo item chi tiết đầy đủ cho confirm.
- Confirm/reverse/approve là nghiệp vụ backend protected, frontend chưa có button flow đầy đủ.
- Không còn fallback mock; backend lỗi thì hook set error.

## Khi sửa feature này

- Nếu thêm confirm/approve UI, phải login user có permission và gọi endpoint protected.
- Nếu thêm item chi tiết, cần backend item API hoặc mở rộng create payload.
- Không hiển thị `NHAP`, `XUAT`, `DIEU_CHINH` raw; luôn map sang `Nhập kho`, `Xuất kho`, `Điều chỉnh`.