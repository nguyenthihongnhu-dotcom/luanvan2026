# Backend Overview - Bambi WMS

Backend Bambi WMS dùng Express + TypeScript + MySQL, chia theo module nghiệp vụ trong `src/modules`. File này là docs tổng: kiến trúc, thứ tự phụ thuộc module, module index, quyền và checklist kiểm tra.

## 1. Kiến trúc lớp

```text
HTTP request
  -> app.ts
  -> <module>.routes.ts
  -> middleware auth/permission nếu cần
  -> <module>.controller.ts
  -> <module>.validation.ts
  -> <module>.service.ts
  -> <module>.repository.ts
  -> MySQL
  -> JSON response
```

Quy ước chính:

- Controller chỉ chuyển request thành service call và trả JSON.
- Validation dùng Zod, đặt trước business logic.
- Service giữ rule nghiệp vụ, trạng thái phiếu, quyền xử lý và orchestration.
- Repository giữ SQL/query/transaction, không biết Express `req/res`.
- Các nghiệp vụ thay đổi tồn kho phải chạy trong database transaction và ghi `inventory_transactions`.
- `inventory_transactions` và `audit_logs` là append-only.

## 2. Thứ tự hiểu module

Intern nên đọc module theo đúng dependency, vì nghiệp vụ kho phụ thuộc dữ liệu nền.

```text
Foundation
  health, openapi, common/http, validation, config, database

Identity
  auth -> authorization -> require-permission -> rate-limit

Master Data
  warehouses -> locations
  catalog -> batches
  suppliers

Stock Core
  stock_locations
  stock module
  inventory-transactions

Inventory Documents
  goods-receipts
  goods-issues
  stock-transfers
  stock-counts
  stock-adjustments

Operations
  reports
  alerts
  notifications
  audit-logs
  attachments
  settings
```

### Vì sao phải đọc theo thứ tự này?

- `auth` và `authorization` quyết định endpoint nào được confirm/approve.
- `warehouses` và `locations` tạo nơi chứa hàng.
- `catalog` và `batches` tạo SKU/lô để nhập/xuất.
- `stock_locations` là tồn hiện tại, được đọc bởi stock/report và được mutate bởi chứng từ.
- `inventory_transactions` là lịch sử biến động, được ghi bởi các flow confirm/approve/reverse.
- Reports/alerts/notifications chỉ có ý nghĩa khi stock core đã đúng.

## 3. Thứ tự dữ liệu để dự án hoạt động trơn tru

Khi import DB hoặc debug màn hình trống, kiểm tra theo pipeline này:

| Thứ tự | Cần có | Vì sao quan trọng |
| --- | --- | --- |
| 1 | Schema MySQL | Tất cả module phụ thuộc table/constraint |
| 2 | Roles, permissions, users | Login và confirm/approve cần user/quyền |
| 3 | Warehouses | Root của cấu trúc kho |
| 4 | Zones, shelves, locations | Nơi đặt tồn |
| 5 | Categories, brands, units | Nền cho sản phẩm |
| 6 | Products, product variants | SKU nghiệp vụ |
| 7 | Suppliers | Phiếu nhập cần nhà cung cấp |
| 8 | Product batches | Lô/hạn dùng cho FEFO và expiry tracking |
| 9 | Stock locations | Nguồn sự thật của tồn hiện tại |
| 10 | Goods receipts/issues/transfers/counts/adjustments | Chứng từ nghiệp vụ |
| 11 | Inventory transactions | Lịch sử biến động tồn |
| 12 | Reports/views | Dữ liệu tổng hợp cho frontend |
| 13 | Alerts/notifications/audit/settings/attachments | Vận hành và truy vết |

Triệu chứng thường gặp khi thiếu tầng trước:

- Login lỗi: thiếu user/role/permission hoặc password hash sai.
- Màn kho trống: thiếu warehouse/zone/shelf/location.
- Màn hàng hóa trống: thiếu product/product_variant hoặc report query không có stock.
- Xuất kho lỗi thiếu tồn: thiếu `stock_locations` hoặc available quantity không đủ.
- Confirm/approve 403: role chưa được gán permission.
- Integration test lỗi sample data: chưa import `warehouse_sample_data.sql`.

## 4. Response format

Endpoint thành công trả wrapper:

```json
{
  "data": {}
}
```

