# Transfers Feature

## Mục tiêu

Feature `transfers` là màn chuyển kho thật, nối với backend `stock-transfers`, `stock/current` và `locations`.

## Route

```text
/transfers
```

## Luồng chính

```text
TransfersPage
  -> transferService.listTransfers()
  -> transferService.listCurrentStock()
  -> transferService.listLocationOptions()
  -> tạo phiếu bằng POST /stock-transfers
  -> xác nhận bằng POST /stock-transfers/:id/confirm
  -> đảo phiếu bằng POST /stock-transfers/:id/reverse
```

## Nguyên tắc dữ liệu

- Không dùng mock/local fallback.
- Nguồn chuyển lấy từ tồn khả dụng `GET /stock/current`.
- Vị trí đích lấy từ `GET /locations` và không cho chọn trùng vị trí nguồn.
- Sau create/confirm/reverse phải reload từ backend để tránh lệch tồn kho.

## Giới hạn hiện tại

- Form tạo một dòng hàng mỗi phiếu để giữ flow rõ và ổn định.
- Backend đã có confirm/reverse; create được bổ sung để frontend tạo phiếu thật.