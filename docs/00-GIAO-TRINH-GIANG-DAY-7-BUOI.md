# 📚 GIÁO TRINH GIẢNG DẠY CẤP TỐC 7 BUỔI - BẢO VỆ ĐỒ ÁN BAMBI WMS

**Tác giả:** Senior Software Architect & IT Lecturer  
**Đối tượng:** Sinh viên / Lập trình viên sử dụng AI phát triển dự án Bambi WMS cần làm chủ 100% mã nguồn và tự tin bảo vệ đồ án trước Hội đồng.

---

## 📌 MỤC LỤC GIÁO TRÌNH
- [Buổi 1: Kiến trúc Hệ thống Modular Express, Layered Architecture & Request Flow](#buổi-1-kiến-trúc-hệ-thống-modular-express-layered-architecture--request-flow)
- [Buổi 2: Thiết kế Database MySQL, Connection Pool & Type Safety với Zod DTO](#buổi-2-thiết-kế-database-mysql-connection-pool--type-safety-với-zod-dto)
- [Buổi 3: Quản lý Sơ đồ Vị trí Kho (Location Grid) & Kỹ thuật Quét mã QR Quick Receive](#buổi-3-quản-lý-sơ-đồ-vị-trí-kho-location-grid--kỹ-thuật-quét-mã-qr-quick-receive)
- [Buổi 4: Quy trình Nhập - Xuất Kho & Thuật toán Phân bổ Tồn kho FEFO/FIFO](#buổi-4-quy-trình-nhập---xuất-kho--thuật-toán-phân-bổ-tồn-kho-fefofifo)
- [Buổi 5: Xử lý Đồng thời (Concurrency), Khóa `FOR UPDATE`, Optimistic Versioning & Engine Đảo ngược Giao dịch (Reversal Engine)](#buổi-5-xử-lý-đồng-thời-concurrency-khóa-for-update-optimistic-versioning--engine-đảo-ngược-giao-dịch-reversal-engine)
- [Buổi 6: Kiểm kê, Điều chỉnh Tồn kho, Báo cáo Thống kê & Nhật ký Truy vết (Audit Logging)](#buổi-6-kiểm-kê-điều-chỉnh-tồn-kho-báo-cáo-thống-kê--nhật-ký-truy-vết-audit-logging)
- [Buổi 7: Bảo mật Đa tầng (JWT, Password Hashing, RBAC, Rate Limit) & Kịch bản Mock Defense 10 Phút](#buổi-7-bảo-mật-đa-tầng-jwt-password-hashing-rbac-rate-limit--kịch-bản-mock-defense-10-phút)

---

## Buổi 1: Kiến trúc Hệ thống Modular Express, Layered Architecture & Request Flow

### 1. Mục tiêu bài học
- Nắm vững kiến trúc tổng quan **Client-Server** giữa React Vite Frontend và Express TypeScript Backend.
- Hiểu rõ mô hình phân tầng **Layered Modular Architecture**: `Route` ➔ `Middleware` ➔ `Controller` ➔ `Service` ➔ `Repository` ➔ `Database`.
- Giải thích được luồng dữ liệu 1 request từ lúc người dùng bấm nút trên màn hình React đến khi ghi nhận thành công vào Database.

### 2. Lý thuyết cốt lõi (Ẩn dụ thực tế)
> 💡 **Ẩn dụ:** Hãy hình dung Backend Bambi WMS như một **Nhà Hàng Cao Cấp**:
> - **Route (`*.routes.ts`):** Như Menu món ăn. Định nghĩa khách hàng được gọi món nào (HTTP Method GET/POST/PUT/DELETE) tại địa chỉ nào (`/warehouses`, `/stock`).
> - **Middleware (`verifyToken`, `requirePermission`):** Bảo vệ tại cửa kiểm tra vé và thẻ VIP của khách trước khi vào bàn.
> - **Controller (`*.controller.ts`):** Phục vụ bàn (Waiter). Tiếp nhận order, kiểm tra định dạng dữ liệu (bát đĩa sạch sẽ via Zod validation), trả về món ăn (JSON response) hoặc báo lỗi HTTP Status code (400, 401, 403, 404, 500).
> - **Service (`*.service.ts`):** Bếp trưởng (Head Chef). Nắm giữ công thức nghiệp vụ kinh doanh (FEFO, tính tổng tiền, validate logic kho), không quan tâm bàn ăn bố trí ra sao.
> - **Repository (`*.repository.ts`):** Phụ bếp chui vào kho lấy nguyên liệu. Trực tiếp viết câu lệnh SQL lấy/chèn dữ liệu vào DB MySQL.

### 3. Dẫn chứng Mã nguồn Thực tế (File & Code Line)
- **Đăng ký Router chính:** [backend/src/app.ts:L74-L96](file:///c:/source/lv-nhu/luanvan2026/backend/src/app.ts#L74-L96)
  ```typescript
  app.use('/auth', authModule);
  app.use('/warehouses', warehousesModule);
  app.use('/goods-receipts', goodsReceiptsModule);
  ```
- **Phân tầng Route -> Middleware -> Controller:** [backend/src/modules/goods-receipts/goods-receipts.routes.ts:L16-L32](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/goods-receipts/goods-receipts.routes.ts#L16-L32)
  ```typescript
  goodsReceiptsRouter.post(
    '/:id/confirm',
    asyncHandler(verifyToken),
    requirePermission('goods_receipts:confirm'),
    asyncHandler(confirmGoodsReceiptController),
  );
  ```
- **Controller bóc tách Request body & Trả JSON:** [backend/src/modules/goods-receipts/goods-receipts.controller.ts:L33-L45](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/goods-receipts/goods-receipts.controller.ts#L33-L45)

### 4. Câu hỏi Củng cố & Bài tập thực hành
- **Câu hỏi:** Tại sao không viết SQL trực tiếp trong Controller mà phải tách thành Service và Repository?
  - *Đáp:* Để tách biệt trách nhiệm (Separation of Concerns). Controller lo giao tiếp HTTP, Repository lo kết nối DB. Service chứa nghiệp vụ logic có thể tái sử dụng hoặc viết Unit Test độc lập không cần chạy server web.
- **Bài tập:** Trace đường đi của request `GET /api/stock` từ `frontend/src/features/stock/services/stock.service.ts` đến `backend/src/modules/stock/stock.repository.ts`.

---

## Buổi 2: Thiết kế Database MySQL, Connection Pool & Type Safety với Zod DTO

### 1. Mục tiêu bài học
- Nắm vững cấu trúc 20+ bảng dữ liệu chuẩn hóa trong [warehouse_management_mysql.sql](file:///c:/source/lv-nhu/luanvan2026/backend/warehouse_management_mysql.sql).
- Hiểu cơ chế **Connection Pool** của `mysql2/promise` giúp tối ưu hóa hiệu năng mở kết nối database.
- Hiểu vai trò của **Zod Schema (Data Transfer Object - DTO)** trong việc chặn đứng dữ liệu rác từ client ngay tại tầng Controller.

### 2. Lý thuyết cốt lõi (Ẩn dụ thực tế)
> 💡 **Ẩn dụ Connection Pool:** Kết nối đến database MySQL tốn rất nhiều chi phí bắt tay (TCP Handshake, Auth). Giống như việc bạn gọi xe taxi. Nếu mỗi lần di chuyển lại bắt taxi từ bãi xe xa, bạn sẽ mất thời gian chờ. **Connection Pool** tạo sẵn một đội xe taxi đậu sẵn ở cổng (VD: 10 xe). Khi có Request, chỉ việc lấy 1 xe dùng xong trả về pool.

### 3. Dẫn chứng Mã nguồn Thực tế (File & Code Line)
- **Tạo Database Connection Pool:** [backend/src/database/db.ts:L4-L11](file:///c:/source/lv-nhu/luanvan2026/backend/src/database/db.ts#L4-L11)
  ```typescript
  export const db = mysql.createPool({
    uri: config.databaseUrl,
    waitForConnections: true,
    connectionLimit: config.dbConnectionLimit,
    namedPlaceholders: true,
  });
  ```
- **Lược đồ Bảng Người Dùng & Phân Quyền (RBAC):** [backend/warehouse_management_mysql.sql:L21-L72](file:///c:/source/lv-nhu/luanvan2026/backend/warehouse_management_mysql.sql#L21-L72)
- **Validation Schema bằng Zod:** [backend/src/modules/goods-receipts/goods-receipts.validation.ts:L12-L35](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/goods-receipts/goods-receipts.validation.ts#L12-L35)

### 4. Câu hỏi Củng cố & Bài tập thực hành
- **Câu hỏi:** `namedPlaceholders: true` trong MySQL Pool giúp ích gì cho bảo mật và phát triển?
  - *Đáp:* Giúp truyền tham số câu lệnh SQL theo dạng `:paramName` thay vì dấu `?`, tăng tính rõ ràng và phòng chống triệt để lỗ hổng **SQL Injection**.
- **Bài tập:** Tìm bảng `stock_locations` trong SQL và giải thích ý nghĩa của trường `version` và khóa ngoại `(product_variant_id, location_id, batch_id)`.

---

## Buổi 3: Quản lý Sơ đồ Vị trí Kho (Location Grid) & Kỹ thuật Quét mã QR Quick Receive

### 1. Mục tiêu bài học
- Hiểu mô hình phân cấp không gian kho: `Warehouse` (Kho) ➔ `Zone` (Khu) ➔ `Shelf` (Kệ) ➔ `Location` (Vị trí/Ô chứa).
- Nắm vững tính năng độc đáo **Quét QR Code / Barcode Quick Receive** giúp thủ kho nhập hàng siêu tốc không cần thao tác nhiều bước thủ công.

### 2. Lý thuyết cốt lõi (Ẩn dụ thực tế)
> 💡 **Ẩn dụ:** Quản lý vị trí kho Bambi WMS như **Định vị Tòa nhà chung cư**:
> - **Warehouse:** Tòa nhà A.
> - **Zone:** Tầng 3 (Khu đồ sơ sinh).
> - **Shelf:** Dãy kệ số 5.
> - **Location:** Căn hộ 305-B (Mã QR duy nhất). Khi sản phẩm dán mã SKU quét vào ô 305-B, hệ thống lập tức map đúng vị trí thể lý.

### 3. Dẫn chứng Mã nguồn Thực tế (File & Code Line)
- **Hàm Xử lý Quét QR Quick Receive trong Repository:** [backend/src/modules/stock/stock.repository.ts:L171-L339](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L171-L339)
- **Chuẩn hóa giá trị từ Máy quét QR/Barcode:** [backend/src/modules/stock/stock.repository.ts:L32-L54](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L32-L54)
- **Giao diện Frontend Quick Receive:** [frontend/src/features/quick-receive/pages/QuickReceivePage.tsx:L1-L120](file:///c:/source/lv-nhu/luanvan2026/frontend/src/features/quick-receive/pages/QuickReceivePage.tsx#L1-L120)

### 4. Câu hỏi Củng cố & Bài tập thực hành
- **Câu hỏi:** Hàm `normalizeScanValue` xử lý được những định dạng quét mã nào?
  - *Đáp:* Xử lý được cả chuỗi thô (SKU / Barcode / Location Code) và đối tượng JSON được mã hóa trong mã QR chứa các trường `sku`, `code`, `id`.

---

## Buổi 4: Quy trình Nhập - Xuất Kho & Thuật toán Phân bổ Tồn kho FEFO/FIFO

### 1. Mục tiêu bài học
- Nắm vững vòng đời của Phiếu Nhập Kho (Goods Receipt) và Phiếu Xuất Kho (Goods Issue): `DRAFT` (Nháp) ➔ `CONFIRMED` (Xác nhận) ➔ `REVERSED` (Đã hoàn tác).
- Thấu hiểu thuật toán **FEFO (First Expired, First Out - Hàng hết hạn trước xuất trước)** và **FIFO (First In, First Out - Hàng nhập trước xuất trước)** dành cho ngành Mẹ & Bé (Sữa, Tã, Thực phẩm chức năng).

### 2. Lý thuyết cốt lõi (Ẩn dụ thực tế)
> 💡 **Ẩn dụ FEFO trong Siêu thị:** Khi bạn mua Sữa tươi, nhân viên siêu thị luôn xếp các hộp sữa có ngày hết hạn gần nhất ra ngoài cùng của kệ để bán trước. Thuật toán `FEFO` tự động quét các lô hàng `product_batches` theo thứ tự `expiry_date ASC` để gợi ý xuất kho lô sữa sắp hết hạn nhất.

### 3. Dẫn chứng Mã nguồn Thực tế (File & Code Line)
- **Thuật toán Sắp xếp FEFO vs FIFO trong SQL:** [backend/src/modules/stock/stock.repository.ts:L59-L76](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L59-L76)
  ```typescript
  function allocationOrderBy(strategy: AllocationStrategy): string {
    if (strategy === 'FEFO') {
      return `
        CASE WHEN pb.expiry_date IS NULL THEN 1 ELSE 0 END,
        pb.expiry_date ASC,
        pb.received_date ASC,
        pb.id ASC
      `;
    }
    return `CASE WHEN pb.received_date IS NULL THEN 1 ELSE 0 END, pb.received_date ASC`;
  }
  ```
- **Vòng lặp Phân bổ Tồn kho trong Service:** [backend/src/modules/stock/stock.service.ts:L31-L103](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.service.ts#L31-L103)
- **Xác nhận Phiếu Nhập Kho (Goods Receipt Confirmation):** [backend/src/modules/goods-receipts/goods-receipts.service.ts:L45-L110](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/goods-receipts/goods-receipts.service.ts#L45-L110)

### 4. Câu hỏi Củng cố & Bài tập thực hành
- **Câu hỏi:** Điều gì xảy ra khi số lượng tồn kho khả dụng không đủ cho phiếu xuất hàng theo chiến lược FEFO?
  - *Đáp:* Service sẽ throw `HttpError(409, 'INSUFFICIENT_STOCK')` và toàn bộ giao dịch bị hủy bỏ (Rollback).

---

## Buổi 5: Xử lý Đồng thời (Concurrency), Khóa `FOR UPDATE`, Optimistic Versioning & Engine Đảo ngược Giao dịch (Reversal Engine)

### 1. Mục tiêu bài học
- Làm chủ kỹ thuật xử lý tranh chấp dữ liệu khi nhiều thủ kho cùng xuất/nhập 1 mặt hàng cùng 1 giây.
- Phân biệt và giải thích được việc phối hợp giữa **Bi quan (Pessimistic Locking `FOR UPDATE`)** và **Lạc quan (Optimistic Versioning `version = version + 1`)**.
- Nắm vững **Idempotent Reversal Engine** - Cơ chế hoàn tác giao dịch kho không bao giờ xóa dữ liệu gốc (Immutable Audit Ledger).

### 2. Lý thuyết cốt lõi (Ẩn dụ thực tế)
> 💡 **Ẩn dụ Rút tiền ATM:** 
> - **Pessimistic Lock (`FOR UPDATE`):** Bạn đút thẻ vào ATM, cây ATM lập tức khóa tài khoản của bạn lại không cho bất kỳ ứng dụng Banking Phone nào chuyển tiền đi cho đến khi ATM xử lý xong giao dịch.
> - **Optimistic Lock (`version`):** Hai người cùng sửa 1 file Google Doc. Ai bấm Save trước thì bản ghi tăng phiên bản lên v2. Người bấm Save sau đang giữ bản v1 sẽ bị từ chối và báo lỗi xung đột (Concurrent Update).
> - **Reversal Engine:** Như kế toán ngân hàng. Khi bấm "Hủy giao dịch", kế toán không lấy cục tẩy xóa dòng nhật ký cũ mà ghi một dòng mới đối ứng âm/dương để tổng số dư quay lại ban đầu.

### 3. Dẫn chứng Mã nguồn Thực tế (File & Code Line)
- **Pessimistic Locking `FOR UPDATE` trong Reversal Engine:** [backend/src/common/inventory/reversal.repository.ts:L82-L105](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/inventory/reversal.repository.ts#L82-L105)
- **Optimistic Versioning `version = version + 1`:** [backend/src/common/inventory/reversal.repository.ts:L210-L222](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/inventory/reversal.repository.ts#L210-L222)
  ```sql
  UPDATE stock_locations
  SET quantity = ?, version = version + 1
  WHERE id = ? AND ? >= 0
  ```
- **Tạo Giao dịch Hoàn tác `REVERSAL`:** [backend/src/common/inventory/reversal.repository.ts:L224-L263](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/inventory/reversal.repository.ts#L224-L263)

### 4. Câu hỏi Củng cố & Bài tập thực hành
- **Câu hỏi:** Tại sao Bambi WMS chọn không dùng `DELETE` để xóa phiếu xuất/nhập kho bị sai?
  - *Đáp:* Để đảm bảo tính toàn vẹn tài chính và khả năng kiểm toán (Auditability). Mọi biến động kho phải lưu lịch sử không thể thay đổi (Immutable History).

---

## Buổi 6: Kiểm kê, Điều chỉnh Tồn kho, Báo cáo Thống kê & Nhật ký Truy vết (Audit Logging)

### 1. Mục tiêu bài học
- Nắm vững quy trình kiểm kê định kỳ (Stock Count) và cân bằng kho (Stock Adjustment).
- Hiểu cơ chế **Audit Logger (`insertAuditLog`)** giúp lưu vết mọi hành động tạo, sửa, xóa, xác nhận của nhân viên trong hệ thống.

### 2. Lý thuyết cốt lõi (Ẩn dụ thực tế)
> 💡 **Ẩn dụ Hộp Đen Máy Bay:** Audit Log như hộp đen máy bay. Mỗi khi có sự cố mất mát hàng hóa hoặc sửa số lượng kho bất thường, người quản lý chỉ cần mở `audit_logs` ra để xem chính xác `user_id` nào đã làm gì, vào thời điểm nào, giá trị cũ `old_values` và giá trị mới `new_values` là gì.

### 3. Dẫn chứng Mã nguồn Thực tế (File & Code Line)
- **Hàm ghi Nhật ký Truy vết Audit Log (JSON format):** [backend/src/common/audit/audit.repository.ts:L13-L40](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/audit/audit.repository.ts#L13-L40)
- **Tạo đợt Kiểm kê Kho:** [backend/src/modules/stock-counts/stock-counts.service.ts:L20-L60](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock-counts/stock-counts.service.ts#L20-L60)
- **Truy vấn Báo cáo Tồn kho & Xuất nhập tồn:** [backend/src/modules/reports/reports.repository.ts:L1-L100](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/reports/reports.repository.ts#L1-L100)

### 4. Câu hỏi Củng cố & Bài tập thực hành
- **Câu hỏi:** Cột `old_values` và `new_values` trong bảng `audit_logs` có kiểu dữ liệu gì trong SQL và mang lại lợi ích gì?
  - *Đáp:* Kiểu dữ liệu `JSON`, cho phép lưu trữ động cấu trúc dữ liệu của bất kỳ bảng nào mà không cần tạo thêm nhiều cột tĩnh.

---

## Buổi 7: Bảo mật Đa tầng (JWT, Password Hashing, RBAC, Rate Limit) & Kịch bản Mock Defense 10 Phút

### 1. Mục tiêu bài học
- Nắm vững kiến trúc bảo mật 4 lớp của hệ thống:
  1. **Password Hashing:** Bcrypt hash muối chống cầu bốc mật khẩu.
  2. **Authentication:** Stateless JWT Access Token + Stateful Refresh Token Session đảo ngược khi logout.
  3. **Authorization:** Role-Based Access Control (RBAC Middleware).
  4. **DoS Protection:** Rate Limiting chống spam brute-force login.
- Luyện tập **Kịch bản Thuyết trình & Phản biện 10 Phút** gây ấn tượng mạnh với Hội đồng.

### 2. Lý thuyết cốt lõi (Ẩn dụ thực tế)
> 💡 **Ẩn dụ Sân Bay Quốc Tế:**
> - **Login:** Xuất trình Hộ chiếu ➔ Nhận Vé máy bay (Access Token 15 phút) + Thẻ thành viên (Refresh Token 7 ngày).
> - **Access Token:** Như Vé máy bay qua cửa an ninh. Nhẹ, chứa thông tin ghế/quyền, không cần tra sổ sách.
> - **Refresh Token Session (`user_sessions`):** Đậu trên sổ cái hệ thống. Khi muốn hủy thẻ chỉ cần khóa trong DB (`revoked_at`).
> - **Rate Limit:** Cổng xoay an ninh chỉ cho phép 1 người qua mỗi 3 giây. Nếu đâm sầm vào 10 lần sẽ bị khóa cổng 15 phút.

### 3. Dẫn chứng Mã nguồn Thực tế (File & Code Line)
- **Bảo mật Đăng nhập Chống Brute-force:** [backend/src/common/middleware/rate-limit.middleware.ts:L59-L64](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/middleware/rate-limit.middleware.ts#L59-L64)
- **Tạo Token Pair & Lưu Session:** [backend/src/modules/auth/auth.service.ts:L88-L109](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/auth/auth.service.ts#L88-L109)
- **Middleware Phân quyền RBAC:** [backend/src/common/middleware/require-permission.middleware.ts:L4-L22](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/middleware/require-permission.middleware.ts#L4-L22)

### 4. Kịch bản Thuyết trình 10 Phút "Ăn Điểm" trước Hội đồng
1. **Phút 0-2:** Giới thiệu bài toán Quản lý Kho Mẹ & Bé (Sữa, Tã có hạn dùng) & Kiến trúc Express TypeScript + React Vite.
2. **Phút 2-4:** Demo Nhập kho siêu tốc bằng quét mã QR Quick Receive.
3. **Phút 4-6:** Trình diễn thuật toán phân bổ xuất kho FEFO (First Expired, First Out) tự động bốc lô sữa sắp hết hạn.
4. **Phút 6-8:** Giải trình cơ chế bảo vệ đồng thời `FOR UPDATE` + Optimistic Locking và Engine Hoàn tác giao dịch `REVERSAL`.
5. **Phút 8-10:** Trình diễn hệ thống Bảo mật RBAC, Audit Log và kết luận.
