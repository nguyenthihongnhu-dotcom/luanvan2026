# Intern Code Reading Guide - Backend

File này viết cho intern cần đọc nhanh backend Bambi WMS và biết nên sửa code ở đâu. Đọc file này trước, sau đó mở README trong từng module quan trọng.

## 1. Đọc code theo thứ tự nào?

Đừng bắt đầu từ repository hoặc SQL ngay. Đọc theo đường đi của một request:

1. `src/app.ts`: xem module được mount ở base path nào.
2. `src/modules/<module>/<module>.routes.ts`: xem endpoint, method, middleware auth/permission.
3. `src/modules/<module>/<module>.controller.ts`: xem request lấy `params/query/body/user` như thế nào.
4. `src/modules/<module>/<module>.validation.ts`: xem input hợp lệ gồm field nào.
5. `src/modules/<module>/<module>.service.ts`: xem rule nghiệp vụ, lifecycle, error map.
6. `src/modules/<module>/<module>.repository.ts`: xem SQL, transaction, lock row, insert/update bảng nào.
7. `src/modules/<module>/<module>.model.ts`: xem type trả về và input nội bộ.
8. `backend/warehouse_management_mysql.sql`: đối chiếu schema/constraint.

Ví dụ endpoint xác nhận phiếu nhập:

```text
app.ts
  -> app.use('/goods-receipts', goodsReceiptsModule)
  -> goods-receipts.routes.ts POST /:id/confirm
  -> verifyToken + requirePermission('goods_receipts:confirm')
  -> confirmGoodsReceiptController
  -> parseReceiptId(req.params.id) + req.user.id
  -> confirmGoodsReceipt(input)
  -> confirmGoodsReceiptTransaction(input)
  -> MySQL transaction cập nhật phiếu/tồn/log
```

## 2. Quy tắc layer trong project

### Route

Route chỉ khai báo đường dẫn và middleware:

```ts
router.post(
  '/:id/confirm',
  asyncHandler(verifyToken),
  requirePermission('goods_receipts:confirm'),
  asyncHandler(confirmGoodsReceiptController),
);
```

Không viết SQL, không validate thủ công nhiều ở route.

### Controller

Controller là HTTP boundary:

- Đọc `req.params`, `req.query`, `req.body`, `req.user`.
- Gọi parser trong validation.
- Gọi service.
- Trả `{ data: result }`.

Không đặt business rule lớn ở controller. Nếu thấy controller bắt đầu có nhiều `if` nghiệp vụ, nên chuyển xuống service.

### Validation

Validation dùng Zod và helper `validateInput`:

```ts
export function parseCreateSupplierInput(input: unknown): SupplierInput {
  return validateInput(createSupplierSchema, input);
}
```

Mục tiêu: biến `unknown` từ client thành type nội bộ rõ ràng trước khi service xử lý.

### Service

Service là nơi giữ rule nghiệp vụ và map lỗi domain sang HTTP:

```ts
try {
  return await confirmGoodsIssueTransaction(input);
} catch (error) {
  if (error instanceof Error && confirmErrorMap[error.message]) {
    throw confirmErrorMap[error.message];
  }
  throw error;
}
```

Repository có thể throw domain error dạng `new Error('INSUFFICIENT_STOCK')`. Service đổi nó thành `HttpError(409, ..., 'INSUFFICIENT_STOCK')` để response nhất quán.

### Repository

Repository giữ SQL và transaction. Với nghiệp vụ tồn kho, repository phải đảm bảo:

- `beginTransaction()` trước khi đọc/sửa nhiều bảng.
- Lock dữ liệu cần sửa bằng `FOR UPDATE` hoặc atomic update.
- Kiểm tra đủ tồn trước khi trừ.
- Insert `inventory_transactions` cùng transaction.
- `commit()` khi xong, `rollback()` khi lỗi, `release()` connection trong `finally`.

Không trả Express response ở repository.

### Model

