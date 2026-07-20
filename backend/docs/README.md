# Backend Docs - Bambi WMS

Đây là điểm vào tài liệu backend. Mục tiêu của docs là giúp intern hiểu dự án nhanh theo đúng thứ tự phụ thuộc module, không chỉ liệt kê endpoint.

## Thứ tự đọc để hiểu dự án nhanh

Đọc theo 6 tầng dưới đây. Không nên nhảy thẳng vào phiếu nhập/xuất nếu chưa hiểu auth, catalog, locations và stock.

### Tầng 1 - Nền tảng hệ thống

Đọc trước để hiểu request chạy qua backend như thế nào.

1. [Intern Code Reading Guide](intern-code-guide.md)
2. [Overview](overview.md)
3. [Health](../src/modules/health/README.md)
4. [OpenAPI](../src/modules/openapi/README.md)
5. `src/app.ts`, `src/common/http.ts`, `src/common/validation/validate.ts`

Cần hiểu:

- `app.ts` mount module theo base path.
- `asyncHandler` gom lỗi async về error handler.
- Response thành công là `{ data }`, lỗi là `{ error }`.
- Validation dùng Zod trước khi vào service.

### Tầng 2 - Auth và phân quyền

Đọc trước các module nghiệp vụ có confirm/approve.

1. [Auth](../src/modules/auth/README.md)
2. [Authorization](../src/modules/authorization/README.md)
3. `common/types/express.d.ts`
4. `common/middleware/require-permission.middleware.ts`

Cần hiểu:

- Login sinh access token và refresh session.
- `verifyToken` gắn `req.user`.
- `requirePermission` kiểm tra permission code.
- Các endpoint nhạy cảm không tự tin tưởng user từ frontend.

### Tầng 3 - Master data bắt buộc

Đây là dữ liệu nền để các nghiệp vụ kho hoạt động.

1. [Warehouses](../src/modules/warehouses/README.md)
2. [Locations](../src/modules/locations/README.md)
3. [Catalog](../src/modules/catalog/README.md)
4. [Suppliers](../src/modules/suppliers/README.md)
5. [Batches](../src/modules/batches/README.md)

Cần hiểu:

- Kho có cấu trúc `warehouse -> zone -> shelf -> location`.
- Sản phẩm có `product -> product_variant/SKU`.
- Tồn không nằm trong product, mà nằm ở `stock_locations`.
- Supplier liên kết với phiếu nhập.
- Batch/lô dùng cho hạn sử dụng và FEFO.

### Tầng 4 - Stock core

Đọc trước khi sửa nhập/xuất/chuyển/điều chỉnh.

1. [Stock](../src/modules/stock/README.md)
2. [Inventory Transactions](../src/modules/inventory-transactions/README.md)
3. [Database Design](../warehouse_database_design.md)

Cần hiểu:

- `stock_locations` là nguồn sự thật của tồn hiện tại.
- `inventory_transactions` là log append-only của mọi biến động tồn.
- Allocation preview không mutate database.
- Mọi flow giảm/tăng tồn thật phải chạy trong transaction.

### Tầng 5 - Chứng từ làm thay đổi tồn

Đây là phần nghiệp vụ quan trọng nhất.

1. [Goods Receipts](../src/modules/goods-receipts/README.md): nhập kho, tăng tồn.
2. [Goods Issues](../src/modules/goods-issues/README.md): xuất kho, giảm tồn.
3. [Stock Transfers](../src/modules/stock-transfers/README.md): chuyển tồn nguồn-đích.
4. [Stock Counts](../src/modules/stock-counts/README.md): kiểm kê.
5. [Stock Adjustments](../src/modules/stock-adjustments/README.md): điều chỉnh tồn.

Cần hiểu:

- Phiếu thường có lifecycle, không phải CRUD đơn giản.
- Tồn chỉ thay đổi khi confirm/approve.
- Reverse tạo biến động đối ứng, không xóa log cũ.
- Không được để tồn âm.
- Phải lock/update trong cùng transaction.

### Tầng 6 - Vận hành và báo cáo

Đọc sau khi đã hiểu stock core.

1. [Reports](../src/modules/reports/README.md)
2. [Alerts](../src/modules/alerts/README.md)
3. [Notifications](../src/modules/notifications/README.md)
4. [Audit Logs](../src/modules/audit-logs/README.md)
5. [Attachments](../src/modules/attachments/README.md)
6. [Settings](../src/modules/settings/README.md)

Cần hiểu:

- Reports là readonly, không mutate nghiệp vụ.
- Alerts/notifications dùng dữ liệu tồn để cảnh báo vận hành.
- Audit logs dùng để truy vết thao tác quan trọng.
- Attachments hiện quản lý metadata.

## Thứ tự module để dự án chạy trơn tru

Khi setup hoặc debug dữ liệu, kiểm tra theo thứ tự này:

```text
1. MySQL schema
2. Auth + roles + permissions
3. Warehouses
4. Locations
5. Catalog + product variants
6. Suppliers
7. Batches
8. Stock locations
9. Goods receipts/issues/transfers/counts/adjustments
10. Inventory transactions
11. Reports
12. Alerts + notifications
13. Audit logs + attachments + settings
```

Nếu thiếu một tầng trước, tầng sau dễ lỗi hoặc không có data để hiển thị. Ví dụ:

- Không có `warehouses/locations` thì không thể đặt tồn vào vị trí.
- Không có `product_variants` thì không thể có `stock_locations` đúng SKU.
- Không có `stock_locations` thì xuất kho/chuyển kho sẽ lỗi thiếu tồn.
- Không có permissions thì confirm/approve sẽ 403.
- Không có sample data thì integration test và frontend dashboard ít dữ liệu.

## Quy ước cập nhật docs

- Thay đổi endpoint trong module nào thì cập nhật `backend/src/modules/<module>/README.md`.
- Thay đổi thứ tự phụ thuộc, cách chạy, quyền hoặc module index thì cập nhật `backend/docs/overview.md` và file này.
- Thay đổi flow quan trọng hoặc cách đọc code thì cập nhật `backend/docs/intern-code-guide.md`.
- Thay đổi schema hoặc rule database thì cập nhật `backend/warehouse_database_design.md`.