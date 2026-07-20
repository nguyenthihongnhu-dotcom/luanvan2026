# Frontend Gap Theo Backend Module

Docs này giúp biết backend module nào đã có giao diện frontend, module nào còn thiếu UI, và nên bổ sung theo thứ tự nào.

## Quy ước trạng thái

- `Đã có UI`: frontend có route/màn chính gọi API module đó.
- `Có một phần`: frontend có dùng dữ liệu module đó nhưng chưa đủ CRUD/flow nghiệp vụ.
- `Chưa có UI`: backend có API/module nhưng frontend chưa có màn riêng.
- `Không cần UI riêng`: module kỹ thuật, dùng qua docs/health hoặc hệ thống.

## Bảng tổng hợp

| Backend module | Frontend hiện tại | Trạng thái | Ghi chú |
| --- | --- | --- | --- |
| `health` | Không có màn riêng | Không cần UI riêng | Dùng để debug/monitor: `GET /health`. |
| `openapi` | Không có màn riêng | Không cần UI riêng | Swagger ở `/docs`, không cần build UI trong app. |
| `auth` | `features/auth`, `features/staff` | Có một phần | Login đã có. Staff list dùng `/auth/users`. Register service hiện cần kiểm tra/nối lại API thật nếu muốn UI đăng ký hoạt động đầy đủ. |
| `authorization` | Chưa có màn role/permission | Chưa có UI | Cần nếu muốn admin quản lý quyền. Hiện chỉ dùng ngầm qua token/permission. |
| `warehouses` | Locations dùng layout kho | Có một phần | Chưa có màn CRUD kho riêng. Locations phụ thuộc warehouse mặc định/backend. |
| `locations` | `features/locations` | Đã có UI | Có sơ đồ kho, tạo zone/shelf/location và xóa shelf/layer qua API. |
| `catalog` | `features/products` | Đã có UI | Products/categories đã gọi `/catalog/*`; danh mục và sản phẩm có CRUD cơ bản. |
| `suppliers` | `features/partners` | Đã có UI | Partners đang map supplier backend; update service có nhưng UI sửa có thể chưa đầy đủ. |
| `batches` | Products đọc hạn qua report | Có một phần | Chưa có màn quản lý lô riêng. Near-expiry dùng report, không gọi `/batches` trực tiếp. |
| `stock` | Products/locations dùng tồn qua reports/locations | Có một phần | Chưa có màn tồn kho chuyên biệt gọi `/stock/current`, `/stock/allocation`. |
| `inventory-transactions` | Transactions/report data | Có một phần | Chưa có màn log tồn riêng gọi trực tiếp `/inventory-transactions`. Integration/report có dùng backend. |
| `goods-receipts` | `features/transactions` | Có một phần | Có list/tạo header phiếu nhập. Chưa có UI item detail/confirm/reverse đầy đủ. |
| `goods-issues` | `features/transactions` | Có một phần | Có list/tạo header phiếu xuất. Chưa có UI item detail/confirm/reverse đầy đủ. |
| `stock-transfers` | Chưa có màn chuyển kho | Chưa có UI | Backend có list/confirm/reverse nhưng frontend chưa có route/form chuyển kho. |
| `stock-counts` | Chưa có màn kiểm kê | Chưa có UI | Backend có lifecycle kiểm kê nhưng frontend chưa có route. |
| `stock-adjustments` | `features/transactions` | Có một phần | Có list/tạo header điều chỉnh. Chưa có UI item detail/approve/reject/cancel đầy đủ. |
| `alerts` | Chưa có màn cảnh báo | Chưa có UI | Backend có list/generate; frontend chưa có badge/list/notification center. |
| `notifications` | Chưa có notification UI | Chưa có UI | Backend có list/generate; frontend chưa có notification center/realtime. |
| `reports` | Products dùng report stock/near-expiry | Có một phần | Chưa có dashboard báo cáo riêng cho movement/transaction reports. |
| `audit-logs` | Chưa có màn audit | Chưa có UI | Cần cho admin/truy vết. |
| `attachments` | Chưa có UI file đính kèm | Chưa có UI | Backend hiện mới list metadata, chưa upload/download thật. |
| `settings` | Chưa có màn cấu hình | Chưa có UI | Cần nếu muốn admin chỉnh cấu hình nghiệp vụ. |

