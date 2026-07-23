# Stock Counts Feature

## Mục tiêu

Feature `stock-counts` triển khai lifecycle kiểm kê kho dựa trên backend `stock-counts`.

## Route

```text
/stock-counts
```

## Luồng chính

```text
StockCountsPage
  -> GET /stock-counts
  -> POST /stock-counts
  -> POST /stock-counts/:id/start
  -> GET /stock-counts/:id/items
  -> PATCH /stock-counts/:id/items/:itemId/count
  -> POST /stock-counts/:id/submit
  -> POST /stock-counts/:id/approve
```

## Ghi chú

- Mặc định form tạo phiếu dùng kho id `1` để chạy được với dữ liệu mẫu.
- Khi duyệt, backend tự tạo adjustment nếu có chênh lệch.
- Không mock dữ liệu; lỗi backend hiển thị trên page.