# Stock Adjustments Module

## Mục tiêu nghiệp vụ

Module `stock-adjustments` điều chỉnh tồn thủ công hoặc từ kiểm kê. Tồn chỉ đổi khi phiếu được approve.

## Đọc code theo thứ tự

1. `stock-adjustments.routes.ts`: approve/reject/cancel permission.
2. `stock-adjustments.validation.ts`: input create/id/action.
3. `stock-adjustments.controller.ts`: lấy user thao tác.
4. `stock-adjustments.service.ts`: rule và error map.
5. `stock-adjustments.repository.ts`: transaction approve/reject/cancel.

## Endpoint hiện có

| Method | Path | Mô tả | Permission |
| --- | --- | --- | --- |
| GET | `/stock-adjustments` | List phiếu điều chỉnh | Không |
| POST | `/stock-adjustments` | Tạo header điều chỉnh | Không trong demo |
| POST | `/stock-adjustments/:id/approve` | Duyệt và cập nhật tồn | `stock_adjustments:approve` |
| POST | `/stock-adjustments/:id/reject` | Từ chối phiếu | `stock_adjustments:reject` |
| POST | `/stock-adjustments/:id/cancel` | Hủy phiếu | `stock_adjustments:cancel` |

## Luồng approve

```text
approveStockAdjustment(input)
  -> approveStockAdjustmentTransaction(input)
      -> beginTransaction
      -> lock adjustment
      -> chỉ PENDING được approve
      -> chặn tự duyệt nếu creator == approver
      -> lấy items
      -> với IN: tăng/upsert stock_locations
      -> với OUT: kiểm tra tồn rồi giảm
      -> ghi inventory_transactions type ADJUSTMENT
      -> update status APPROVED
      -> commit
```

## Domain error quan trọng

- `SELF_APPROVAL_NOT_ALLOWED`: người tạo không được tự duyệt.
- `STOCK_ADJUSTMENT_NOT_APPROVABLE`: sai trạng thái.
- `INSUFFICIENT_STOCK`: OUT adjustment thiếu tồn.
- `CONCURRENT_STOCK_UPDATE`: có tranh chấp tồn.

## Khi sửa module này

- Reject/cancel không được thay đổi tồn.
- Approve phải ghi log tồn cùng transaction.
- Nếu adjustment sinh từ stock-count, giữ reference để truy vết.