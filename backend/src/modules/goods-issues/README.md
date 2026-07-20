# Goods Issues Module

## Mục tiêu nghiệp vụ

Module `goods-issues` xử lý xuất kho. Đây là flow rủi ro cao vì làm giảm tồn và phải chống tồn âm.

## Đọc code theo thứ tự

1. `goods-issues.routes.ts`: endpoint và permission.
2. `goods-issues.validation.ts`: input id/create.
3. `goods-issues.controller.ts`: HTTP boundary.
4. `goods-issues.service.ts`: error map cho confirm/reverse.
5. `goods-issues.repository.ts`: transaction giảm tồn.
6. `stock` module: allocation preview và logic chọn tồn FEFO/FIFO.

## Endpoint hiện có

| Method | Path | Mô tả | Permission |
| --- | --- | --- | --- |
| GET | `/goods-issues` | List phiếu xuất | Không |
| POST | `/goods-issues` | Tạo header phiếu xuất | Không trong demo |
| POST | `/goods-issues/:id/confirm` | Xác nhận và giảm tồn | `goods_issues:confirm` |
| POST | `/goods-issues/:id/reverse` | Đảo phiếu xuất | `goods_issues:reverse` |

## Luồng confirm chi tiết

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

## Domain error quan trọng

- `INSUFFICIENT_STOCK`: không đủ tồn để xuất.
- `CONCURRENT_STOCK_UPDATE`: tồn bị thay đổi trong lúc confirm.
- `BATCH_REQUIRED`/`EXPIRY_DATE_REQUIRED`: thiếu dữ liệu lô/hạn cho tracking.
- `GOODS_ISSUE_NOT_CONFIRMABLE`: trạng thái không hợp lệ.

## Khi sửa module này

- Không bao giờ trừ tồn bằng update không kiểm tra điều kiện.
- Nếu dùng atomic update, điều kiện phải đảm bảo `quantity - reserved_quantity >= requested`.
- Reverse phải tạo biến động đối ứng và không làm sai log cũ.
- Test edge case thiếu tồn trước khi báo xong.