Model chứa type của input, row, result. Khi thêm endpoint, cập nhật model trước để service/controller không dùng `any`.

## 3. Những flow quan trọng nhất cần hiểu

### Auth và permission

Files cần đọc:

```text
src/modules/auth/auth.routes.ts
src/modules/auth/auth.controller.ts
src/modules/auth/auth.service.ts
src/modules/auth/auth.repository.ts
src/modules/auth/auth.middleware.ts
src/common/types/express.d.ts
src/common/middleware/require-permission.middleware.ts
```

Luồng chính:

```text
POST /auth/login
  -> kiểm tra email/password
  -> tạo access token JWT
  -> tạo refresh token opaque
  -> hash refresh token rồi lưu user_sessions
```

Endpoint cần bảo vệ dùng:

```ts
asyncHandler(verifyToken),
requirePermission('permission:code')
```

`verifyToken` gắn `req.user`; type cho `req.user` nằm trong `common/types/express.d.ts`.

### Hàng hóa và danh mục

Files cần đọc:

```text
src/modules/catalog/catalog.routes.ts
src/modules/catalog/catalog.validation.ts
src/modules/catalog/catalog.service.ts
src/modules/catalog/catalog.repository.ts
```

Frontend gọi module này cho:

- Danh mục sản phẩm.
- Danh sách sản phẩm.
- Thêm/sửa/xóa sản phẩm.

Điểm cần nhớ:

- `products` là thông tin sản phẩm.
- `product_variants` chứa SKU thực tế.
- Tồn không nằm trong `products`; tồn nằm trong `stock_locations` hoặc view/report.
- Delete là soft delete nếu dữ liệu có thể có lịch sử.

### Cấu trúc kho

Files cần đọc:

```text
src/modules/locations/locations.routes.ts
src/modules/locations/locations.validation.ts
src/modules/locations/locations.service.ts
src/modules/locations/locations.repository.ts
```

Mô hình:

```text
warehouses
  -> warehouse_zones
    -> warehouse_shelves
      -> warehouse_locations
```

Frontend màn kho gọi:

- `GET /locations`: vẽ sơ đồ kho.
- `POST /locations/zones`: thêm khu mới và sinh kệ/tầng mặc định.
- `POST /locations/shelves`: thêm kệ mới và sinh tầng mặc định.
- `DELETE /locations/shelf/:shelfId`: soft delete kệ.
- `DELETE /locations/layer`: soft delete tầng.

Điểm cần nhớ: không hard delete vị trí đã có tồn/giao dịch.

### Phiếu nhập kho

Files cần đọc:

```text
src/modules/goods-receipts/goods-receipts.routes.ts
src/modules/goods-receipts/goods-receipts.service.ts
src/modules/goods-receipts/goods-receipts.repository.ts
```

Luồng confirm:

```text
POST /goods-receipts/:id/confirm
  -> require goods_receipts:confirm
  -> kiểm tra phiếu tồn tại
  -> chỉ DRAFT/PENDING được confirm
  -> phải có items
  -> kiểm tra batch/expiry nếu SKU yêu cầu
  -> kiểm tra location thuộc đúng warehouse
  -> tăng stock_locations
  -> ghi inventory_transactions loại RECEIPT
  -> đổi trạng thái phiếu sang CONFIRMED
```

Reverse không xóa transaction cũ, mà tạo biến động ngược.

### Phiếu xuất kho

Files cần đọc:

```text
src/modules/goods-issues/goods-issues.routes.ts
src/modules/goods-issues/goods-issues.service.ts
src/modules/goods-issues/goods-issues.repository.ts
src/modules/stock/stock.repository.ts
```

Luồng confirm:

```text
POST /goods-issues/:id/confirm
  -> require goods_issues:confirm
  -> kiểm tra trạng thái phiếu
  -> phân bổ tồn theo FEFO/FIFO
  -> kiểm tra đủ tồn
  -> trừ stock_locations
  -> ghi inventory_transactions loại ISSUE
  -> đổi trạng thái phiếu sang CONFIRMED
```

