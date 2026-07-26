# Backend Overview - Bambi WMS

Backend Bambi WMS dùng Express + TypeScript + MySQL, chia theo module nghiệp vụ trong `src/modules`. File này là docs tổng cho intern/dev: kiến trúc, thứ tự đọc module, thứ tự dữ liệu, response format, module index, quyền, cách chạy và checklist production readiness.

## 1. Kiến Trúc Lớp

```text
HTTP request
  -> app.ts
  -> <module>.routes.ts
  -> middleware auth/permission/rate-limit nếu cần
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
- Request log là JSON ra stdout, có `requestId` để truy vết.

## 2. Thứ Tự Hiểu Module

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

Vì sao phải đọc theo thứ tự này:

- `auth` và `authorization` quyết định endpoint nào được confirm/approve/update.
- `warehouses` và `locations` tạo nơi chứa hàng.
- `catalog` và `batches` tạo SKU/lô để nhập/xuất.
- `stock_locations` là tồn hiện tại, được đọc bởi stock/report và được mutate bởi chứng từ.
- `inventory_transactions` là lịch sử biến động tồn, được ghi bởi confirm/approve/reverse.
- Reports/alerts/notifications chỉ có ý nghĩa khi stock core đã đúng.

## 3. Thứ Tự Dữ Liệu Để Dự Án Chạy Trơn Tru

Khi import DB hoặc debug màn hình trống, kiểm tra theo pipeline này:

| Thứ tự | Cần có | Vì sao quan trọng |
| --- | --- | --- |
| 1 | Schema MySQL | Tất cả module phụ thuộc table/constraint. |
| 2 | Roles, permissions, users | Login và thao tác cần user/quyền. |
| 3 | Warehouses | Root của cấu trúc kho. |
| 4 | Zones, shelves, locations | Nơi đặt tồn. |
| 5 | Categories, brands, units | Nền cho sản phẩm. |
| 6 | Products, product variants | SKU nghiệp vụ. |
| 7 | Suppliers | Phiếu nhập cần nhà cung cấp. |
| 8 | Product batches | Lô/hạn dùng cho FEFO và expiry tracking. |
| 9 | Stock locations | Nguồn sự thật của tồn hiện tại. |
| 10 | Goods receipts/issues/transfers/counts/adjustments | Chứng từ nghiệp vụ. |
| 11 | Inventory transactions | Lịch sử biến động tồn. |
| 12 | Reports/views | Dữ liệu tổng hợp cho frontend. |
| 13 | Alerts/notifications/audit/settings/attachments | Vận hành và truy vết. |

Triệu chứng thường gặp khi thiếu tầng trước:

- Login lỗi: thiếu user/role/permission hoặc password hash sai.
- Màn kho trống: thiếu warehouse/zone/shelf/location.
- Màn hàng hóa trống: thiếu product/product_variant hoặc report query không có stock.
- Xuất kho lỗi thiếu tồn: thiếu `stock_locations` hoặc available quantity không đủ.
- Confirm/approve/update 403: role chưa được gán permission.
- Integration test lỗi sample data: chưa import `warehouse_sample_data.sql`.

## 4. Response Format

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

## 5. Module Index

| Module | Base path | Vai trò | Docs |
| --- | --- | --- | --- |
| Health | `/health` | Kiểm tra service/database | [README](../src/modules/health/README.md) |
| OpenAPI | `/openapi.json`, `/docs` | Tài liệu API runtime | [README](../src/modules/openapi/README.md) |
| Auth | `/auth` | Login/register/token/session/user admin | [README](../src/modules/auth/README.md) |
| Authorization | `/authorization` | Role/permission và mapping role-permission | [README](../src/modules/authorization/README.md) |
| Warehouses | `/warehouses` | CRUD kho master | [README](../src/modules/warehouses/README.md) |
| Locations | `/locations` | Zone/kệ/vị trí/lịch sử vị trí | [README](../src/modules/locations/README.md) |
| Catalog | `/catalog` | Category/product/SKU | [README](../src/modules/catalog/README.md) |
| Suppliers | `/suppliers` | Nhà cung cấp | [README](../src/modules/suppliers/README.md) |
| Batches | `/batches` | Lô/hạn sử dụng readonly | [README](../src/modules/batches/README.md) |
| Stock | `/stock` | Tồn hiện tại, near-expiry, allocation | [README](../src/modules/stock/README.md) |
| Inventory Transactions | `/inventory-transactions` | Log biến động tồn | [README](../src/modules/inventory-transactions/README.md) |
| Goods Receipts | `/goods-receipts` | Phiếu nhập, detail, confirm/reverse | [README](../src/modules/goods-receipts/README.md) |
| Goods Issues | `/goods-issues` | Phiếu xuất, detail, confirm/reverse | [README](../src/modules/goods-issues/README.md) |
| Stock Transfers | `/stock-transfers` | Chuyển kho | [README](../src/modules/stock-transfers/README.md) |
| Stock Counts | `/stock-counts` | Kiểm kê | [README](../src/modules/stock-counts/README.md) |
| Stock Adjustments | `/stock-adjustments` | Điều chỉnh tồn, detail, approve/reject/cancel | [README](../src/modules/stock-adjustments/README.md) |
| Alerts | `/alerts` | Cảnh báo vận hành | [README](../src/modules/alerts/README.md) |
| Notifications | `/notifications` | Thông báo | [README](../src/modules/notifications/README.md) |
| Reports | `/reports` | Báo cáo readonly | [README](../src/modules/reports/README.md) |
| Audit Logs | `/audit-logs` | Truy vết thao tác | [README](../src/modules/audit-logs/README.md) |
| Attachments | `/attachments` | Metadata file đính kèm readonly | [README](../src/modules/attachments/README.md) |
| Settings | `/settings` | Xem/cập nhật cấu hình ứng dụng | [README](../src/modules/settings/README.md) |

## 6. Endpoint Quan Trọng

### Auth/User

| Method | Path | Ghi chú |
| --- | --- | --- |
| POST | `/auth/login` | Có rate limit theo IP + email. |
| POST | `/auth/register` | Public, luôn tạo role `STAFF`. |
| GET | `/auth/users` | Cần `users:read`. |
| POST | `/auth/users` | Cần `users:create`. |
| PUT | `/auth/users/:id` | Cần `users:update`. |
| DELETE | `/auth/users/:id` | Cần `users:delete`. |

### Chứng Từ Tồn Kho

| Method | Path | Ghi chú |
| --- | --- | --- |
| GET | `/goods-receipts/:id` | Detail phiếu nhập gồm header + items. |
| POST | `/goods-receipts/:id/confirm` | Cần `goods_receipts:confirm`. |
| POST | `/goods-receipts/:id/reverse` | Cần `goods_receipts:reverse`. |
| GET | `/goods-issues/:id` | Detail phiếu xuất gồm header + items. |
| POST | `/goods-issues/:id/confirm` | Cần `goods_issues:confirm`. |
| POST | `/goods-issues/:id/reverse` | Cần `goods_issues:reverse`. |
| GET | `/stock-adjustments/:id` | Detail phiếu điều chỉnh gồm header + items. |
| POST | `/stock-adjustments/:id/approve` | Cần `stock_adjustments:approve`. |
| POST | `/stock-adjustments/:id/reject` | Cần `stock_adjustments:reject`. |
| POST | `/stock-adjustments/:id/cancel` | Cần `stock_adjustments:cancel`. |

### Settings

| Method | Path | Ghi chú |
| --- | --- | --- |
| GET | `/settings` | List app settings. |
| PUT | `/settings/:id` | Cần `settings:update`, body gồm `settingValue` và `description`. |

## 7. Quyền Đang Dùng

Các endpoint đọc cơ bản hiện mở theo scope demo. Các endpoint thao tác nhạy cảm dùng `verifyToken` và `requirePermission`:

- `users:read`, `users:create`, `users:update`, `users:delete`
- `authorization:read`, `authorization:update`
- `warehouses:create`, `warehouses:update`, `warehouses:delete`
- `settings:update`
- `goods_receipts:confirm`, `goods_receipts:reverse`
- `goods_issues:confirm`, `goods_issues:reverse`
- `stock_transfers:confirm`, `stock_transfers:reverse`
- `stock_adjustments:approve`, `stock_adjustments:reject`, `stock_adjustments:cancel`
- `stock_counts:create`, `stock_counts:start`, `stock_counts:count`, `stock_counts:submit`, `stock_counts:approve`
- `alerts:generate`, `alerts:read`, `alerts:resolve`
- `notifications:generate`, `notifications:read`

Nếu vừa import schema cũ hoặc vừa thêm permission mới, chạy lại phần seed `permissions`/`role_permissions` trong `warehouse_management_mysql.sql` và đăng nhập lại để token chứa permission mới.

## 8. Database Files

Import theo thứ tự:

```bash
mysql -u root -p warehouse_management < backend/warehouse_management_mysql.sql
mysql -u root -p warehouse_management < backend/warehouse_sample_data.sql
```

- `warehouse_management_mysql.sql`: schema chính, view report, roles/permissions seed.
- `warehouse_sample_data.sql`: dữ liệu demo cho frontend và integration test.
- `warehouse_database_design.md`: thiết kế database và rule tồn kho.

## 9. Chạy Và Kiểm Tra

Chạy local backend:

```bash
cd backend
npm install
npm run dev
```

Build/check TypeScript:

```bash
cd backend
npm run build
```

Test commands:

```bash
npm run lint
npm test
npm run test:e2e
npm run test:integration
```

Integration test yêu cầu MySQL đang chạy và đã import sample data.

Chạy bằng Docker Compose từ root repo:

```bash
docker compose up --build
```

Compose dựng MySQL 8.4, import schema/sample data và chạy backend tại `http://localhost:3000`.

