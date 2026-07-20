# Goods Receipts Module

## Mục tiêu nghiệp vụ

Module `goods-receipts` xử lý nhập kho. Phiếu nhập là chứng từ; tồn chỉ tăng khi phiếu được confirm.

## Đọc code theo thứ tự

1. `goods-receipts.routes.ts`: endpoint list/create/confirm/reverse và permission.
2. `goods-receipts.validation.ts`: parse id/body.
3. `goods-receipts.controller.ts`: lấy `req.user.id` cho confirm/reverse.
4. `goods-receipts.service.ts`: map domain error sang `HttpError`.
5. `goods-receipts.repository.ts`: transaction confirm/reverse.
6. `goods-receipts.model.ts`: type input/result/row.

## Endpoint hiện có

| Method | Path | Mô tả | Permission |
| --- | --- | --- | --- |
| GET | `/goods-receipts` | List phiếu nhập | Không |
| POST | `/goods-receipts` | Tạo header phiếu nhập | Không trong demo |
| POST | `/goods-receipts/:id/confirm` | Xác nhận và tăng tồn | `goods_receipts:confirm` |
| POST | `/goods-receipts/:id/reverse` | Đảo phiếu nhập | `goods_receipts:reverse` |

## Luồng confirm chi tiết

```text
confirmGoodsReceipt(input)
  -> confirmGoodsReceiptTransaction(input)
      -> beginTransaction
      -> SELECT goods_receipts FOR UPDATE
      -> validate status DRAFT/PENDING
      -> SELECT items
      -> nếu không có item: GOODS_RECEIPT_HAS_NO_ITEMS
      -> với từng item:
          -> kiểm tra batch/expiry nếu SKU yêu cầu
          -> kiểm tra location thuộc warehouse phiếu
          -> upsert/tăng stock_locations
          -> insert inventory_transactions type RECEIPT
      -> update goods_receipts status CONFIRMED
      -> commit
  -> nếu repository throw domain Error:
      -> service đổi sang HttpError tương ứng
```

## Domain error quan trọng

- `GOODS_RECEIPT_NOT_FOUND`: phiếu không tồn tại.
- `GOODS_RECEIPT_NOT_CONFIRMABLE`: trạng thái không cho confirm.
- `GOODS_RECEIPT_HAS_NO_ITEMS`: phiếu chưa có dòng.
- `BATCH_REQUIRED`: SKU tracking lô nhưng thiếu batch.
- `EXPIRY_DATE_REQUIRED`: SKU tracking hạn nhưng thiếu expiry.
- `LOCATION_WAREHOUSE_MISMATCH`: vị trí không thuộc kho của phiếu.
- `REVERSAL_INSUFFICIENT_STOCK`: không đủ tồn để đảo phiếu.

## Khi sửa module này

- Không tăng tồn ngoài transaction.
- Không sửa/xóa `inventory_transactions` cũ.
- Nếu thêm item API, phải validate batch/location/product_variant rất chặt.
- Nếu đổi status lifecycle, cập nhật cả confirm/reverse và docs.