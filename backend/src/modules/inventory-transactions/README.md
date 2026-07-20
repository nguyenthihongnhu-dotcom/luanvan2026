# Inventory Transactions Module

## Mục tiêu nghiệp vụ

Module `inventory-transactions` đọc log biến động tồn kho. Đây là lịch sử bất biến của các thao tác nhập, xuất, chuyển, điều chỉnh và reverse.

## Đọc code theo thứ tự

1. `inventory-transactions.routes.ts`: endpoint list.
2. `inventory-transactions.validation.ts`: filter id/search.
3. `inventory-transactions.controller.ts`: parse query.
4. `inventory-transactions.service.ts`: service boundary.
5. `inventory-transactions.repository.ts`: query bảng `inventory_transactions`.
6. Các repository nghiệp vụ như goods receipts/issues/transfers/adjustments để xem nơi ghi log.

## Endpoint hiện có

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/inventory-transactions` | Danh sách log biến động tồn |

## Query params

| Param | Type | Mô tả |
| --- | --- | --- |
| `id` | number | Lọc theo transaction id |
| `search` | string | Tìm theo `transaction_code` |

## Ai ghi vào bảng này?

```text
goods-receipts confirm/reverse
  -> inventory_transactions RECEIPT/REVERSAL

goods-issues confirm/reverse
  -> inventory_transactions ISSUE/REVERSAL

stock-transfers confirm/reverse
  -> inventory_transactions TRANSFER/REVERSAL

stock-adjustments approve
  -> inventory_transactions ADJUSTMENT
```

## Rule quan trọng

- Không update/delete trực tiếp log này.
- Nếu chứng từ sai, tạo reverse hoặc adjustment đối ứng.
- Ghi log phải nằm cùng transaction với thay đổi `stock_locations`.
- Report và audit nghiệp vụ phụ thuộc log này nên dữ liệu phải nhất quán.