## 10. Production Readiness

Rà soát ngày 2026-07-26. Giữ bảng này để intern biết mục nào đã xử lý và mục nào phụ thuộc hạ tầng deploy.

| Trạng thái | Hạng mục | Chi tiết |
| --- | --- | --- |
| DONE | Auth user admin đã có guard | `GET/POST/PUT/DELETE /auth/users` yêu cầu token và permission tương ứng. |
| DONE | Public register không nhận role từ client | `/auth/register` luôn tạo role `STAFF`; admin tạo user theo role qua `/auth/users`. |
| DONE | CORS không còn mặc định `*` | Mặc định là `http://localhost:5173`; hỗ trợ nhiều origin bằng dấu phẩy. |
| DONE | Rate limit auth | Login 10 lần/15 phút, password reset request 5 lần/15 phút theo IP + email. Production nhiều instance nên chuyển sang Redis/shared store. |
| DONE | Alert/notification action có permission | Alert read/resolve và notification read có permission riêng. |
| DONE | Fallback `id OR code` đã tách query | Các flow tạo receipt/issue/transfer/adjustment: có id thì tìm theo id, không có id mới fallback code demo. |
| DONE | Detail route chứng từ | Có `GET /goods-receipts/:id`, `GET /goods-issues/:id`, `GET /stock-adjustments/:id`. |
| DONE | Settings update | Có `PUT /settings/:id` với `settings:update`. |
| DONE | Docker/CI cơ bản | Có `backend/Dockerfile`, `backend/.dockerignore`, `docker-compose.yml`, `.github/workflows/ci.yml`. |
| DONE | Authorization routes đã có guard | `GET /authorization`, `GET /authorization/permissions`, `PUT /authorization/roles/:id/permissions` yêu cầu token và permission `authorization:read`/`authorization:update`. |
| INFRA | Log tập trung/monitoring | App đã log JSON theo request id ra stdout; production cần collector ngoài repo như ELK/CloudWatch/Grafana Agent đọc stdout container. |

## 11. Phần Còn Lại Nếu Muốn Nâng Production

- Đổi rate limit in-memory sang Redis nếu chạy nhiều backend instance.
- Thêm upload/download thật cho `attachments` sau khi chốt storage strategy.
- Thêm CRUD/block cho `batches` nếu muốn quản lý lô thủ công ngoài luồng nhập hàng.
- Mở rộng filter audit theo user/entity/date.
- Bắt buộc `createdBy` từ token cho các endpoint tạo chứng từ thay vì cho phép body/fallback demo.
