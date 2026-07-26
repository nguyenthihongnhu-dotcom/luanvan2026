# Goods Issues Module

## Mục Tiêu Nghiệp Vụ

Module `goods-issues` xử lý xuất kho. Đây là flow rủi ro cao vì làm giảm tồn và phải chống tồn âm.

## Đọc Code Theo Thứ Tự

1. `goods-issues.routes.ts`: list/detail/create/confirm/reverse và permission.
2. `goods-issues.validation.ts`: input id/create/confirm.
3. `goods-issues.controller.ts`: HTTP boundary.
4. `goods-issues.service.ts`: error map cho confirm/reverse/detail.
5. `goods-issues.repository.ts`: detail query và transaction giảm tồn.
6. `stock` module: allocation preview và logic chọn tồn FEFO/FIFO.

## Endpoints

| Method | Path | Mô tả | Permission |
| --- | --- | --- | --- |
| GET | `/goods-issues` | List phiếu xuất | Không |
| GET | `/goods-issues/:id` | Detail header + items | Không |
| POST | `/goods-issues` | Tạo phiếu xuất kèm items | Không trong demo |
| POST | `/goods-issues/:id/confirm` | Xác nhận và giảm tồn | `goods_issues:confirm` |
| POST | `/goods-issues/:id/reverse` | Đảo phiếu xuất | `goods_issues:reverse` |

## Luồng Confirm

```text
confirmGoodsIssue(input)
  -> confirmGoodsIssueTransaction(input)
      -> beginTransaction
      -> lock goods issue
      -> validate status DRAFT/PENDING
      -> lấy items
      -> phân bổ stock theo FEFO/FIFO
      -> kiểm tra đủ tồn available
      -> giảm quantity/available_quantity trong stock_locations
      -> ghi inventory_transactions type ISSUE
      -> update issue status CONFIRMED
      -> commit
```

## Domain Error Quan Trọng

- `INSUFFICIENT_STOCK`: không đủ tồn để xuất.
- `CONCURRENT_STOCK_UPDATE`: tồn bị thay đổi trong lúc confirm.
- `BATCH_REQUIRED`/`EXPIRY_DATE_REQUIRED`: thiếu dữ liệu lô/hạn cho tracking.
- `GOODS_ISSUE_NOT_CONFIRMABLE`: trạng thái không hợp lệ.

## Khi Sửa Module Này

- Không trừ tồn bằng update không kiểm tra điều kiện.
- Điều kiện trừ tồn phải đảm bảo `quantity - reserved_quantity >= requested`.
- Reverse phải tạo biến động đối ứng và không sửa log cũ.