Điểm cần nhớ: mọi flow giảm tồn phải chống tồn âm và concurrent update.

### Chuyển kho

Files cần đọc:

```text
src/modules/stock-transfers/stock-transfers.routes.ts
src/modules/stock-transfers/stock-transfers.service.ts
src/modules/stock-transfers/stock-transfers.repository.ts
```

Luồng confirm:

```text
POST /stock-transfers/:id/confirm
  -> require stock_transfers:confirm
  -> kiểm tra nguồn còn đủ tồn
  -> kiểm tra vị trí nguồn/đích thuộc warehouse đúng
  -> giảm tồn ở nguồn
  -> tăng tồn ở đích
  -> ghi inventory_transactions
```

Reverse phải kiểm tra đích còn đủ tồn để hoàn ngược.

### Kiểm kê và điều chỉnh

Files cần đọc:

```text
src/modules/stock-counts/*
src/modules/stock-adjustments/*
```

Kiểm kê là lifecycle:

```text
create -> start -> count items -> submit -> approve
```

Điều chỉnh là lifecycle:

```text
create -> approve/reject/cancel
```

Rule quan trọng:

- Approve adjustment mới cập nhật tồn.
- Người tạo không nên tự duyệt nếu service đang chặn `SELF_APPROVAL_NOT_ALLOWED`.
- OUT adjustment phải kiểm tra đủ tồn.
- Reject/cancel không đổi tồn.

## 4. Cách thêm một endpoint mới đúng chuẩn

Ví dụ thêm `GET /suppliers/:id`:

1. `suppliers.model.ts`: thêm type result nếu cần.
2. `suppliers.validation.ts`: thêm parser cho `id` hoặc dùng parser có sẵn.
3. `suppliers.repository.ts`: thêm query `findSupplierById(id)`.
4. `suppliers.service.ts`: thêm `getSupplier(id)`; nếu không thấy thì throw `HttpError(404, ...)`.
5. `suppliers.controller.ts`: parse param, gọi service, trả `{ data }`.
6. `suppliers.routes.ts`: thêm `router.get('/:id', asyncHandler(getSupplierController))`.
7. `src/modules/openapi/openapi.controller.ts`: cập nhật docs endpoint.
8. `src/modules/suppliers/README.md`: cập nhật docs module.
9. Chạy kiểm tra.

Không thêm SQL vào controller. Không dùng `any` để né type.

## 5. Cách đọc lỗi thường gặp

### Lỗi validation

Tìm parser trong `<module>.validation.ts`. Nếu input frontend gửi sai tên field, sửa service frontend hoặc schema backend tùy contract đúng là gì.

### Lỗi 401/403

- 401: token thiếu/sai/hết hạn, kiểm tra `verifyToken`.
- 403: user có token nhưng thiếu permission, kiểm tra `requirePermission` và seed `role_permissions`.

### Lỗi 409 khi confirm phiếu

Thường là trạng thái không hợp lệ, tồn không đủ hoặc concurrent update. Đọc `confirmErrorMap` trong service để biết domain error nào được map ra HTTP.

### Lỗi MySQL connection

Kiểm tra `.env`, MySQL service, database name, và đã import schema/sample data chưa.

## 6. Checklist trước khi báo xong

Backend:

```bash
npm run lint
npm run build
npm test
npm run test:e2e
npm run test:integration
```

Nếu thay frontend gọi API:

```bash
cd ../frontend
npx tsc -b
npm run build
```

Nếu sửa DB:

- Cập nhật `warehouse_management_mysql.sql`.
- Cập nhật `warehouse_sample_data.sql` nếu demo/test cần data.
- Cập nhật `warehouse_database_design.md`.
- Chạy integration test với MySQL thật.

Nếu sửa endpoint:

- Cập nhật README module.
- Cập nhật `backend/docs/overview.md` nếu là endpoint/module quan trọng.
- Cập nhật OpenAPI nếu endpoint public/frontend dùng.