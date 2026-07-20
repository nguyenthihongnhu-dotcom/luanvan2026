# Stock Counts Module

## Mục tiêu nghiệp vụ

Module `stock-counts` quản lý kiểm kê kho. Đây là flow lifecycle, không phải CRUD đơn giản.

## Đọc code theo thứ tự

1. `stock-counts.routes.ts`: các bước lifecycle và permission.
2. `stock-counts.validation.ts`: body/query cho create/count.
3. `stock-counts.controller.ts`: parse id, item id, user.
4. `stock-counts.service.ts`: rule trạng thái.
5. `stock-counts.repository.ts`: query item, update count, approve.

## Endpoint hiện có

| Method | Path | Mô tả | Permission |
| --- | --- | --- | --- |
| GET | `/stock-counts` | List phiếu kiểm kê | Không |
| GET | `/stock-counts/:id/items` | List dòng kiểm kê | Không |
| POST | `/stock-counts` | Tạo phiếu kiểm kê | `stock_counts:create` |
| POST | `/stock-counts/:id/start` | Bắt đầu kiểm kê | `stock_counts:start` |
| PATCH | `/stock-counts/:id/items/:itemId/count` | Ghi số lượng đếm | `stock_counts:count` |
| POST | `/stock-counts/:id/submit` | Gửi phiếu kiểm kê | `stock_counts:submit` |
| POST | `/stock-counts/:id/approve` | Duyệt kiểm kê | `stock_counts:approve` |

## Lifecycle

```text
DRAFT
  -> STARTED
  -> COUNTING/IN_PROGRESS
  -> SUBMITTED
  -> APPROVED
```

Tên trạng thái cụ thể xem trong model/repository hiện tại, nhưng ý nghĩa nghiệp vụ là như trên.

## Khi sửa module này

- Không cho ghi số đếm nếu phiếu chưa start hoặc đã submit/approve.
- Approve có thể sinh adjustment; cần giữ transaction và audit rõ.
- Nếu thêm filter kiểm kê theo warehouse/zone, kiểm tra quyền user với warehouse.