# Backend Documentation - Bambi WMS

Backend là API server cho hệ thống quản lý kho. Code dùng Express + TypeScript, kết nối MySQL bằng `mysql2/promise`.

Tài liệu này dành cho người mới đọc code. Nếu bạn là intern, hãy đọc theo thứ tự từ trên xuống trước khi sửa module.

## 1. Backend Làm Gì?

Backend chịu trách nhiệm:

- Nhận request HTTP từ frontend.
- Xác thực user bằng JWT.
- Kiểm tra quyền thao tác.
- Validate dữ liệu request bằng Zod.
- Đọc/ghi dữ liệu MySQL.
- Thực hiện nghiệp vụ kho như nhập hàng, xuất hàng, chuyển kho, điều chỉnh tồn.
- Ghi audit log cho các thao tác quan trọng.
- Cung cấp Socket.IO foundation cho notification realtime.

## 2. Công Nghệ Chính

- Express: HTTP server.
- TypeScript: type safety.
- MySQL 8+: database.
- mysql2/promise: query database.
- Zod: validate request body/query/params.
- jsonwebtoken: verify JWT.
- Socket.IO: realtime layer.
- Jest + Supertest: test.
- ESLint + Prettier: code quality.

## 3. Cách Chạy Backend

Cài dependency:

```bash
cd backend
npm install
```

Tạo file env:

```bash
cp .env.example .env
```

Ví dụ `.env`:

```env
PORT=3000
CORS_ORIGIN=*
DATABASE_URL=mysql://root:password@localhost:3306/warehouse_management
DB_CONNECTION_LIMIT=10
JWT_SECRET=change_this_to_a_long_random_secret
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_DAYS=30
PASSWORD_RESET_TTL_MINUTES=15
```

Chạy dev server:

```bash
npm run start:dev
```

API root:

```text
GET http://localhost:3000/
```

Health check:

```text
GET http://localhost:3000/health
```

## 4. Database

Backend expect MySQL schema từ file:

```text
warehouse_management_mysql.sql
```

Thiết kế database mô tả thêm ở:

```text
warehouse_database_design.md
```

Khi làm việc với database:

- Không tự ý đổi schema nếu chưa kiểm tra module đang phụ thuộc field đó.
- Các thao tác tồn kho phải dùng transaction DB.
- Những bảng lịch sử như `inventory_transactions` và `audit_logs` nên xem như append-only.
- Không hard delete dữ liệu đã có lịch sử giao dịch nếu business chưa cho phép.

## 5. Cấu Trúc Source

```text
src/
  main.ts                 # Tạo HTTP server, gắn Socket.IO, listen port
  app.ts                  # Tạo Express app, mount modules, middleware chung

  config/
    config.ts             # Đọc env và validate config cơ bản

  database/
    db.ts                 # MySQL connection pool

  common/
    http.ts               # Error handler, not found handler, HTTP helpers
    validation/validate.ts# Zod validation middleware/helper
    middleware/           # Middleware dùng chung
    audit/                # Audit repository dùng chung
    code/                 # Sinh mã chứng từ/giao dịch
    types/                # Type mở rộng Express

  modules/
    auth/
    authorization/
    warehouses/
    locations/
    catalog/
    suppliers/
    batches/
    stock/
    goods-receipts/
    goods-issues/
    stock-transfers/
    stock-counts/
    stock-adjustments/
    alerts/
    notifications/
    reports/
    settings/
    ...

  socket/
    socket.ts             # Socket.IO setup
```

## 6. Module Pattern

Mỗi module thường có các file sau:

```text
<module>.module.ts       # Export router chính của module
<module>.routes.ts       # Khai báo endpoint và middleware
<module>.controller.ts   # Nhận request, gọi service, trả response
<module>.service.ts      # Business logic
<module>.repository.ts   # Query database
<module>.validation.ts   # Zod schemas
<module>.model.ts        # TypeScript types/model interfaces
```

