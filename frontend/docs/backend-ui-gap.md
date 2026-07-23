# Frontend Gap Theo Backend Module

Tài liệu này dùng để biết backend module nào đã có giao diện frontend, module nào chỉ mới có một phần flow, và phần nào còn phụ thuộc backend mở rộng thêm API.

## Quy ước trạng thái

- `Đã có UI`: frontend có route/màn chính gọi API module đó.
- `Có một phần`: frontend có dùng API module đó nhưng chưa đủ flow nghiệp vụ hoặc backend chưa có đủ endpoint chi tiết.
- `Không cần UI riêng`: module kỹ thuật, dùng qua health/docs.

## Bảng tổng hợp

| Backend module | Frontend hiện tại | Trạng thái | Ghi chú |
| --- | --- | --- | --- |
| `health` | Không có màn riêng | Không cần UI riêng | Dùng để debug/monitor: `GET /health`. |
| `openapi` | Không có màn riêng | Không cần UI riêng | Swagger ở `/docs`, không build UI trong app. |
| `auth` | `features/auth`, `features/staff` | Đã có UI | Login/register; quản lý user dùng `/auth/users` có token/permission. |
| `authorization` | `features/authorization` | Đã có UI | `/authorization` xem role và permissions theo role. |
| `warehouses` | `features/warehouses` | Đã có UI | Có CRUD kho master; delete là xoá mềm để giữ dữ liệu vị trí/tồn. |
| `locations` | `features/locations` | Đã có UI | Sơ đồ kho, tạo zone/shelf/location, reorder kệ, lịch sử vị trí, in QR. |
| `catalog` | `features/products`, `CategoriesPage` | Đã có UI | Products/categories gọi `/catalog/*`, có CRUD cơ bản. |
| `suppliers` | `features/partners` | Đã có UI | Partners map supplier backend và có CRUD cơ bản. |
| `batches` | `features/batches` | Đã có UI | Có list/filter lô, trạng thái, hạn dùng; backend hiện chưa có CRUD lô. |
| `stock` | `features/stock` | Đã có UI | Tồn hiện tại, gần hết hạn, preview FEFO/FIFO. |
| `inventory-transactions` | `features/inventory-transactions`, location history | Đã có UI | Có log tồn toàn hệ thống và lịch sử theo vị trí. |
| `goods-receipts` | `features/transactions` | Đã có UI | List/tạo kèm item, confirm/reverse và route detail `/receipts/:id`. |
| `goods-issues` | `features/transactions` | Đã có UI | List/tạo kèm item, preview FEFO/FIFO, confirm/reverse và route detail `/issues/:id`. |
| `stock-transfers` | `features/transfers` | Đã có UI | List, tạo phiếu, confirm/reverse. |
| `stock-counts` | `features/stock-counts` | Đã có UI | List, create/start/count/submit/approve. |
| `stock-adjustments` | `features/transactions` | Đã có UI | List/tạo kèm item, approve/reject/cancel và route detail `/adjustments/:id`. |
| `alerts` | `features/alerts` | Đã có UI | List/filter/generate, mark read, resolve. |
| `notifications` | `features/alerts` | Đã có UI | Tab thông báo, list/search/generate/mark read. |
| `reports` | `features/reports`, products/stock | Đã có UI | Dashboard báo cáo: tồn, gần hạn, biến động, transaction report. |
| `audit-logs` | `features/audit-logs` | Đã có UI | List/filter theo action hiện có của backend. |
| `attachments` | `features/attachments` | Đã có UI | Xem metadata file; backend chưa có upload/download storage thật. |
| `settings` | `features/settings` | Đã có UI | Xem/cập nhật app settings bằng quyền `settings:update`, có validate JSON ở frontend. |

## Phần còn lại nên làm tiếp

1. CRUD lô hàng: backend hiện mới list, nếu muốn quản lý lô thủ công cần thêm create/update/block.
2. Upload/download attachments: cần storage strategy trước, không nên fake upload ở frontend.
3. Audit filter nâng cao: backend hiện mới search theo action; muốn filter user/entity/date cần mở rộng query.
4. Permission-aware UI nâng cao: hiện đã áp dụng cho transaction actions và settings; có thể mở rộng sang mọi nút admin còn lại.

## Route hiện có

| Route | Feature | Backend module |
| --- | --- | --- |
| `/locations` | `locations` | `locations`, `warehouses` |
| `/warehouses` | `warehouses` | `warehouses` |
| `/stock` | `stock` | `stock`, `warehouses` |
| `/inventory-transactions` | `inventory-transactions` | `inventory-transactions` |
| `/batches` | `batches` | `batches` |
| `/alerts` | `alerts` | `alerts`, `notifications` |
| `/products` | `products` | `catalog`, `reports` |
| `/transactions` | `transactions` | `goods-receipts`, `goods-issues`, `stock-adjustments`, `stock` |
| `/receipts/:id`, `/issues/:id`, `/adjustments/:id` | `transactions/detail` | `goods-receipts`, `goods-issues`, `stock-adjustments` |
| `/transfers` | `transfers` | `stock-transfers`, `stock`, `locations` |
| `/stock-counts` | `stock-counts` | `stock-counts`, `warehouses` |
| `/partners` | `partners` | `suppliers` |
| `/employees` | `staff` | `auth/users` |
| `/categories` | `products/categories` | `catalog/categories` |
| `/reports` | `reports` | `reports` |
| `/authorization` | `authorization` | `authorization` |
| `/audit-logs` | `audit-logs` | `audit-logs` |
| `/attachments` | `attachments` | `attachments` |
| `/settings` | `settings` | `settings` |

## Quy tắc triển khai tiếp

- Không tạo mock local cho màn đã có backend API.
- Mỗi feature mới phải có service riêng; page không gọi `httpClient` trực tiếp.
- Flow confirm/approve/generate cần token và permission, test bằng user đủ quyền.
- Enum/backend code phải map sang tiếng Việt trước khi render.
- Với nghiệp vụ tồn kho, sau mutation reload từ backend để tránh state lệch.