## Ưu tiên bổ sung UI

### Ưu tiên 1 - Hoàn thiện nghiệp vụ kho core

Các màn này quan trọng nhất để đồ án vận hành đúng chủ đề WMS.

1. **Phiếu nhập chi tiết**
   - Module backend: `goods-receipts`
   - Cần UI: thêm item, chọn SKU, batch, hạn sử dụng, vị trí nhập, confirm/reverse.

2. **Phiếu xuất chi tiết**
   - Module backend: `goods-issues`
   - Cần UI: thêm item, chọn SKU/số lượng, preview allocation FEFO/FIFO, confirm/reverse.

3. **Chuyển kho**
   - Module backend: `stock-transfers`
   - Cần UI: tạo phiếu chuyển, chọn vị trí nguồn/đích, confirm/reverse.

4. **Kiểm kê kho**
   - Module backend: `stock-counts`
   - Cần UI: tạo phiếu, start, nhập số đếm, submit, approve.

5. **Điều chỉnh tồn chi tiết**
   - Module backend: `stock-adjustments`
   - Cần UI: thêm item điều chỉnh, approve/reject/cancel.

### Ưu tiên 2 - Màn vận hành

1. **Tồn kho chuyên biệt**
   - Module backend: `stock`
   - Cần UI: stock current, near-expiry, allocation preview.

2. **Quản lý lô hàng**
   - Module backend: `batches`
   - Cần UI: list/search lô, trạng thái, hạn sử dụng, liên kết SKU.

3. **Báo cáo**
   - Module backend: `reports`
   - Cần UI: product stock, near-expiry, inventory movements, inventory transactions.

4. **Cảnh báo và thông báo**
   - Module backend: `alerts`, `notifications`
   - Cần UI: danh sách cảnh báo, generate, notification center.

### Ưu tiên 3 - Admin/support

1. **Role/Permission admin**
   - Module backend: `authorization`
   - Cần UI: xem role/permission, sau này gán quyền.

2. **Kho master data**
   - Module backend: `warehouses`
   - Cần UI: CRUD kho nếu không muốn quản lý bằng SQL.

3. **Audit logs**
   - Module backend: `audit-logs`
   - Cần UI: filter theo user/action/entity/date.

4. **Attachments**
   - Module backend: `attachments`
   - Cần UI sau khi backend có upload/download thật.

5. **Settings**
   - Module backend: `settings`
   - Cần UI quản trị cấu hình.

## Route frontend đề xuất

| Route đề xuất | Feature | Backend module |
| --- | --- | --- |
| `/stock` | `stock` | `stock` |
| `/batches` | `batches` | `batches` |
| `/receipts/:id` | `transactions` hoặc `receipts` | `goods-receipts` |
| `/issues/:id` | `transactions` hoặc `issues` | `goods-issues` |
| `/transfers` | `transfers` | `stock-transfers` |
| `/stock-counts` | `stock-counts` | `stock-counts` |
| `/adjustments/:id` | `transactions` hoặc `adjustments` | `stock-adjustments` |
| `/reports` | `reports` | `reports` |
| `/alerts` | `alerts` | `alerts`, `notifications` |
| `/audit-logs` | `audit` | `audit-logs` |
| `/settings` | `settings` | `settings` |

## Lưu ý khi triển khai các UI còn thiếu

- Không tạo mock local cho màn đã có backend API.
- Mỗi feature mới phải có `src/features/<feature>/README.md`.
- API gọi qua `services`, không gọi trực tiếp trong page/component.
- Flow confirm/approve cần token và permission, nên phải test bằng user đủ quyền.
- Enum/backend code phải map sang tiếng Việt trước khi render.
- Với nghiệp vụ tồn kho, sau mutation nên reload từ backend để tránh state lệch.