Ví dụ module `goods-receipts`:

```text
modules/goods-receipts/
  goods-receipts.module.ts
  goods-receipts.routes.ts
  goods-receipts.controller.ts
  goods-receipts.service.ts
  goods-receipts.repository.ts
  goods-receipts.validation.ts
  goods-receipts.model.ts
```

## 7. Luồng Request Đi Qua Backend

Một request thường đi như sau:

```text
HTTP request
  -> app.ts mounted route
  -> routes.ts
  -> auth/permission middleware nếu endpoint cần bảo vệ
  -> validation.ts validate input
  -> controller.ts
  -> service.ts
  -> repository.ts
  -> MySQL
  -> response JSON
```

Ý nghĩa từng layer:

- Route: endpoint nào, method nào, middleware nào.
- Controller: chuyển HTTP request thành service call.
- Service: xử lý nghiệp vụ, kiểm tra rule, quyết định flow.
- Repository: chỉ lo SQL/query/transaction.
- Model: định nghĩa shape dữ liệu.
- Validation: chặn input sai trước khi vào business logic.

Không nên để SQL trong controller. Không nên để business rule trong repository nếu rule đó không phải constraint/query.

## 8. Auth Và Permission

Auth nằm ở module:

```text
src/modules/auth
```

Authorization/role/permission nằm ở:

```text
src/modules/authorization
```

Các endpoint quan trọng có thể dùng middleware:

```ts
requirePermission('goods_receipts:confirm')
```

Backend có login, refresh token rotation, logout/revoke session, password reset flow, JWT verification và active-user check.

## 9. Validation

Validation dùng Zod.

File validation nằm trong mỗi module:

```text
<module>.validation.ts
```

Nguyên tắc:

- Validate `params`, `query`, `body` trước khi vào controller/service.
- Không tin dữ liệu từ client.
- Nếu thêm endpoint mới, phải thêm schema validation tương ứng.

## 10. Database Transaction Và Tồn Kho

Các flow ảnh hưởng tồn kho phải rất cẩn thận:

- Nhập kho: tăng tồn.
- Xuất kho: giảm tồn.
- Chuyển kho: giảm nguồn, tăng đích.
- Điều chỉnh kho: tăng/giảm theo phiếu điều chỉnh.

Rule quan trọng:

1. Lock row cần sửa bằng transaction/`FOR UPDATE` khi cần.
2. Không để tồn kho âm.
3. Ghi `inventory_transactions` cùng transaction với thay đổi tồn.
4. Ghi audit log cùng transaction nếu flow quan trọng.
5. Nếu lỗi ở giữa, rollback toàn bộ.

## 11. Các Flow Nghiệp Vụ Đã Có

### Confirm Goods Receipt

Endpoint:

```http
POST /goods-receipts/:id/confirm
```

Mục tiêu: xác nhận phiếu nhập, tăng tồn kho, ghi transaction `RECEIPT`.

### Confirm Goods Issue

Endpoint:

```http
POST /goods-issues/:id/confirm
```

Mục tiêu: xác nhận phiếu xuất, chọn stock theo FEFO/FIFO, giảm tồn kho, ghi transaction `ISSUE`.

### Confirm Stock Transfer

Endpoint:

```http
POST /stock-transfers/:id/confirm
```

Mục tiêu: chuyển tồn từ vị trí/kho nguồn sang vị trí/kho đích.

### Approve Stock Adjustment

Endpoint:

```http
POST /stock-adjustments/:id/approve
```

Mục tiêu: duyệt phiếu điều chỉnh và cập nhật tồn kho.

### Allocation Preview

Endpoint:

```http
GET /stock/allocation?warehouseId=1&productVariantId=10&quantity=5&strategy=FEFO
```

Mục tiêu: xem trước hệ thống sẽ lấy batch/vị trí nào khi xuất hàng, không thay đổi dữ liệu.

