# Batches Feature

## Mục đích

Feature `batches` hiển thị và lọc danh sách lô hàng từ backend. Đây là màn hỗ trợ vận hành quan trọng cho WMS mẹ & bé vì nhiều mặt hàng cần theo dõi hạn sử dụng.

## Route

```http
/batches
```

## API sử dụng

- `GET /batches`
- `GET /batches?search=<lot_number>`
- `GET /batches?status=ACTIVE|NEAR_EXPIRY|EXPIRED|BLOCKED|DEPLETED`

## File quan trọng

- `services/batchService.ts`: type response và hàm gọi API `/batches`.
- `pages/BatchesPage.tsx`: filter theo số lô/trạng thái, render badge trạng thái và số ngày còn hạn.

## Lưu ý

Backend hiện chỉ có API list/filter cho lô hàng. UI này không tạo/sửa/xóa lô vì backend chưa có endpoint mutation tương ứng. Lô mới hiện được sinh qua nhập hàng hoặc seed database.