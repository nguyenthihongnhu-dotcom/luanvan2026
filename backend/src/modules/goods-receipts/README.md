# Goods Receipts Module

## Mục Tiêu Nghiệp Vụ

Module `goods-receipts` xử lý nhập kho. Phiếu nhập là chứng từ; tồn chỉ tăng khi phiếu được confirm.

## Đọc Code Theo Thứ Tự

1. `goods-receipts.routes.ts`: list/detail/create/confirm/reverse và permission.
2. `goods-receipts.validation.ts`: parse query/id/body.
3. `goods-receipts.controller.ts`: HTTP boundary, lấy `req.user.id` cho confirm/reverse.
4. `goods-receipts.service.ts`: map domain error sang `HttpError`.
5. `goods-receipts.repository.ts`: detail query và transaction confirm/reverse.
6. `goods-receipts.model.ts`: type input/result/row.

## Endpoints

| Method | Path | Mô tả | Permission |
| --- | --- | --- | --- |
| GET | `/goods-receipts` | List phiếu nhập | Không |
| GET | `/goods-receipts/:id` | Detail header + items | Không |
| POST | `/goods-receipts` | Tạo phiếu nhập kèm items | Không trong demo |
| POST | `/goods-receipts/:id/confirm` | Xác nhận và tăng tồn | `goods_receipts:confirm` |
| POST | `/goods-receipts/:id/reverse` | Đảo phiếu nhập | `goods_receipts:reverse` |

## Luồng Confirm

```text
confirmGoodsReceipt(input)
  -> confirmGoodsReceiptTransaction(input)
      -> beginTransaction
      -> SELECT goods_receipts FOR UPDATE
      -> validate status DRAFT/PENDING
      -> SELECT items
      -> validate batch/expiry/location
      -> upsert/tăng stock_locations
      -> insert inventory_transactions type RECEIPT
      -> update goods_receipts status CONFIRMED
      -> commit
```

## Domain Error Quan Trọng

- `GOODS_RECEIPT_NOT_FOUND`: phiếu không tồn tại.
- `GOODS_RECEIPT_NOT_CONFIRMABLE`: trạng thái không cho confirm.
- `GOODS_RECEIPT_HAS_NO_ITEMS`: phiếu chưa có dòng.
- `BATCH_REQUIRED`: SKU tracking lô nhưng thiếu batch.
- `EXPIRY_DATE_REQUIRED`: SKU tracking hạn nhưng thiếu expiry.
- `LOCATION_WAREHOUSE_MISMATCH`: vị trí không thuộc kho của phiếu.
- `REVERSAL_INSUFFICIENT_STOCK`: không đủ tồn để đảo phiếu.

## Khi Sửa Module Này

- Không tăng tồn ngoài transaction.
- Không sửa/xóa `inventory_transactions` cũ.
- Nếu đổi status lifecycle, cập nhật confirm/reverse/detail và docs.