## 12. Cách Thêm Endpoint Mới

Ví dụ muốn thêm endpoint `GET /suppliers/:id`:

1. Mở module `src/modules/suppliers`.
2. Thêm schema params trong `suppliers.validation.ts`.
3. Thêm method query trong `suppliers.repository.ts`.
4. Thêm business method trong `suppliers.service.ts`.
5. Thêm handler trong `suppliers.controller.ts`.
6. Gắn route trong `suppliers.routes.ts`.
7. Nếu endpoint cần auth, thêm middleware auth/permission.
8. Chạy lint/build/test.

Không tạo endpoint trực tiếp trong `app.ts`, trừ khi đó là endpoint global như `/health` hoặc `/`.

## 13. Scripts Quan Trọng

```bash
npm run start:dev     # Chạy dev server
npm run build         # Compile TypeScript ra dist
npm run lint          # Kiểm tra lint
npm run lint:fix      # Auto fix lint nếu an toàn
npm run test          # Unit tests
npm run test:e2e      # E2E tests
```

## 14. Quy Ước Code Backend

- Controller không chứa SQL.
- Repository không trả Express response.
- Service không phụ thuộc `req`/`res`.
- Validation phải nằm trước service.
- Error nên đi qua error handler chung.
- Không swallow error bằng `catch` rỗng.
- Không dùng `any` nếu có thể định nghĩa type.
- Không hardcode secret/config. Dùng `.env` và `config.ts`.

## 15. Lỗi Thường Gặp

### Missing required environment variable

Bạn chưa tạo `.env` hoặc thiếu key bắt buộc.

Cách sửa:

```bash
cp .env.example .env
```

Sau đó cập nhật giá trị trong `.env`.

### Cannot connect MySQL

Kiểm tra:

- MySQL đang chạy chưa.
- Database name trong `DATABASE_URL` đúng chưa.
- User/password đúng chưa.
- Đã import `warehouse_management_mysql.sql` chưa.

### 401 Unauthorized

Endpoint cần token JWT. Gửi header:

```http
Authorization: Bearer <token>
```

### 403 Forbidden

User có token nhưng thiếu permission cần thiết.

## 16. Trạng Thái Backend

Backend core đã hoàn thiện cho phạm vi đồ án và demo với MySQL thật:

- Auth thật: login, refresh token rotation, logout, session, password reset.
- Role/permission và middleware kiểm quyền.
- Cấu trúc kho: warehouse, zone, shelf, location.
- Danh mục hàng hóa: category, brand, unit, product, variant.
- Supplier, batch, stock location và immutable inventory transaction log.
- Nhập kho, xuất kho, chuyển kho, kiểm kê, điều chỉnh tồn.
- Confirm/reverse/reject/cancel theo từng nghiệp vụ phù hợp.
- Alert, notification, report, audit log, settings, attachment metadata.
- OpenAPI JSON và Swagger UI tại `/openapi.json` và `/docs`.
- Unit, e2e và integration test nền tảng.

Giới hạn còn lại nằm ở mức production hardening, không phải thiếu core nghiệp vụ:

- OpenAPI mới mô tả endpoint chính và response wrapper, chưa chi tiết toàn bộ DTO field.
- Test coverage mới khóa các luồng nền tảng; chưa bao phủ toàn bộ edge case nghiệp vụ tồn kho.
- Socket.IO mới là nền realtime foundation, chưa đẩy notification realtime end-to-end cho mọi event.

## 17. Checklist Cho Intern Khi Sửa Backend

Trước khi báo xong:

- Đã sửa đúng module chưa?
- Có validation cho input mới chưa?
- Có test hoặc ít nhất đã chạy build/lint chưa?
- Có làm ảnh hưởng tồn kho không? Nếu có, đã dùng transaction chưa?
- Có cần permission không?
- Có cần audit log không?
- Có cập nhật docs nếu thay đổi flow lớn không?