Lỗi đi qua error handler chung:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Mô tả lỗi",
    "requestId": "..."
  }
}
```

## 5. Module index

| Module | Base path | Vai trò | Docs |
| --- | --- | --- | --- |
| Health | `/health` | Kiểm tra service/database | [README](../src/modules/health/README.md) |
| OpenAPI | `/openapi.json`, `/docs` | Tài liệu API runtime | [README](../src/modules/openapi/README.md) |
| Auth | `/auth` | Login/register/token/session/user admin | [README](../src/modules/auth/README.md) |
| Authorization | `/authorization` | Role/permission | [README](../src/modules/authorization/README.md) |
| Warehouses | `/warehouses` | CRUD kho master | [README](../src/modules/warehouses/README.md) |
| Locations | `/locations` | Zone/kệ/vị trí | [README](../src/modules/locations/README.md) |
| Catalog | `/catalog` | Category/product/SKU | [README](../src/modules/catalog/README.md) |
| Suppliers | `/suppliers` | Nhà cung cấp | [README](../src/modules/suppliers/README.md) |
| Batches | `/batches` | Lô/hạn sử dụng | [README](../src/modules/batches/README.md) |
| Stock | `/stock` | Tồn hiện tại, near-expiry, allocation | [README](../src/modules/stock/README.md) |
| Inventory Transactions | `/inventory-transactions` | Log biến động tồn | [README](../src/modules/inventory-transactions/README.md) |
| Goods Receipts | `/goods-receipts` | Phiếu nhập | [README](../src/modules/goods-receipts/README.md) |
| Goods Issues | `/goods-issues` | Phiếu xuất | [README](../src/modules/goods-issues/README.md) |
| Stock Transfers | `/stock-transfers` | Chuyển kho | [README](../src/modules/stock-transfers/README.md) |
| Stock Counts | `/stock-counts` | Kiểm kê | [README](../src/modules/stock-counts/README.md) |
| Stock Adjustments | `/stock-adjustments` | Điều chỉnh tồn | [README](../src/modules/stock-adjustments/README.md) |
| Alerts | `/alerts` | Cảnh báo vận hành | [README](../src/modules/alerts/README.md) |
| Notifications | `/notifications` | Thông báo | [README](../src/modules/notifications/README.md) |
| Reports | `/reports` | Báo cáo readonly | [README](../src/modules/reports/README.md) |
| Audit Logs | `/audit-logs` | Truy vết thao tác | [README](../src/modules/audit-logs/README.md) |
| Attachments | `/attachments` | Metadata file đính kèm | [README](../src/modules/attachments/README.md) |
| Settings | `/settings` | Cấu hình ứng dụng | [README](../src/modules/settings/README.md) |

## 6. Quyền đang dùng

Các endpoint đọc cơ bản hiện mở theo scope demo. Các endpoint thao tác nghiệp vụ nhạy cảm dùng `verifyToken` và `requirePermission`:

- `users:read`, `users:create`, `users:update`, `users:delete`
- `authorization:read`, `authorization:update`
- `warehouses:create`, `warehouses:update`, `warehouses:delete`

- `goods_receipts:confirm`, `goods_receipts:reverse`
- `goods_issues:confirm`, `goods_issues:reverse`
- `stock_transfers:confirm`, `stock_transfers:reverse`
- `stock_adjustments:approve`, `stock_adjustments:reject`, `stock_adjustments:cancel`
- `stock_counts:create`, `stock_counts:start`, `stock_counts:count`, `stock_counts:submit`, `stock_counts:approve`
- `alerts:generate`, `alerts:read`, `alerts:resolve`
- `notifications:generate`, `notifications:read`

## 7. Database files

Import theo thứ tự:

```bash
mysql -u root -p warehouse_management < backend/warehouse_management_mysql.sql
mysql -u root -p warehouse_management < backend/warehouse_sample_data.sql
```

- `warehouse_management_mysql.sql`: schema chính.
- `warehouse_sample_data.sql`: dữ liệu demo cho frontend và integration test.
- `warehouse_database_design.md`: thiết kế database và rule tồn kho.

## 8. Kiểm tra chất lượng

```bash
npm run lint
npm run build
npm test
npm run test:e2e
npm run test:integration
```

Integration test yêu cầu MySQL đang chạy và đã import sample data.

## 9. Production readiness

Rà soát ngày 2026-07-23. Giữ bảng này để intern biết mục nào đã xử lý và mục nào phụ thuộc hạ tầng deploy.

| Trạng thái | Hạng mục | Chi tiết |
| --- | --- | --- |
| ✅ Đã fix | `PUT/DELETE /auth/users/:id` đã có `verifyToken`/`requirePermission` | Route quản lý user yêu cầu token và quyền `users:update`/`users:delete`; `GET/POST /auth/users` dùng `users:read`/`users:create`. |
| ✅ Đã fix | `POST /auth/register` không còn nhận `roleCode` từ client | Endpoint public luôn tạo user role `STAFF`; quản trị tạo user theo role dùng `POST /auth/users` có `users:create`. |
| ✅ Đã fix | `CORS_ORIGIN` không còn mặc định `*` | Mặc định là `http://localhost:5173`; có thể cấu hình nhiều origin bằng dấu phẩy. |
| ✅ Đã fix | Có rate limiting trên `login` và `password-reset/request` | Middleware in-memory theo IP + email: login 10 lần/15 phút, reset password 5 lần/15 phút. Production nhiều instance nên đổi sang Redis/shared store. |
| ✅ Đã fix | `alerts` resolve/read đã có permission riêng | `PATCH /alerts/:id/read` dùng `alerts:read`, `PATCH /alerts/:id/resolve` dùng `alerts:resolve`, notification read dùng `notifications:read`. |
| ✅ Đã fix | Fallback resolve warehouse/user theo `id OR code` | Các flow tạo receipt/issue/transfer/adjustment đã tách query: có id thì tìm theo id, không có id mới fallback code demo. |
| ✅ Đã có | Dockerfile/docker-compose và CI pipeline cơ bản | `backend/Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml`. |
| ⚠️ Phụ thuộc hạ tầng | Log tập trung/monitoring | App đã log JSON theo request id ra stdout; production cần collector ngoài repo như ELK/CloudWatch/Grafana Agent đọc stdout container. |
