# 🎯 100 CÂU HỎI PHẢN BIỆN CHUYÊN SÂU & ĐÁP ÁN MẪU - ĐỒ ÁN BAMBI WMS

**Tác giả:** Senior Software Architect & IT Lecturer  
**Mục tiêu:** Cung cấp 100 câu hỏi "xoáy" nhất của Hội đồng Bảo vệ Đồ án tốt nghiệp / Phản biện phần mềm, kèm câu trả lời chuẩn IT chuyên nghiệp và **đường dẫn minh chứng dòng code chính xác trong 5 giây**.

---

## 📌 BẢNG THỐNG KÊ 5 CHUYÊN ĐỀ PHẢN BIỆN
- [Chuyên đề 1: Kiến trúc Phần mềm & Design Patterns (Câu 01 - 20)](#chuyên-đề-1-kiến-trúc-phần-mềm--design-patterns)
- [Chuyên đề 2: Cơ sở Dữ liệu, Giao dịch & Khóa Đồng thời Concurrency (Câu 21 - 40)](#chuyên-đề-2-cơ-sở-dữ-liệu-giao-dịch--khóa-đồng-thời-concurrency)
- [Chuyên đề 3: Nghiệp vụ Quản lý Kho & Thuật toán FEFO/FIFO/QR (Câu 41 - 60)](#chuyên-đề-3-nghiệp-vụ-quản-lý-kho--thuật-toán-fefofifoqr)
- [Chuyên đề 4: Bảo mật, Xác thực JWT & Phân quyền RBAC (Câu 61 - 80)](#chuyên-đề-4-bảo-mật-xác-thực-jwt--phân-quyền-rbac)
- [Chuyên đề 5: Xử lý Lỗi, Hiệu năng, Kiểm thử & Mở rộng Scalability (Câu 81 - 100)](#chuyên-đề-5-xử-lý-lỗi-hiệu-năng-kiểm-thử--mở-rộng-scalability)

---

## Chuyên đề 1: Kiến trúc Phần mềm & Design Patterns

#### Q01: Em hãy giải thích tổng quan kiến trúc backend của hệ thống?
- **Trả lời mẫu:** Backend sử dụng kiến trúc **Layered Modular Architecture** trên nền Express và TypeScript. Mỗi miền nghiệp vụ (như `stock`, `auth`, `goods-receipts`) là một module độc lập chứa Route, Controller, Service, Repository và Validation DTO riêng.
- **Minh chứng code:** [backend/src/app.ts:L74-L96](file:///c:/source/lv-nhu/luanvan2026/backend/src/app.ts#L74-L96)

#### Q02: Tại sao dự án không sử dụng các ORM phổ biến như Prisma hay TypeORM mà lại viết MySQL query trực tiếp?
- **Trả lời mẫu:** Việc dùng `mysql2/promise` kết hợp `namedPlaceholders` giúp kiểm soát 100% hiệu năng câu lệnh SQL, tránh các vấn đề N+1 query của ORM và tận dụng các câu lệnh nâng cao như `FOR UPDATE`, `ON DUPLICATE KEY UPDATE` và Window Functions trong MySQL 8.
- **Minh chứng code:** [backend/src/database/db.ts:L4-L11](file:///c:/source/lv-nhu/luanvan2026/backend/src/database/db.ts#L4-L11)

#### Q03: Tầng Controller đóng vai trò gì và có chứa logic nghiệp vụ không?
- **Trả lời mẫu:** Controller chỉ đóng vai trò giao tiếp HTTP: tiếp nhận Request, chuyển qua Zod schema để validate tham số, gọi xuống Service layer xử lý và trả về HTTP Response (Status 200, 201, 400, 500). Controller **hoàn toàn không chứa logic nghiệp vụ**.
- **Minh chứng code:** [backend/src/modules/goods-receipts/goods-receipts.controller.ts:L33-L45](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/goods-receipts/goods-receipts.controller.ts#L33-L45)

#### Q04: Service Layer giải quyết vấn đề gì trong kiến trúc?
- **Trả lời mẫu:** Service chứa toàn bộ Business Rules (như thuật toán FEFO, kiểm tra tồn kho khả dụng, tính toán trạng thái). Giúp tách rời logic nghiệp vụ khỏi tầng HTTP (Controller) và tầng lưu trữ (Repository), dễ dàng viết Unit Test độc lập.
- **Minh chứng code:** [backend/src/modules/stock/stock.service.ts:L31-L103](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.service.ts#L31-L103)

#### Q05: Pattern Repository được triển khai như thế nào trong dự án?
- **Trả lời mẫu:** Repository đóng vai trò là Data Access Layer. Mọi thao tác truy vấn, chèn, cập nhật SQL đều được cô lập trong các hàm async repository, sử dụng `PoolConnection` của MySQL pool.
- **Minh chứng code:** [backend/src/modules/stock/stock.repository.ts:L78-L105](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L78-L105)

#### Q06: Làm sao để xử lý bất đồng bộ (Asynchronous) sạch sẽ không bị callback hell trong Express?
- **Trả lời mẫu:** Sử dụng `async/await` kết hợp với hàm bọc middleware `asyncHandler`. Bất kỳ lỗi bất đồng bộ nào văng ra (throw) sẽ được tự động bắt và đẩy về Error Handler chung.
- **Minh chứng code:** [backend/src/common/http.ts:L34-L42](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/http.ts#L34-L42)

#### Q07: Dự án quản lý biến môi trường (Environment Variables) như thế nào để đảm bảo không lọt secret?
- **Trả lời mẫu:** Hệ thống đọc file `.env` thông qua module `dotenv` và tập trung toàn bộ cấu hình vào file `config.ts` có type checking rõ ràng. File `.env` được đưa vào `.gitignore`.
- **Minh chứng code:** [backend/src/config/config.ts:L1-L35](file:///c:/source/lv-nhu/luanvan2026/backend/src/config/config.ts#L1-L35)

#### Q08: Làm thế nào frontend React giao tiếp với backend mà không bị chặn CORS?
- **Trả lời mẫu:** Backend cài đặt Middleware CORS động (`Access-Control-Allow-Origin`), đọc danh sách domain cho phép từ cấu hình `.env` (`CORS_ORIGIN`) và hỗ trợ Preflight Request `OPTIONS`.
- **Minh chứng code:** [backend/src/app.ts:L37-L64](file:///c:/source/lv-nhu/luanvan2026/backend/src/app.ts#L37-L64)

#### Q09: Frontend tổ chức cấu trúc thư mục theo mô hình nào?
- **Trả lời mẫu:** Frontend áp dụng mô hình **Feature-based Architecture**. Mỗi tính năng (như `auth`, `products`, `stock`, `quick-receive`) tự đóng gói `pages`, `components`, `services`, `types` riêng.
- **Minh chứng code:** [frontend/src/app/router/AppRouter.tsx:L4-L25](file:///c:/source/lv-nhu/luanvan2026/frontend/src/app/router/AppRouter.tsx#L4-L25)

#### Q10: Tại sao Frontend lại sử dụng Lazy Loading (`React.lazy`) cho các Route?
- **Trả lời mẫu:** Để tối ưu **Code Splitting**. Người dùng mở trang nào thì browser mới tải file JavaScript Bundle của trang đó, giúp giảm thời gian tải trang ban đầu (First Contentful Paint).
- **Minh chứng code:** [frontend/src/app/router/AppRouter.tsx:L4-L25](file:///c:/source/lv-nhu/luanvan2026/frontend/src/app/router/AppRouter.tsx#L4-L25)

#### Q11: Lớp HTTP Client ở Frontend xử lý tự động đính kèm Token đăng nhập như thế nào?
- **Trả lời mẫu:** Sử dụng **Axios Interceptor** để tự động chèn chuỗi `Authorization: Bearer <token>` vào Header của mọi API request outbound.
- **Minh chứng code:** [frontend/src/shared/api/httpClient.ts:L1-L40](file:///c:/source/lv-nhu/luanvan2026/frontend/src/shared/api/httpClient.ts#L1-L40)

#### Q12: Data Transfer Object (DTO) được validate ở tầng nào?
- **Trả lời mẫu:** Validate ngay tại Middleware/Controller của Backend bằng thư viện Zod. Nếu dữ liệu client gửi lên sai kiểu (như quantity < 0 hoặc email không đúng định dạng), Zod ném ra lỗi 400 Bad Request ngay lập tức.
- **Minh chứng code:** [backend/src/modules/stock/stock.validation.ts:L1-L40](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.validation.ts#L1-L40)

#### Q13: Thiết kế API của dự án có tuân theo chuẩn RESTful không?
- **Trả lời mẫu:** Có, API sử dụng đúng danh từ tài nguyên (`/warehouses`, `/goods-receipts`, `/stock`) và các HTTP Verb tương ứng (GET đọc, POST tạo mới, PUT cập nhật toàn bộ, PATCH cập nhật một phần, DELETE xóa).
- **Minh chứng code:** [backend/src/modules/goods-receipts/goods-receipts.routes.ts:L14-L32](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/goods-receipts/goods-receipts.routes.ts#L14-L32)

#### Q14: Tại sao trong ứng dụng không dùng `console.log` để theo dõi Request?
- **Trả lời mẫu:** Dùng Middleware `requestLogger` tạo thông tin truy vết chuyên nghiệp gồm `requestId`, HTTP Method, Url, Status code và thời gian xử lý (ms) để hỗ trợ Debug trong Production.
- **Minh chứng code:** [backend/src/common/middleware/request-context.middleware.ts:L1-L35](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/middleware/request-context.middleware.ts#L1-L35)

#### Q15: Làm thế nào để quản lý các mã lỗi hệ thống nhất quán (Custom Error Handling)?
- **Trả lời mẫu:** Tạo lớp `HttpError` kế thừa từ `Error` nguyên bản của JS, bổ sung `statusCode` (400, 401, 403, 404, 409, 500) và `errorCode` chuẩn định dạng dạng ENUM chuỗi.
- **Minh chứng code:** [backend/src/common/http.ts:L1-L30](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/http.ts#L1-L30)

#### Q16: Dự án triển khai tài liệu OpenAPI/Swagger như thế nào?
- **Trả lời mẫu:** Module `openapi` tích hợp Swagger UI tại đường dẫn `/docs`, đọc cấu hình từ file OpenAPI spec giúp Frontend dev dễ dàng tra cứu API contract.
- **Minh chứng code:** [backend/src/app.ts:L74](file:///c:/source/lv-nhu/luanvan2026/backend/src/app.ts#L74)

#### Q17: Khái niệm Single Source of Truth được áp dụng thế nào trong phân quyền?
- **Trả lời mẫu:** Mọi danh mục quyền hạn (`permissions`) và vai trò (`roles`) đều được định nghĩa tập trung trong Database SQL và gán vào JWT Payload khi đăng nhập.
- **Minh chứng code:** [backend/warehouse_management_mysql.sql:L21-L50](file:///c:/source/lv-nhu/luanvan2026/backend/warehouse_management_mysql.sql#L21-L50)

#### Q18: Dự án mã hóa mật khẩu như thế nào?
- **Trả lời mẫu:** Sử dụng thuật toán `bcryptjs` tạo chuỗi Salt ngẫu nhiên và băm mật khẩu 10 rounds trước khi lưu vào bảng `users`.
- **Minh chứng code:** [backend/src/modules/auth/auth.service.ts:L2-L46](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/auth/auth.service.ts#L2-L46)

#### Q19: Tại sao backend lại ẩn header `x-powered-by`?
- **Trả lời mẫu:** Để tránh tiết lộ thông tin công nghệ backend (Express) cho tin tặc (Security through Obscurity).
- **Minh chứng code:** [backend/src/app.ts:L34](file:///c:/source/lv-nhu/luanvan2026/backend/src/app.ts#L34)

#### Q20: Thành phần `vw_current_stock` trong database có vai trò gì?
- **Trả lời mẫu:** Là một **SQL View** tổng hợp dữ liệu tồn kho hiện tại từ bảng `stock_locations`, `product_variants`, `warehouses` và `product_batches` giúp câu lệnh truy vấn ở backend cực kỳ gọn gàng.
- **Minh chứng code:** [backend/src/modules/stock/stock.repository.ts:L94-L101](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L94-L101)

---

## Chuyên đề 2: Cơ sở Dữ liệu, Giao dịch & Khóa Đồng thời (Concurrency)

#### Q21: Làm thế nào dự án đảm bảo tính nguyên tố (Atomicity) khi nhập kho?
- **Trả lời mẫu:** Sử dụng **Database Transaction** (`connection.beginTransaction()`, `connection.commit()`, `connection.rollback()`). Mọi thao tác cập nhật số lượng kho và ghi log giao dịch phải cùng thành công hoặc cùng thất bại.
- **Minh chứng code:** [backend/src/modules/stock/stock.repository.ts:L181-L335](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L181-L335)

#### Q22: Hiện tượng Race Condition khi 2 thủ kho cùng xuất 1 mặt hàng được xử lý ra sao?
- **Trả lời mẫu:** Kết hợp **Pessimistic Locking (`FOR UPDATE`)** để khóa dòng bản ghi trong lúc đọc và **Optimistic Locking (`version = version + 1`)** khi cập nhật. Nếu version không khớp hoặc tồn kho sau khi trừ < 0, transaction bị hủy.
- **Minh chứng code:** [backend/src/common/inventory/reversal.repository.ts:L82-L105](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/inventory/reversal.repository.ts#L82-L105)

#### Q23: Pessimistic Locking `FOR UPDATE` hoạt động như thế nào trong MySQL InnoDB?
- **Trả lời mẫu:** Khi thực thi `SELECT ... FOR UPDATE` trong transaction, InnoDB đặt **Exclusive Lock (X-Lock)** lên các dòng thỏa điều kiện. Các transaction khác muốn đọc hoặc sửa các dòng này phải chờ cho đến khi transaction đầu tiên `COMMIT` hoặc `ROLLBACK`.
- **Minh chứng code:** [backend/src/modules/stock/stock.repository.ts:L192](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L192)

#### Q24: Khái niệm Optimistic Concurrency Control (OCC) được cài đặt ở đâu?
- **Trả lời mẫu:** Cài đặt ở câu lệnh `UPDATE stock_locations SET quantity = ?, version = version + 1 WHERE id = ? AND ? >= 0`. Nếu số lượng sau cập nhật < 0 hoặc phiên bản bị thay đổi bởi request khác, `affectedRows` trả về 0 và văng lỗi `CONCURRENT_STOCK_UPDATE`.
- **Minh chứng code:** [backend/src/common/inventory/reversal.repository.ts:L210-L222](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/inventory/reversal.repository.ts#L210-L222)

#### Q25: Câu lệnh `ON DUPLICATE KEY UPDATE` giải quyết bài toán gì khi Quick Receive?
- **Trả lời mẫu:** Tránh truy vấn kiểm tra tồn tại (Select-then-Insert race condition). Nếu vị trí kho chưa có sản phẩm/lô hàng đó thì `INSERT`, nếu đã có thì tự động `UPDATE quantity = quantity + values(quantity)` trong 1 câu SQL duy nhất.
- **Minh chứng code:** [backend/src/modules/stock/stock.repository.ts:L268-L274](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L268-L274)

#### Q26: Tại sao các bảng lại có trường `deleted_at` thay vì dùng câu lệnh `DELETE`?
- **Trả lời mẫu:** Sử dụng cơ chế **Soft Delete (Xóa mềm)**. Dữ liệu không bị mất vĩnh viễn khỏi ổ cứng nhằm phục vụ mục đích kiểm toán và khôi phục khi cần, mọi truy vấn nghiệp vụ đều lọc `WHERE deleted_at IS NULL`.
- **Minh chứng code:** [backend/warehouse_management_mysql.sql:L67](file:///c:/source/lv-nhu/luanvan2026/backend/warehouse_management_mysql.sql#L67)

#### Q27: Việc đánh chỉ mục (Index) trong MySQL được tối ưu ra sao?
- **Trả lời mẫu:** Đánh Composite Index trên các cột thường xuyên `JOIN` và `WHERE` như `idx_users_status`, `idx_user_sessions_user`, `idx_goods_receipt_items_receipt_id`.
- **Minh chứng code:** [backend/warehouse_management_mysql.sql:L70-L71](file:///c:/source/lv-nhu/luanvan2026/backend/warehouse_management_mysql.sql#L70-L71)

#### Q28: Khóa ngoại (Foreign Key Constraints) đóng vai trò gì trong đồ án?
- **Trả lời mẫu:** Đảm bảo **Tính toàn vẹn tham chiếu (Referential Integrity)** ở tầng Database Engine. Không thể chèn một phiếu nhập kho có `warehouse_id` không tồn tại.
- **Minh chứng code:** [backend/warehouse_management_mysql.sql:L68-L69](file:///c:/source/lv-nhu/luanvan2026/backend/warehouse_management_mysql.sql#L68-L69)

#### Q29: Tại sao dùng kiểu dữ liệu `DATETIME(3)` thay vì `TIMESTAMP`?
- **Trả lời mẫu:** `DATETIME(3)` hỗ trợ lưu độ chính xác tới mili-giây (3 chữ số thập phân) và có dải thời gian rộng (1000 - 9999), không bị giới hạn năm 2038 như `TIMESTAMP` 32-bit.
- **Minh chứng code:** [backend/warehouse_management_mysql.sql:L27-L29](file:///c:/source/lv-nhu/luanvan2026/backend/warehouse_management_mysql.sql#L27-L29)

#### Q30: Bảng `inventory_transactions` đóng vai trò gì trong hệ thống?
- **Trả lời mẫu:** Đóng vai trò là **Sổ cái Giao dịch Kho (Immutable Ledger)**. Lưu vết mọi biến động tăng/giảm tồn kho kèm `quantity_before` và `quantity_after`. Không bao giờ bị sửa hoặc xóa.
- **Minh chứng code:** [backend/src/common/inventory/reversal.repository.ts:L224-L263](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/inventory/reversal.repository.ts#L224-L263)

#### Q31: Tại sao kết nối MySQL Pool lại đặt `decimalNumbers: true`?
- **Trả lời mẫu:** Mặc định `mysql2` trả kiểu `DECIMAL` dưới dạng chuỗi `string` để tránh mất độ chính xác làm tròn của Floating Point trong JS. Cấu hình này giúp driver ép kiểu sang `number` cho tiện tính toán.
- **Minh chứng code:** [backend/src/database/db.ts:L9](file:///c:/source/lv-nhu/luanvan2026/backend/src/database/db.ts#L9)

#### Q32: Làm thế nào ứng dụng ngắt kết nối MySQL an toàn khi Server tắt (Graceful Shutdown)?
- **Trả lời mẫu:** Gọi hàm `closeDatabasePool()` để giải phóng tất cả các connection đang mở trước khi process Node.js dừng.
- **Minh chứng code:** [backend/src/database/db.ts:L13-L15](file:///c:/source/lv-nhu/luanvan2026/backend/src/database/db.ts#L13-L15)

#### Q33: Sự khác biệt giữa `reference_type` và `transaction_type` là gì?
- **Trả lời mẫu:** `transaction_type` là bản chất biến động (RECEIPT, ISSUE, REVERSAL), còn `reference_type` định danh chứng từ phát sinh (GOODS_RECEIPT, GOODS_ISSUE, QUICK_RECEIVE).
- **Minh chứng code:** [backend/src/common/inventory/reversal.repository.ts:L32-L76](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/inventory/reversal.repository.ts#L32-L76)

#### Q34: Deadlock có thể xảy ra không và hệ thống phòng tránh thế nào?
- **Trả lời mẫu:** Deadlock được phòng tránh bằng cách tuân thủ thứ tự khóa tài nguyên thống nhất (`ORDER BY id ASC` khi lock các dòng) và giải phóng connection trong khối `finally`.
- **Minh chứng code:** [backend/src/modules/stock/stock.repository.ts:L332-L337](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L332-L337)

#### Q35: Tại sao bảng `role_permissions` lại sử dụng Khóa chính Phức hợp (Composite Primary Key)?
- **Trả lời mẫu:** Khóa chính `PRIMARY KEY (role_id, permission_id)` đảm bảo ở tầng DB một vai trò không bao giờ bị gán trùng lặp một quyền hạn hai lần.
- **Minh chứng code:** [backend/warehouse_management_mysql.sql:L45](file:///c:/source/lv-nhu/luanvan2026/backend/warehouse_management_mysql.sql#L45)

#### Q36: Làm thế nào hệ thống lưu vết thông tin địa chỉ IP và thiết bị người dùng đăng nhập?
- **Trả lời mẫu:** Khi đăng nhập, thông tin `user_agent` và `ip_address` lấy từ HTTP Request được lưu vào bảng `user_sessions`.
- **Minh chứng code:** [backend/src/modules/auth/auth.service.ts:L96-L102](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/auth/auth.service.ts#L96-L102)

#### Q37: Lược đồ cơ sở dữ liệu có hỗ trợ quản lý nhiều kho (Multi-warehouse) không?
- **Trả lời mẫu:** Có, bảng `warehouses` độc lập, liên kết với `warehouse_zones`, `warehouse_shelves`, `warehouse_locations` và bảng phân quyền người dùng xem kho `user_warehouses`.
- **Minh chứng code:** [backend/warehouse_management_mysql.sql:L106-L150](file:///c:/source/lv-nhu/luanvan2026/backend/warehouse_management_mysql.sql:L106-L150)

#### Q38: Làm thế nào hệ thống xử lý việc hủy/hoàn tác một phiếu nhập kho đã xác nhận?
- **Trả lời mẫu:** Sử dụng **Reversal Engine**. Tìm tất cả các giao dịch gốc, kiểm tra chưa bị hoàn tác, kiểm tra số lượng tồn kho hiện tại đủ để trừ, sau đó chèn các giao dịch đảo ngược `REVERSAL` đối ứng.
- **Minh chứng code:** [backend/src/common/inventory/reversal.repository.ts:L174-L269](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/inventory/reversal.repository.ts#L174-L269)

#### Q39: Dữ liệu JSON trong cột `old_values` của Audit Log được chèn như thế nào?
- **Trả lời mẫu:** Dùng hàm `JSON.stringify()` trong JS và ép kiểu `CAST(? AS JSON)` trong MySQL SQL query.
- **Minh chứng code:** [backend/src/common/audit/audit.repository.ts:L28-L38](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/audit/audit.repository.ts#L28-L38)

#### Q40: Bảng `product_batches` quản lý thông tin gì cho đồ Mẹ & Bé?
- **Trả lời mẫu:** Quản lý theo Lô hàng gồm số lô `lot_number`, ngày sản xuất `manufacture_date`, ngày hết hạn `expiry_date` và ngày nhập `received_date`.
- **Minh chứng code:** [backend/src/modules/stock/stock.repository.ts:L142-L145](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L142-L145)

---

## Chuyên đề 3: Nghiệp vụ Quản lý Kho & Thuật toán FEFO/FIFO/QR

#### Q41: Phân biệt thuật toán FEFO và FIFO trong quản lý kho Bambi WMS?
- **Trả lời mẫu:** **FEFO (First Expired, First Out)** ưu tiên xuất các lô hàng có ngày hết hạn (`expiry_date`) gần nhất. **FIFO (First In, First Out)** ưu tiên xuất lô hàng có ngày nhập (`received_date`) cũ nhất.
- **Minh chứng code:** [backend/src/modules/stock/stock.repository.ts:L59-L76](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L59-L76)

#### Q42: Nếu sản phẩm không có ngày hết hạn thì thuật toán FEFO xử lý ra sao?
- **Trả lời mẫu:** Sử dụng biểu thức `CASE WHEN pb.expiry_date IS NULL THEN 1 ELSE 0 END`. Các lô không có hạn dùng sẽ bị đẩy xuống cuối danh sách ưu tiên xuất kho.
- **Minh chứng code:** [backend/src/modules/stock/stock.repository.ts:L62](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L62)

#### Q43: Tính năng Quick Receive bằng mã QR giải quyết nỗi đau gì của thủ kho?
- **Trả lời mẫu:** Giúp thủ kho chỉ cần 1 thao tác quét mã (bằng máy quét súng hoặc camera điện thoại) để tự động nhận diện SKU sản phẩm, vị trí ô chứa, tạo lô hàng và ghi tăng số lượng kho trong 1 giây.
- **Minh chứng code:** [backend/src/modules/stock/stock.service.ts:L105-L137](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.service.ts#L105-L137)

#### Q44: Vòng đời của một Phiếu Nhập Kho (Goods Receipt) gồm các trạng thái nào?
- **Trả lời mẫu:** Gồm 3 trạng thái chính: `DRAFT` (Đang tạo nháp) ➔ `CONFIRMED` (Đã xác nhận & cộng tồn kho) ➔ `REVERSED` (Đã hủy/hoàn tác xuất trả).
- **Minh chứng code:** [backend/src/modules/goods-receipts/goods-receipts.routes.ts:L14-L32](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/goods-receipts/goods-receipts.routes.ts#L14-L32)

#### Q45: Làm sao hệ thống phát hiện hàng tồn kho sắp hết hạn (Near Expiry Stock)?
- **Trả lời mẫu:** Truy vấn qua SQL View `vw_near_expiry_stock`, tính toán số ngày còn lại `days_until_expiry` và sắp xếp giảm dần theo mức độ rủi ro hết hạn.
- **Minh chứng code:** [backend/src/modules/stock/stock.repository.ts:L107-L129](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L107-L129)

#### Q46: Khi chuyển kho (Stock Transfer), dữ liệu được xử lý như thế nào?
- **Trả lời mẫu:** Tạo ra 2 giao dịch liên kết: `TRANSFER_OUT` trừ tồn kho tại kho xuất và `TRANSFER_IN` cộng tồn kho tại kho nhập trong cùng một Database Transaction.
- **Minh chứng code:** [backend/src/common/inventory/reversal.repository.ts:L37-L57](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/inventory/reversal.repository.ts#L37-L57)

#### Q47: Kiểm kê kho (Stock Count) khác gì với Điều chỉnh kho (Stock Adjustment)?
- **Trả lời mẫu:** **Stock Count** là đợt đếm thực tế sản phẩm tại các vị trí kho. **Stock Adjustment** là hành động ghi nhận chênh lệch (lệch tăng/lệch giảm) sau khi kết thúc đợt đếm để đưa số dư trên phần mềm khớp với thực tế.
- **Minh chứng code:** [backend/src/modules/stock-counts/stock-counts.service.ts:L20-L60](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock-counts/stock-counts.service.ts#L20-L60)

#### Q48: Mã chứng từ (như `QRN-...` hay `REC-...`) được sinh tự động theo quy tắc nào?
- **Trả lời mẫu:** Được sinh ra bởi hàm `buildUniqueCode` kết hợp Tiền tố loại giao dịch + Timestamp + Chuỗi Random 6 ký tự viết hoa để đảm bảo không bao giờ trùng lặp.
- **Minh chứng code:** [backend/src/modules/stock/stock.repository.ts:L56-L58](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L56-L58)

#### Q49: Làm thế nào hệ thống ngăn chặn việc nhập lô hàng đã bị khóa (BLOCKED) hoặc hết hạn (EXPIRED)?
- **Trả lời mẫu:** Chặn ở **cả hai chiều**. Khi **nhập**, bước xác nhận phiếu kiểm tra từng dòng hàng và từ chối nếu lô đã quá `expiry_date` (`BATCH_EXPIRED`) hoặc đang ở trạng thái `EXPIRED`/`BLOCKED` (`BATCH_NOT_RECEIVABLE`) — chặn ngay từ đầu để hàng không xuất được không nằm lại trong tồn. Khi **xuất**, câu lệnh tìm ứng viên phân bổ loại sẵn các lô này bằng điều kiện `AND (pb.status IS NULL OR pb.status NOT IN ('EXPIRED', 'BLOCKED', 'DEPLETED'))`.
- **Minh chứng code:** nhập kho — [goods-receipts.repository.ts](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/goods-receipts/goods-receipts.repository.ts); xuất kho — [goods-issues.repository.ts](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/goods-issues/goods-issues.repository.ts)

#### Q49b: Nếu gán nhầm lô của sản phẩm khác vào dòng phiếu nhập thì sao?
- **Trả lời mẫu:** Khóa ngoại `fk_batches_variant` chỉ bảo đảm lô **tồn tại**, không bảo đảm lô **thuộc đúng sản phẩm** của dòng hàng. Vì vậy bước xác nhận phiếu nhập và duyệt phiếu điều chỉnh đều đối chiếu `product_batches.product_variant_id` với `product_variant_id` của dòng hàng, lệch thì trả `BATCH_VARIANT_MISMATCH` (422). Thiếu kiểm tra này, tồn kho sẽ mang hạn dùng của một sản phẩm khác, kéo theo FEFO và cảnh báo cận hạn chạy sai.
- **Minh chứng code:** [goods-receipts.repository.ts](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/goods-receipts/goods-receipts.repository.ts), [stock-adjustments.repository.ts](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock-adjustments/stock-adjustments.repository.ts)

#### Q50: Cấu trúc địa chỉ vị trí kho (Location Code) trong dự án có định dạng như thế nào?
- **Trả lời mẫu:** Định dạng theo sơ đồ phân cấp: `Kho - Zone - Shelf - Location` (VD: `WH01-ZA-S01-L05` tức Kho 1, Khu A, Kệ 1, Ô 5).
- **Minh chứng code:** [backend/src/modules/stock/stock.repository.ts:L140](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L140)

#### Q51: Tại sao sản phẩm ngành Mẹ & Bé cần tính năng Lot/Batch Tracking?
- **Trả lời mẫu:** Vì hàng hóa như Sữa bột, Tã giấy có ngày hết hạn và đợt sản xuất. Nếu có sự cố thu hồi sản phẩm từ nhà sản xuất, hệ thống có thể truy vết chính xác lô hàng đó đang nằm ở vị trí kệ nào trong kho.
- **Minh chứng code:** [backend/src/modules/stock/stock.service.ts:L43-L49](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.service.ts#L43-L49)

#### Q52: Khi người dùng quét 1 mã QR chứa JSON không đúng định dạng thì hệ thống có bị sập (Crash) không?
- **Trả lời mẫu:** Không. Hàm `normalizeScanValue` được bọc trong khối `try/catch`. Nếu không parse được JSON nó sẽ tự động coi đó là chuỗi Barcode/SKU thô.
- **Minh chứng code:** [backend/src/modules/stock/stock.repository.ts:L36-L53](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L36-L53)

#### Q53: Số lượng tồn khả dụng (Available Quantity) được tính như thế nào?
- **Trả lời mẫu:** `available_quantity = quantity - reserved_quantity` (Tồn thực tế trừ đi số lượng đã giữ chỗ cho các đơn hàng đang chờ xuất).
- **Minh chứng code:** [backend/src/modules/stock/stock.repository.ts:L146](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L146)

#### Q54: Hệ thống xử lý thế nào nếu người dùng cố tình nhập số lượng âm (Quantity < 0)?
- **Trả lời mẫu:** Zod Schema tại Controller sẽ chặn ngay lập tức với điều kiện `.positive()` hoặc `.min(1)`. Nếu vượt qua được, câu SQL `WHERE ? >= 0` cũng sẽ chặn ở tầng DB.
- **Minh chứng code:** [backend/src/common/inventory/reversal.repository.ts:L216](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/inventory/reversal.repository.ts#L216)

#### Q55: Làm sao để thủ kho biết ô vị trí kho nào đang trống để xếp hàng vào?
- **Trả lời mẫu:** Dựa vào truy vấn danh sách `warehouse_locations` có tổng số lượng tồn kho `quantity = 0` hoặc lọc theo khu vực `grid_row`, `grid_col` trên sơ đồ mặt bằng.
- **Minh chứng code:** [backend/warehouse_management_mysql.sql:L148-L150](file:///c:/source/lv-nhu/luanvan2026/backend/warehouse_management_mysql.sql#L148-L150)

#### Q56: Tính năng Reversal Engine có hoàn tác được một phiếu đã hoàn tác trước đó không?
- **Trả lời mẫu:** Không. Hàm `assertNotReversed` sẽ kiểm tra trong bảng `inventory_transactions` xem `reversal_of_transaction_id` đã tồn tại chưa. Nếu có sẽ văng lỗi `REFERENCE_ALREADY_REVERSED`.
- **Minh chứng code:** [backend/src/common/inventory/reversal.repository.ts:L107-L130](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/inventory/reversal.repository.ts#L107-L130)

#### Q57: Báo cáo Thống kê xuất ra những chỉ số quan trọng nào?
- **Trả lời mẫu:** Tổng số lượng tồn kho, giá trị tồn kho theo tiền tệ, số lượng phiếu nhập/xuất trong tháng, danh sách sản phẩm cảnh báo dưới ngưỡng tồn tối thiểu (Low Stock Alert).
- **Minh chứng code:** [backend/src/modules/reports/reports.repository.ts:L1-L100](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/reports/reports.repository.ts#L1-L100)

#### Q58: Quá trình tạo mới một Bảng giá / Nhà cung cấp (Supplier) được thực hiện ở module nào?
- **Trả lời mẫu:** Được quản lý độc lập tại module `suppliers` ([backend/src/modules/suppliers](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/suppliers)).

#### Q59: Làm thế nào frontend hiển thị được giao diện Sơ đồ vị trí (Grid View)?
- **Trả lời mẫu:** Frontend đọc tọa độ `grid_row`, `grid_col`, `grid_size` của các Zone và render dưới dạng ma trận lưới CSS Grid trong component `LocationsPage.tsx`.
- **Minh chứng code:** [frontend/src/features/locations/pages/LocationsPage.tsx:L1-L100](file:///c:/source/lv-nhu/luanvan2026/frontend/src/features/locations/pages/LocationsPage.tsx#L1-L100)

#### Q60: File đính kèm (Hình ảnh phiếu nhập, chứng từ) được quản lý như thế nào?
- **Trả lời mẫu:** Được quản lý tại module `attachments`, lưu trữ thông tin tên file, đường dẫn, dung lượng và liên kết với chứng từ qua `entity_type` và `entity_id`.
- **Minh chứng code:** [backend/src/modules/attachments/attachments.module.ts:L1-L20](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/attachments/attachments.module.ts#L1-L20)

---

## Chuyên đề 4: Bảo mật, Xác thực JWT & Phân quyền RBAC

#### Q61: Cơ chế xác thực (Authentication) của hệ thống hoạt động như thế nào?
- **Trả lời mẫu:** Hệ thống dùng **Dual-Token Authentication** (JWT Access Token sống 15 phút + Refresh Token băm SHA-256 lưu trong bảng `user_sessions` sống 7 ngày).
- **Minh chứng code:** [backend/src/modules/auth/auth.service.ts:L88-L109](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/auth/auth.service.ts#L88-L109)

#### Q62: Tại sao Access Token lại đặt thời gian sống ngắn (15 phút)?
- **Trả lời mẫu:** Vì Access Token là Stateless (không lưu trong DB). Đặt thời gian sống ngắn giúp giảm thiểu thiệt hại nếu token vô tình bị lộ ở phía Client.
- **Minh chứng code:** [backend/src/config/config.ts:L20-L25](file:///c:/source/lv-nhu/luanvan2026/backend/src/config/config.ts#L20-L25)

#### Q63: Làm sao để hủy quyền truy cập của một người dùng ngay lập tức khi họ Đăng xuất (Logout)?
- **Trả lời mẫu:** Khi Logout, hệ thống băm Refresh Token gửi lên và cập nhật trường `revoked_at = NOW()` trong bảng `user_sessions`. Mọi yêu cầu xin cấp lại Access Token sau đó đều bị từ chối.
- **Minh chứng code:** [backend/src/modules/auth/auth.service.ts:L40-L42](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/auth/auth.service.ts#L40-L42)

#### Q64: Phân quyền Role-Based Access Control (RBAC) được cài đặt như thế nào?
- **Trả lời mẫu:** Thông qua middleware `requirePermission('permission_code')`. Middleware kiểm tra xem người dùng hiện tại có vai trò `ADMIN`, có quyền đại diện `*` hoặc chuỗi quyền tương ứng trong mảng `permissions` hay không.
- **Minh chứng code:** [backend/src/common/middleware/require-permission.middleware.ts:L4-L22](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/middleware/require-permission.middleware.ts#L4-L22)

#### Q65: Tấn công Brute-force Đăng nhập được phòng chống bằng cách nào?
- **Trả lời mẫu:** Sử dụng middleware `loginRateLimit`. Giới hạn tối đa 10 lần thử đăng nhập sai trong vòng 15 phút theo cặp `IP + Email`. Nếu vượt quá sẽ trả lỗi 429 Too Many Requests kèm Header `Retry-After`.
- **Minh chứng code:** [backend/src/common/middleware/rate-limit.middleware.ts:L59-L64](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/middleware/rate-limit.middleware.ts#L59-L64)

#### Q66: Làm thế nào hệ thống lưu mật khẩu an toàn trong Database?
- **Trả lời mẫu:** Sử dụng `bcrypt.hash()` mã hóa mật khẩu với Salt. Không bao giờ lưu plain-text password.
- **Minh chứng code:** [backend/src/modules/auth/auth.service.ts:L2-L46](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/auth/auth.service.ts#L2-L46)

#### Q67: Tấn công SQL Injection có thể xảy ra trong dự án này không?
- **Trả lời mẫu:** Không. 100% các câu lệnh SQL đều dùng Parameterized Queries (`?` hoặc `:namedParam`). Driver MySQL tự động escape mọi ký tự đặc biệt do người dùng nhập vào.
- **Minh chứng code:** [backend/src/database/db.ts:L10](file:///c:/source/lv-nhu/luanvan2026/backend/src/database/db.ts#L10)

#### Q68: Lỗ hổng Cross-Site Scripting (XSS) được phòng chống ở đâu?
- **Trả lời mẫu:** Ở Frontend, React tự động encode dữ liệu khi render JSX. Ở Backend, dữ liệu JSON trả về được ép kiểu nghiêm ngặt và không render trực tiếp HTML thô.
- **Minh chứng code:** [frontend/src/app/router/AppRouter.tsx:L1-L71](file:///c:/source/lv-nhu/luanvan2026/frontend/src/app/router/AppRouter.tsx#L1-L71)

#### Q69: Chức năng Quên mật khẩu (Password Reset) được thiết kế bảo mật ra sao?
- **Trả lời mẫu:** Sinh một Opaque Token ngẫu nhiên 48-byte, băm SHA-256 lưu vào bảng `password_reset_tokens` có hạn dùng `expires_at` (15 phút) và chỉ sử dụng được 1 lần (`used_at`).
- **Minh chứng code:** [backend/warehouse_management_mysql.sql:L89-L100](file:///c:/source/lv-nhu/luanvan2026/backend/warehouse_management_mysql.sql#L89-L100)

#### Q70: Tại sao Refresh Token khi lưu trong DB lại phải Băm (Hash SHA-256)?
- **Trả lời mẫu:** Để nếu Hacker có chiếm đoạt được Database MySQL thì cũng không thể dùng dữ liệu băm đó làm Refresh Token gửi lên server giả dạng người dùng được.
- **Minh chứng code:** [backend/src/modules/auth/auth.service.ts:L44-L46](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/auth/auth.service.ts#L44-L46)

#### Q71: Hệ thống xử lý ra sao nếu tài khoản đăng nhập sai mật khẩu quá nhiều lần?
- **Trả lời mẫu:** Tăng cột `failed_login_attempts`. Nếu vượt quá ngưỡng cho phép, tự động đổi trạng thái `status = 'LOCKED'` và đặt mốc thời gian khóa `locked_until`.
- **Minh chứng code:** [backend/warehouse_management_mysql.sql:L62-L63](file:///c:/source/lv-nhu/luanvan2026/backend/warehouse_management_mysql.sql#L62-L63)

#### Q72: Làm thế nào middleware `verifyToken` trích xuất được thông tin người dùng từ Request?
- **Trả lời mẫu:** Đọc chuỗi Header `Authorization`, tách lấy chuỗi Bearer Token, dùng `jwt.verify()` kiểm tra chữ ký Secret Key, nếu hợp lệ sẽ gán payload vào đối tượng `req.user`.
- **Minh chứng code:** [backend/src/modules/auth/auth.service.ts:L111-L135](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/auth/auth.service.ts#L111-L135)

#### Q73: Chức năng Audit Log ghi lại những thông tin gì để phục vụ an ninh?
- **Trả lời mẫu:** Ghi lại `userId`, tên hành động `action`, module bị tác động `module`, `entityId`, cùng dữ liệu cũ `old_values` và dữ liệu mới `new_values`.
- **Minh chứng code:** [backend/src/common/audit/audit.repository.ts:L3-L11](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/audit/audit.repository.ts#L3-L11)

#### Q74: Làm sao để ngăn chặn người dùng thường truy cập API của Admin?
- **Trả lời mẫu:** Gắn middleware `requirePermission('users:create')` hoặc `requirePermission('settings:update')` trên các Route của Admin. User thường không có quyền này sẽ bị trả lỗi 403 Forbidden.
- **Minh chứng code:** [backend/src/modules/auth/auth.routes.ts:L30-L35](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/auth/auth.routes.ts#L30-L35)

#### Q75: Cấu hình `jwtSecret` có được hardcode trong source code không?
- **Trả lời mẫu:** Không. Được đọc từ biến môi trường `JWT_SECRET` trong file `.env`. Nếu không có sẽ văng lỗi ngay khi khởi động app.
- **Minh chứng code:** [backend/src/config/config.ts:L18](file:///c:/source/lv-nhu/luanvan2026/backend/src/config/config.ts#L18)

#### Q76: Kỹ thuật Token Rotation (Xoay vòng Refresh Token) là gì và có được dùng không?
- **Trả lời mẫu:** Có. Khi người dùng gọi API `/auth/refresh`, Refresh Token cũ sẽ bị hủy (`revoked_at = NOW()`) và một cặp Token hoàn toàn mới sẽ được cấp lại.
- **Minh chứng code:** [backend/src/modules/auth/auth.service.ts:L40](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/auth/auth.service.ts#L40)

#### Q77: Middleware `requestContext` đóng vai trò gì cho bảo mật và log?
- **Trả lời mẫu:** Sinh ra chuỗi `requestId` độc nhất (UUID) cho mỗi Request đi vào hệ thống, giúp gom nhóm toàn bộ các dòng log liên quan đến cùng một yêu cầu của người dùng.
- **Minh chứng code:** [backend/src/common/middleware/request-context.middleware.ts:L10-L25](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/middleware/request-context.middleware.ts#L10-L25)

#### Q78: Dữ liệu nhạy cảm (như password, secret) có vô tình bị in ra trong Log không?
- **Trả lời mẫu:** Không. Tầng Logger chủ động lọc bỏ các trường nhạy cảm như `password`, `token`, `authorization` trước khi ghi ra console hoặc file.
- **Minh chứng code:** [backend/src/common/middleware/request-context.middleware.ts:L26-L35](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/middleware/request-context.middleware.ts#L26-L35)

#### Q79: Nếu Hacker gửi một Payload JSON dung lượng cực lớn (VD 100MB) để làm tràn bộ nhớ server thì sao?
- **Trả lời mẫu:** Express Body Parser được cấu hình giới hạn kích thước tối đa `express.json({ limit: '1mb' })`. Request quá lớn sẽ bị từ chối ngay lập tức với lỗi 413 Payload Too Large.
- **Minh chứng code:** [backend/src/app.ts:L65](file:///c:/source/lv-nhu/luanvan2026/backend/src/app.ts#L65)

#### Q80: Sự khác biệt giữa 401 Unauthorized và 403 Forbidden trong dự án là gì?
- **Trả lời mẫu:** **401 Unauthorized** xuất hiện khi người dùng chưa đăng nhập hoặc Token không hợp lệ. **403 Forbidden** xuất hiện khi người dùng đã đăng nhập thành công nhưng tài khoản không có đủ quyền (`permission`) để thực hiện thao tác.
- **Minh chứng code:** [backend/src/common/middleware/require-permission.middleware.ts:L7-L20](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/middleware/require-permission.middleware.ts#L7-L20)

---

## Chuyên đề 5: Xử lý Lỗi, Hiệu năng, Kiểm thử & Mở rộng Scalability

#### Q81: Dự án tập trung xử lý lỗi ngoại lệ (Centralized Error Handling) ở đâu?
- **Trả lời mẫu:** Tại Middleware `errorHandler` trong [backend/src/common/http.ts](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/http.ts#L44-L80). Mọi lỗi không được bắt sẽ hội tụ về đây để trả JSON chuẩn hóa cho client.
- **Minh chứng code:** [backend/src/common/http.ts:L44-L80](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/http.ts#L44-L80)

#### Q82: Khi ứng dụng gặp lỗi 500 Internal Server Error, người dùng có bị lộ thông tin nhạy cảm của server không?
- **Trả lời mẫu:** Không. Trong môi trường Production, `errorHandler` sẽ che giấu Stack Trace chi tiết và chỉ trả về thông báo chung `Internal server error` để đảm bảo an toàn.
- **Minh chứng code:** [backend/src/common/http.ts:L65-L75](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/http.ts#L65-L75)

#### Q83: Làm sao để kiểm thử tự động (Automated Testing) toàn bộ dự án?
- **Trả lời mẫu:** Dự án sử dụng framework **Jest** và **Supertest** để chạy Unit Test, Integration Test và End-to-End (E2E) Test thông qua câu lệnh `npm test`.
- **Minh chứng code:** [backend/package.json:L17-L23](file:///c:/source/lv-nhu/luanvan2026/backend/package.json#L17-L23)

#### Q84: Integration Test trong dự án kiểm tra những thành phần nào?
- **Trả lời mẫu:** Kiểm tra luồng gọi API thực tế kết nối trực tiếp với MySQL test database để đảm bảo các câu SQL, Transaction và Trigger hoạt động chính xác.
- **Minh chứng code:** [backend/package.json:L23](file:///c:/source/lv-nhu/luanvan2026/backend/package.json#L23)

#### Q85: Dự án đóng gói Containerization như thế nào để phục vụ triển khai (Deployment)?
- **Trả lời mẫu:** Sử dụng **Docker** và **Docker Compose**. Đóng gói Backend Express, Frontend Nginx và MySQL 8 vào các Container riêng biệt chỉ bằng lệnh `docker compose up --build`.
- **Minh chứng code:** [docker-compose.yml:L1-L40](file:///c:/source/lv-nhu/luanvan2026/docker-compose.yml#L1-L40)

#### Q86: Làm thế nào để mở rộng quy mô hệ thống (Scalability) khi lượng truy cập tăng gấp 100 lần?
- **Trả lời mẫu:** Vì Backend Express là **Stateless** (Session lưu trong MySQL), ta có thể dễ dàng nhân bản nhiều Node.js Instance đằng sau một Nginx Load Balancer. Đưa In-Memory Rate Limit sang Redis.
- **Minh chứng code:** [backend/src/app.ts:L31-L101](file:///c:/source/lv-nhu/luanvan2026/backend/src/app.ts#L31-L101)

#### Q87: Tại sao lại chọn Vite làm công cụ Build cho Frontend React thay vì Create React App?
- **Trả lời mẫu:** Vite sử dụng **ESbuild** viết bằng Go giúp thời gian Hot Module Replacement (HMR) và thời gian Build nhanh hơn gấp 10-20 lần so với Webpack truyền thống.
- **Minh chứng code:** [frontend/vite.config.ts:L1-L20](file:///c:/source/lv-nhu/luanvan2026/frontend/vite.config.ts#L1-L20)

#### Q88: Kỹ thuật Tree Shaking hoạt động ra sao trong việc tối ưu Bundle Frontend?
- **Trả lời mẫu:** Vì sử dụng ES Modules (`import/export`), công cụ Build sẽ tự động loại bỏ (Shake) các hàm hoặc icon không được sử dụng ra khỏi file JS cuối cùng.
- **Minh chứng code:** [frontend/package.json:L5](file:///c:/source/lv-nhu/luanvan2026/frontend/package.json#L5)

#### Q89: Làm thế nào để theo dõi thời gian phản hồi (Latency) của từng API?
- **Trả lời mẫu:** Middleware `requestLogger` tính khoảng thời gian chênh lệch giữa `process.hrtime()` lúc Request đi vào và lúc Response gửi ra (`res.on('finish')`).
- **Minh chứng code:** [backend/src/common/middleware/request-context.middleware.ts:L20-L30](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/middleware/request-context.middleware.ts#L20-L30)

#### Q90: Điểm yếu của việc dùng In-Memory Rate Limiting hiện tại là gì và hướng khắc phục?
- **Trả lời mẫu:** Điểm yếu là dữ liệu lưu trong RAM của 1 process Node.js, khi restart server hoặc chạy Cluster nhiều instance sẽ bị mất/không đồng bộ. Hướng khắc phục: Chuyển sang lưu bộ đếm bộ nhớ đệm **Redis**.
- **Minh chứng code:** [backend/src/common/middleware/rate-limit.middleware.ts:L16](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/middleware/rate-limit.middleware.ts#L16)

#### Q91: Làm thế nào ứng dụng phát hiện khi Database MySQL bị ngắt kết nối đột ngột?
- **Trả lời mẫu:** Module `health` truy vấn đường dẫn `/health` thực thi câu lệnh nhẹ `SELECT 1`. Nếu DB sập sẽ trả về Status 539/500 kèm trạng thái `DOWN` cho các công cụ Monitoring.
- **Minh chứng code:** [backend/src/modules/health/health.module.ts:L1-L20](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/health/health.module.ts#L1-L20)

#### Q92: Quản lý Linting và Code Format trong dự án để đảm bảo chất lượng mã nguồn ra sao?
- **Trả lời mẫu:** Cấu hình **ESLint** kiểm tra lỗi cú pháp/chuẩn TypeScript và **Prettier** tự động định dạng code thống nhất thông qua các câu lệnh `npm run lint` và `npm run format`.
- **Minh chứng code:** [backend/package.json:L10-L16](file:///c:/source/lv-nhu/luanvan2026/backend/package.json#L10-L16)

#### Q93: Tại sao lại cần file `tsconfig.build.json` riêng biệt bên cạnh `tsconfig.json`?
- **Trả lời mẫu:** Để khi biên dịch Production Build (`npm run build`), TypeScript chỉ biên dịch mã trong `src/` và bỏ qua toàn bộ các file kiểm thử `*.spec.ts` nhằm giảm dung lượng và thời gian build.
- **Minh chứng code:** [backend/tsconfig.build.json:L1-L5](file:///c:/source/lv-nhu/luanvan2026/backend/tsconfig.build.json#L1-L5)

#### Q94: Phân biệt sự khác nhau giữa `npm install` và `npm install --omit=dev` khi triển khai Production?
- **Trả lời mẫu:** `--omit=dev` loại bỏ toàn bộ các thư viện phát triển (`devDependencies` như TypeScript, Jest, ESLint) giúp thư mục `node_modules` trên Server Production nhẹ hơn hàng trăm Megabyte.
- **Minh chứng code:** [README.md:L112](file:///c:/source/lv-nhu/luanvan2026/README.md#L112)

#### Q95: Quá trình thiết kế Database đã đạt chuẩn hóa dạng mấy (Normal Form)?
- **Trả lời mẫu:** Đạt chuẩn hóa **Dạng chuẩn 3 (3NF)**: Mọi thuộc tính không khóa đều phụ thuộc trực tiếp vào khóa chính, không có phụ thuộc bắc cầu (Trừ các view tổng hợp dữ liệu để tối ưu tốc độ đọc).
- **Minh chứng code:** [backend/warehouse_management_mysql.sql:L1-L150](file:///c:/source/lv-nhu/luanvan2026/backend/warehouse_management_mysql.sql#L1-L150)

#### Q96: Làm thế nào frontend xử lý các lỗi mạng (Network Error) khi backend ngắt kết nối?
- **Trả lời mẫu:** Axios Interceptor bắt các lỗi không có `error.response` và hiển thị thông báo Notification UI thân thiện cho người dùng thay vì để ứng dụng bị trắng màn hình.
- **Minh chứng code:** [frontend/src/shared/api/httpClient.ts:L20-L35](file:///c:/source/lv-nhu/luanvan2026/frontend/src/shared/api/httpClient.ts#L20-L35)

#### Q97: Dự án quản lý trạng thái Toàn cục (Global State) ở Frontend bằng giải pháp gì?
- **Trả lời mẫu:** Quản lý state cục bộ tinh gọn tại các React Custom Hooks và Context Provider cho Auth (`AuthProvider`), tránh việc làm rối ứng dụng bằng Redux khi không cần thiết.
- **Minh chứng code:** [frontend/src/app/providers/index.tsx:L1-L30](file:///c:/source/lv-nhu/luanvan2026/frontend/src/app/providers/index.tsx#L1-L30)

#### Q98: Biểu thức chính quy (Regex) được áp dụng ở đâu trong việc validate dữ liệu?
- **Trả lời mẫu:** Được dùng trong Zod Schema để kiểm tra định dạng Số điện thoại Việt Nam, Email chuẩn và Mã chứng từ không chứa ký tự đặc biệt nguy hiểm.
- **Minh chứng code:** [backend/src/modules/auth/auth.validation.ts:L1-L30](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/auth/auth.validation.ts#L1-L30)

#### Q99: Làm sao để đảm bảo dữ liệu trong ứng dụng không bị ảnh hưởng bởi múi giờ (Timezone Issue)?
- **Trả lời mẫu:** Lưu trữ thời gian trong Database MySQL và câu lệnh SQL luôn dùng UTC / `CURRENT_TIMESTAMP(3)`, khi trả về Client mới định dạng theo múi giờ địa phương.
- **Minh chứng code:** [backend/warehouse_management_mysql.sql:L27](file:///c:/source/lv-nhu/luanvan2026/backend/warehouse_management_mysql.sql#L27)

#### Q100: Nếu được tiếp tục phát triển dự án này, em sẽ nâng cấp những tính năng kỹ thuật gì tiếp theo?
- **Trả lời mẫu:** Em sẽ bổ sung 3 điểm nâng cao: 
  1. Tích hợp **Redis Caching** cho các API đọc tồn kho và phân quyền; 
  2. Triển khai **WebSockets (`socket.io`)** để đẩy thông báo biến động kho thời gian thực tới màn hình thủ kho; 
  3. Xây dựng thuật toán **AI Gợi ý Tối ưu tuyến đường lấy hàng (Pick Path Optimization)** trong kho.
- **Minh chứng code:** [backend/package.json:L31](file:///c:/source/lv-nhu/luanvan2026/backend/package.json#L31)
