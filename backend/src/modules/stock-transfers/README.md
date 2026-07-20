# Stock Transfers Module

## Mục tiêu nghiệp vụ

Module `stock-transfers` điều chuyển hàng giữa hai vị trí/kho. Flow này vừa giảm tồn nguồn vừa tăng tồn đích trong cùng transaction.

## Đọc code theo thứ tự

1. `stock-transfers.routes.ts`: endpoint confirm/reverse.
2. `stock-transfers.validation.ts`: parse id.
3. `stock-transfers.controller.ts`: lấy user confirm/reverse.
4. `stock-transfers.service.ts`: map domain error.
5. `stock-transfers.repository.ts`: transaction chuyển tồn.

## Endpoint hiện có

| Method | Path | Mô tả | Permission |
| --- | --- | --- | --- |
| GET | `/stock-transfers` | List phiếu chuyển kho | Không |
| POST | `/stock-transfers/:id/confirm` | Xác nhận chuyển kho | `stock_transfers:confirm` |
| POST | `/stock-transfers/:id/reverse` | Đảo phiếu chuyển kho | `stock_transfers:reverse` |

## Luồng confirm

```text
confirmStockTransfer(input)
  -> confirmStockTransferTransaction(input)
      -> beginTransaction
      -> lock phiếu chuyển
      -> validate DRAFT/PENDING
      -> lấy items
      -> lock source stock
      -> kiểm tra source đủ tồn
      -> kiểm tra source/destination location thuộc đúng warehouse
      -> trừ source stock
      -> upsert/tăng destination stock
      -> ghi inventory_transactions
      -> update transfer status CONFIRMED
      -> commit
```

## Khi sửa module này

- Source và destination update phải cùng transaction.
- Reverse phải kiểm tra đích còn đủ tồn để trả lại nguồn.
- Không cho transfer tới location không thuộc warehouse đích.