# GIẢI THÍCH CÁC TRANG (Screen Reference)

Tài liệu giải thích từng màn hình theo cùng khuôn với `docs_giai_thich_trang_stock.md`:
**tổng quan chức năng → thông báo/cảnh báo → ý nghĩa dữ liệu → API kết nối**.

Trang Tồn kho (`/stock`) có tài liệu riêng: [`docs_giai_thich_trang_stock.md`](docs_giai_thich_trang_stock.md).
Hướng dẫn thao tác cho người dùng cuối: [`USER_GUIDE.md`](USER_GUIDE.md).

## Mục lục

1. [Hàng hóa (`/products`)](#1-hàng-hóa-products)
2. [Danh mục (`/categories`)](#2-danh-mục-categories)
3. [Chứng từ kho (`/transactions`)](#3-chứng-từ-kho-transactions)
4. [Chi tiết chứng từ (`/receipts|issues|adjustments/:id`)](#4-chi-tiết-chứng-từ)
5. [Sơ đồ kho (`/locations`)](#5-sơ-đồ-kho-locations)
6. [Lô hàng (`/batches`)](#6-lô-hàng-batches)
7. [Kiểm kê (`/stock-counts`)](#7-kiểm-kê-stock-counts)
8. [Nhận nhanh (`/quick-receive`)](#8-nhận-nhanh-quick-receive)
9. [Chuyển kho (`/transfers`)](#9-chuyển-kho-transfers)
10. [Nhân viên (`/employees`)](#10-nhân-viên-employees)
11. [Phân quyền (`/authorization`)](#11-phân-quyền-authorization)
12. [Kho hàng (`/warehouses`)](#12-kho-hàng-warehouses)
13. [Nhà cung cấp (`/partners`)](#13-nhà-cung-cấp-partners)
14. [Các trang chỉ đọc](#14-các-trang-chỉ-đọc)

---

## 1. Hàng hóa (`/products`)

### Tổng quan
Khai báo danh mục sản phẩm. **Đây chỉ là nơi khai báo, không phải nơi nhập tồn.** Sản phẩm mới luôn bắt đầu tồn `0`; số lượng chỉ tăng khi có **phiếu nhập kho được xác nhận**. Nhờ vậy mọi thay đổi tồn đều truy ngược được về một chứng từ.

### Thông báo / Cảnh báo
- **Cột trạng thái tồn**: `Còn hàng` / `Sắp hết` (tồn ≤ tồn tối thiểu) / `Hết hàng` (tồn = 0).
- **Cảnh báo khi xóa**: không xóa được sản phẩm đã xuất hiện trên bất kỳ phiếu nào (`PRODUCT_HAS_DOCUMENTS`, 409) hoặc còn tồn (`PRODUCT_HAS_STOCK`, 409) — bảo vệ nhật ký kho.
- **Banner lỗi đỏ**: lỗi validate hoặc lỗi HTTP từ backend.

### Ý nghĩa dữ liệu
- **SKU** — mã đơn vị sản phẩm, dùng trong mọi chứng từ.
- **Danh mục** — nhóm sản phẩm.
- **Tồn tối thiểu (`min_stock_level`)** — ngưỡng cảnh báo sắp hết.
- **Hạn dùng gần nhất (`MIN(expiry_date)`)** — hạn của lô sắp hết hạn sớm nhất, **không phải** một hạn cố định của sản phẩm.
- **Theo dõi theo lô (`requires_lot_tracking`)** — bật thì khi nhập kho bắt buộc khai số lô. Mặc định bật cho hàng Mẹ & Bé.
- **Theo dõi hạn dùng (`requires_expiry_tracking`)** — bật thì khi nhập kho bắt buộc khai hạn. Bật cho sữa, bột, thực phẩm.

### API
| Method | Endpoint |
|---|---|
| GET | `/catalog/products` |
| POST | `/catalog/products` |
| PUT | `/catalog/products/:id` |
| DELETE | `/catalog/products/:id` |

---

## 2. Danh mục (`/categories`)

### Tổng quan
Quản lý danh mục để phân nhóm sản phẩm.

### Thông báo / Cảnh báo
- Banner lỗi đỏ khi trùng mã hoặc lỗi backend.

### Ý nghĩa dữ liệu
- **Mã danh mục (`code`)** — tự sinh từ tên nếu bỏ trống.
- **Tên (`name`)**, **Mô tả (`description`)**, **Trạng thái (`ACTIVE`/`INACTIVE`)**.

### API
| Method | Endpoint |
|---|---|
| GET | `/catalog/categories` |
| POST | `/catalog/categories` |
| PUT | `/catalog/categories/:id` |

---

## 3. Chứng từ kho (`/transactions`)

### Tổng quan
Danh sách gộp cả ba loại chứng từ — **Nhập (NHAP)**, **Xuất (XUAT)**, **Điều chỉnh (DIEU_CHINH)** — kèm nút thao tác theo trạng thái. Nút "Thêm giao dịch" mở modal tạo phiếu; số phiếu **tự sinh** theo dạng `PN-YYYYMM-NNN` / `PX-...` / `DC-...`.

Khi tạo phiếu **điều chỉnh**, có 3 kiểu:
- **Sửa số lượng** — hàng ở nguyên ô, đổi số (một dòng IN/OUT).
- **Chuyển vị trí** — chuyển nguyên số sang ô khác (sinh hai dòng OUT nguồn + IN đích).
- **Cả hai** — vừa chuyển vừa đổi số.

Thanh tóm tắt hiện tồn hiện tại và tồn **sau điều chỉnh** để không "nhập số trong hư vô".

### Thông báo / Cảnh báo
- **Nút theo trạng thái**: Chờ xử lý/Nháp → Duyệt/Từ chối/Hủy; Đã hủy/Đảo → Thêm lại phiếu; luôn có Chi tiết.
- **Cảnh báo vượt tồn** khi dòng OUT lớn hơn tồn ô: báo ngay và sẽ bị từ chối lúc duyệt.
- Phiếu điều chỉnh **chưa duyệt thì không tác động tồn kho**.

### Ý nghĩa dữ liệu
- **Loại (`loai`)** — NHAP/XUAT/DIEU_CHINH.
- **Trạng thái** — DRAFT/PENDING/CONFIRMED/APPROVED/REJECTED/REVERSED/CANCELLED.
- **Hướng điều chỉnh** — IN (tăng) / OUT (giảm).

### API
| Method | Endpoint |
|---|---|
| POST | `/goods-receipts`, `/goods-issues`, `/stock-adjustments` |
| POST | `/goods-receipts/:id/confirm`, `/goods-issues/:id/confirm` |
| POST | `/goods-receipts/:id/reverse`, `/goods-issues/:id/reverse` |
| POST | `/stock-adjustments/:id/approve|reject|cancel` |
| GET | `/stock/allocation`, `/stock/current` (xem phân bổ khi xuất) |

---

## 4. Chi tiết chứng từ

### Tổng quan
Xem đầy đủ một phiếu (`/receipts/:id`, `/issues/:id`, `/adjustments/:id`) và thực hiện thao tác duyệt/xác nhận/đảo/hủy đúng theo trạng thái.

### Thông báo / Cảnh báo
- Nút thao tác chỉ hiện khi trạng thái cho phép.
- Duyệt phiếu điều chỉnh khi thiếu tồn (OUT) → `INSUFFICIENT_STOCK`; lô sai sản phẩm → `BATCH_VARIANT_MISMATCH`.

### Ý nghĩa dữ liệu
- **Ba mốc ngày**: Ngày tạo / Ngày xác nhận (hoặc duyệt) / — ghi rõ trên trang.
- **Cột Lô**: `#batch_id - lot_number` — kèm id lô vì số lô nhà sản xuất có thể trùng giữa các lần nhập.

### API
| Method | Endpoint |
|---|---|
| GET | `/goods-receipts/:id`, `/goods-issues/:id`, `/stock-adjustments/:id` (theo loại) |

---

## 5. Sơ đồ kho (`/locations`)

### Tổng quan
Mặt bằng kho 2D theo phân cấp **Kho → Khu → Kệ → Tầng → Ô lưu trữ**. Kéo thả khu để đặt vị trí; đang kéo bấm `F` xoay ngang/dọc, `Esc` hủy.

### Thông báo / Cảnh báo
- **Khoảng trắng là lối đi**, không phải ô trống. **Lưới nét đứt chỉ hiện khi đang kéo khu**.
- Ô hiện **mã khu** (A, B, C); có **biệt danh** thì hiện dưới mã. Khu chưa đặt biệt danh chỉ hiện mã.
- Khu hết chỗ: phủ gạch chéo đỏ, ghi `ĐẦY`.
- **Xóa khu** bị chặn (`ZONE_NOT_EMPTY`, 409) nếu còn vị trí có hàng; nút mờ đi kèm lý do.

### Ý nghĩa dữ liệu
- **Mã khu (`code`)** — định danh kỹ thuật nằm trong mã ô (`HCM01-A-A01-01`), **không đổi được**.
- **Biệt danh (`name`)** — tên gọi quen, đổi qua nút "Đặt tên".
- **Kệ** — đọc thẳng từ bảng `warehouse_shelves` (không suy ra từ ô), nên kệ chưa có ô vẫn hiện.

### API
| Method | Endpoint |
|---|---|
| GET | `/locations`, `/locations/zones`, `/locations/shelves`, `/locations/:id/history` |
| POST | `/locations/zones`, `/locations/shelves`, `/locations/layers`, `/locations/sync-matrix` |
| PATCH | `/locations/zones/:id` (đổi biệt danh), `/locations/shelves/reorder` |
| PUT | `/locations/zones/:id/layout` |
| DELETE | `/locations/zones/:id`, `/locations/shelf/:shelfId`, `/locations/layer` |

---

## 6. Lô hàng (`/batches`)

### Tổng quan
Danh sách lô hàng, sinh tự động khi **xác nhận phiếu nhập**. Mỗi lô gắn một sản phẩm, một nhà cung cấp, một hạn dùng.

### Thông báo / Cảnh báo
- Trạng thái lô: `ACTIVE` / `NEAR_EXPIRY` / `EXPIRED` / `BLOCKED` / `DEPLETED`.
- Ràng buộc khi nhập theo lô: `BATCH_REQUIRED`, `EXPIRY_DATE_REQUIRED`, `BATCH_VARIANT_MISMATCH` (lô sai sản phẩm), `BATCH_EXPIRED`, `BATCH_NOT_RECEIVABLE` (lô EXPIRED/BLOCKED).

### Ý nghĩa dữ liệu — **ba ngày, mỗi ngày một mục đích**
- **Ngày sản xuất (`manufacture_date`)** — ngày đóng lô, in trên bao bì.
- **Ngày nhập kho (`received_date`)** — dùng cho xuất **FIFO**.
- **Hạn sử dụng (`expiry_date`)** — dùng cho xuất **FEFO** và cảnh báo cận hạn.

### API
| Method | Endpoint |
|---|---|
| GET | `/batches` |
| PUT | `/batches/:id` |

---

## 7. Kiểm kê (`/stock-counts`)

### Tổng quan
Đếm thực tế tồn kho và đối chiếu với số hệ thống. Vòng đời: **DRAFT → IN_PROGRESS → SUBMITTED → APPROVED**, có nhánh **Trả về sửa** đưa phiếu từ SUBMITTED về IN_PROGRESS.

**Quan trọng:** Duyệt phiếu kiểm kê **chưa trừ tồn** — nó chỉ sinh một **phiếu điều chỉnh** ở trạng thái Chờ xử lý; phải duyệt tiếp phiếu đó (màn Chứng từ) thì tồn mới đổi.

### Thông báo / Cảnh báo
- Đang IN_PROGRESS sửa được mọi dòng; dòng đã lưu đánh dấu `✓ Đã đếm`, nút `Lưu lại`.
- Gửi duyệt xong khóa; muốn sửa thì người duyệt **Trả về sửa** kèm lý do.
- Ô Lý do chỉ mở khi dòng thực sự lệch.
- Cột Lệch tô màu: âm đỏ, dương xanh.

### Ý nghĩa dữ liệu
- **Hệ thống / Thực tế / Lệch** — số sổ sách, số đếm, chênh lệch.
- **Phạm vi** — Toàn kho / Khu / Kệ / Vị trí / SKU / Danh mục.

### API
| Method | Endpoint |
|---|---|
| GET/POST | `/stock-counts`, `/stock-counts/:id/items` |
| PATCH | `/stock-counts/:id/items/:itemId/count` |
| POST | `/stock-counts/:id/start|submit|reject|approve` |

---

## 8. Nhận nhanh (`/quick-receive`)

### Tổng quan
Quét QR/SKU sản phẩm + QR/mã vị trí + số lượng để cộng tồn trong một thao tác, không cần lập phiếu nhập đầy đủ.

### Thông báo / Cảnh báo
- Không tìm thấy sản phẩm (`PRODUCT_NOT_FOUND`) / vị trí (`LOCATION_NOT_FOUND`).
- Sản phẩm **theo dõi hạn** mà bỏ trống ô Hạn dùng → `EXPIRY_DATE_REQUIRED`. Sản phẩm **theo dõi lô** được **tự sinh số lô** nếu không nhập — để FEFO và cảnh báo cận hạn luôn lần được.
- Sản phẩm chưa có trong danh mục: đề nghị tạo nhanh ngay tại chỗ.

### Ý nghĩa dữ liệu
- **QR sản phẩm** — nhận qua `sku`, `barcode` hoặc `id`.
- **QR vị trí** — nhận qua `code`, `qr_code_value` hoặc `id`.

### API
| Method | Endpoint |
|---|---|
| POST | `/stock/quick-receive` |
| POST | `/catalog/products` (tạo nhanh khi chưa có sản phẩm) |

---

## 9. Chuyển kho (`/transfers`)

### Tổng quan
Chuyển hàng giữa hai vị trí. Vòng đời: **DRAFT → CONFIRMED**, có thể **đảo phiếu**.

### Thông báo / Cảnh báo
- Xác nhận khi nguồn không đủ tồn → `INSUFFICIENT_STOCK`.
- Đảo phiếu hoàn tồn về nguồn và trừ ở đích.

### Ý nghĩa dữ liệu
- **Ô nguồn / Ô đích (`source_location_id` / `destination_location_id`)**, **Số lượng**, **Lô (`batch_id`)** giữ nguyên khi chuyển.

### API
| Method | Endpoint |
|---|---|
| GET/POST | `/stock-transfers`, `/stock/current`, `/locations` |
| POST | `/stock-transfers/:id/confirm|reverse` |

---

## 10. Nhân viên (`/employees`)

### Tổng quan
Quản lý tài khoản nhân viên và vai trò.

### Thông báo / Cảnh báo
- **Không xóa tài khoản** — mọi phiếu và `audit_logs` trỏ tới người tạo/duyệt. Thay bằng **Ngưng / Bật lại**: tài khoản ngưng không đăng nhập được nhưng lịch sử vẫn nguyên.
- **Đặt lại mật khẩu**: cấp **mã dùng một lần** để nhân viên tự đặt; quản trị viên không xem/đặt hộ mật khẩu.

### Ý nghĩa dữ liệu
- **Vai trò** — ADMIN / WAREHOUSE_MANAGER / STAFF / AUDITOR.
- **Trạng thái** — Đang hoạt động / Ngưng hoạt động.

### API
| Method | Endpoint |
|---|---|
| GET/POST | `/auth/users` |
| PUT | `/auth/users/:id` |
| POST | `/auth/password-reset/request` (cấp mã đặt lại) |

---

## 11. Phân quyền (`/authorization`)

### Tổng quan
Xem và gán quyền cho từng vai trò. Quyền nhóm theo module.

### Thông báo / Cảnh báo
- Sau khi đổi quyền, nhân viên cần **đăng xuất và đăng nhập lại** để token cập nhật.

### Ý nghĩa dữ liệu
- **Tên quyền và nhóm** hiển thị tiếng Việt; **mã quyền** (`stock_adjustments:approve`) giữ tiếng Anh vì backend dùng làm khóa kiểm tra.
- Tên nhóm: Cảnh báo tồn kho, Tài khoản nhân viên, Phân quyền, Phiếu nhập/xuất/chuyển/điều chỉnh, Kiểm kê, Thông báo, Tham số hệ thống, Kho hàng.

### API
| Method | Endpoint |
|---|---|
| GET | `/authorization`, `/authorization/permissions` |
| PUT | `/authorization/roles/:roleId/permissions` |

---

## 12. Kho hàng (`/warehouses`)

### Tổng quan
Quản lý danh mục kho (chi nhánh).

### Ý nghĩa dữ liệu
- **Mã kho (`code`)** — ví dụ `KHO-HCM-01`; là gốc của tiền tố mã ô (`HCM01-...`).
- **Tên**, **Trạng thái**.

### API
| Method | Endpoint |
|---|---|
| GET/POST | `/warehouses` |
| PUT/DELETE | `/warehouses/:id` |

---

## 13. Nhà cung cấp (`/partners`)

### Tổng quan
Quản lý nhà cung cấp, dùng khi lập phiếu nhập.

### Ý nghĩa dữ liệu
- **Mã (`code`)**, **Tên**, **Người liên hệ**, **Điện thoại**, **Email**.

### API
| Method | Endpoint |
|---|---|
| GET/POST | `/suppliers` |
| PUT | `/suppliers/:id` |

---

## 14. Các trang chỉ đọc

| Trang | URL | Nội dung | API |
|---|---|---|---|
| Bảng điều khiển | `/dashboard` | Tổng quan số liệu | các endpoint report/stock |
| Báo cáo | `/reports` | Báo cáo tồn kho theo bộ lọc | `/reports/...` |
| Cảnh báo | `/alerts` | Cảnh báo tồn thấp / cận hạn | `/alerts`, `/alerts/:id` (patch) |
| Thông báo | `/notifications` | Thông báo hệ thống | `/notifications`, `/notifications/read-all` |
| Nhật ký thao tác | `/audit-logs` | Lịch sử thao tác | `/audit-logs` |
| Lịch sử giao dịch tồn | `/inventory-transactions` | Mọi biến động tồn | `/inventory-transactions` |
| Tệp đính kèm | `/attachments` | File đính kèm chứng từ | `/attachments` |
| Cài đặt | `/settings` | Tham số hệ thống | `/settings`, `/settings/:id` |

> Các endpoint ghi (POST/PUT/PATCH/DELETE) đều yêu cầu đăng nhập; nhiều endpoint còn gắn `requirePermission`. Chi tiết quyền xem README từng module ở `backend/src/modules/*/README.md`.
