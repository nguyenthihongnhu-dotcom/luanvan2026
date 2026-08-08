# 🛡️ KỸ PHÁP PHẢN BIỆN DÀNH CHO NGƯỜI DÙNG AI - ĐỒ ÁN BAMBI WMS

**Tác giả:** Senior Software Architect  
**Đối tượng:** Sinh viên / Lập trình viên xây dựng 100% mã nguồn dự án Bambi WMS bằng AI và cần chiến thuật "thủ thế", làm chủ mã nguồn và đạt điểm cao trước Hội đồng Bảo vệ Đồ án.

---

## 📌 MỤC LỤC KỸ PHÁP
- [PHẦN 1: Quy tắc 4 bước "Đọc Code Không Cần Nhớ" (Trace-in-5-Seconds)](#phần-1-quy-tắc-4-bước-đọc-code-không-cần-nhớ-trace-in-5-seconds)
- [PHẦN 2: Bảng Giải Mã Thuật Ngữ Chuyên Sâu do AI Tự Động Sinh Ra](#phần-2-bảng-giải-mã-thuật-ngữ-chuyên-sâu-do-ai-tự-động-sinh-ra)
- [PHẦN 3: Kịch bản Demo 10 Phút "Ăn Điểm Absolute" Trước Hội Đồng](#phần-3-kịch-bản-demo-10-phút-ăn-điểm-absolute-trước-hội-đồng)
- [PHẦN 4: Chiến thuật "Thủ Thế" & Ứng Biến Khi Bị Bắt Bài Lỗi AI](#phần-4-chiến-thuật-thủ-thế--ứng-biến-khi-bị-bắt-bài-lỗi-ai)

---

## PHẦN 1: Quy tắc 4 bước "Đọc Code Không Cần Nhớ" (Trace-in-5-Seconds)

Bạn **không cần học thuộc từng dòng code** do AI viết. Chỉ cần ghi nhớ quy tắc trace 4 bước này, bất kể Thầy/Cô chỉ vào tính năng nào trên màn hình Web, bạn đều tìm ra file code tương ứng trong 5 giây:

```text
[Màn hình Web (URL)] ➔ [1. Route File] ➔ [2. Controller / Middleware] ➔ [3. Service / Repository] ➔ [4. Database SQL Table]
```

### Chi tiết 4 Bước Thao Tác:

1. **Bước 1 - Nhìn URL Màn Hình (Frontend/Backend):**
   - VD: Người dùng bấm "Nhập kho nhanh" tại địa chỉ URL `http://localhost:5173/quick-receive`.
   - Tra ngay file `AppRouter.tsx` ([frontend/src/app/router/AppRouter.tsx:L50](file:///c:/source/lv-nhu/luanvan2026/frontend/src/app/router/AppRouter.tsx#L50)) ➔ tìm thấy Component `QuickReceivePage`.

2. **Bước 2 - Tìm API Route Tương Ứng (Backend Route):**
   - Mở [backend/src/app.ts:L74-L96](file:///c:/source/lv-nhu/luanvan2026/backend/src/app.ts#L74-L96) để biết prefix module (VD: `/stock`).
   - Mở [backend/src/modules/stock/stock.routes.ts](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.routes.ts) ➔ thấy route `POST /quick-receive` gọi tới `quickReceiveStockController`.

3. **Bước 3 - Mở Controller & Service (Kiểm tra Validation & Business Logic):**
   - Mở `stock.controller.ts` ➔ thấy Controller bóc tách `req.body` và validate bằng Zod DTO.
   - Mở `stock.service.ts` ➔ thấy Service gọi hàm `quickReceiveStockRepository`.

4. **Bước 4 - Mở Repository (Xem Câu lệnh SQL Thực tế):**
   - Mở [backend/src/modules/stock/stock.repository.ts:L171-L339](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L171-L339) ➔ Thầy/Cô sẽ trầm trồ vì bạn mở đúng đoạn SQL `FOR UPDATE` và `ON DUPLICATE KEY UPDATE` xử lý nhập kho.

---

## PHẦN 2: Bảng Giải Mã Thuật Ngữ Chuyên Sâu do AI Tự Động Sinh Ra

AI rất thích dùng các thuật ngữ phần mềm nâng cao. Nếu Thầy/Cô hỏi bất ngờ: *"Tại sao code em có thuật ngữ X này?"*, hãy dùng ngay bảng giải mã dưới đây:

| Thuật ngữ AI sinh ra | Ý nghĩa Công nghệ | Cách trả lời "Chuẩn Chuyên Gia" trước Hội đồng | File Minh chứng trong Dự án |
| :--- | :--- | :--- | :--- |
| **Layered Architecture** | Kiến trúc Phân tầng | *"Dự án chia làm 4 tầng rõ ràng (Route, Controller, Service, Repository) để đảm bảo Separation of Concerns, dễ nâng cấp và viết Unit Test."* | [backend/src/app.ts:L74-L96](file:///c:/source/lv-nhu/luanvan2026/backend/src/app.ts#L74-L96) |
| **DTO (Data Transfer Object)** | Đối tượng Chuyển đổi Dữ liệu | *"Em dùng Zod Schema đóng vai trò DTO để validate chuẩn hóa dữ liệu từ Client trước khi đi sâu vào hệ thống, chặn đứng dữ liệu rác."* | [stock.validation.ts:L1-L40](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.validation.ts#L1-L40) |
| **Pessimistic Locking (`FOR UPDATE`)** | Khóa Bi quan | *"Em dùng khóa bi quan `FOR UPDATE` trong SQL Transaction để ngăn 2 người cùng sửa số lượng kho 1 mặt hàng cùng 1 thời điểm."* | [reversal.repository.ts:L82-L105](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/inventory/reversal.repository.ts#L82-L105) |
| **Optimistic Versioning** | Khóa Lạc quan theo Phiên bản | *"Em thêm cột `version` trong bảng `stock_locations`. Mỗi lần Update thì `version = version + 1`, nếu version bị lệch hệ thống sẽ báo lỗi xung đột."* | [reversal.repository.ts:L210-L222](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/inventory/reversal.repository.ts#L210-L222) |
| **FEFO (First Expired, First Out)** | Hàng hết hạn trước xuất trước | *"Đặc thù đồ Mẹ & Bé có hạn dùng (sữa, tã). Thuật toán FEFO tự động sắp xếp lô hàng theo `expiry_date ASC` để ưu tiên xuất lô sắp hết hạn trước."* | [stock.repository.ts:L59-L76](file:///c:/source/lv-nhu/luanvan2026/backend/src/modules/stock/stock.repository.ts#L59-L76) |
| **Reversal Engine** | Engine Hoàn tác Bất biến | *"Hệ thống không bao giờ dùng lệnh DELETE xóa phiếu. Khi hủy phiếu em sinh một giao dịch `REVERSAL` đối ứng để giữ nguyên tính toàn vẹn tài chính."* | [reversal.repository.ts:L174-L269](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/inventory/reversal.repository.ts#L174-L269) |
| **RBAC (Role-Based Access Control)** | Phân quyền dựa trên Vai trò | *"Middleware `requirePermission` kiểm tra mảng quyền `permissions` gán theo Role của User để cấp hoặc chặn quyền truy cập API."* | [require-permission.middleware.ts:L4-L22](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/middleware/require-permission.middleware.ts#L4-L22) |
| **Rate Limiting** | Giới hạn Tần suất Truy cập | *"Dùng middleware `loginRateLimit` chặn Brute-force mật khẩu bằng cách giới hạn tối đa 10 lần thử đăng nhập trong 15 phút theo IP + Email."* | [rate-limit.middleware.ts:L59-L64](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/middleware/rate-limit.middleware.ts#L59-L64) |
| **Audit Logging** | Nhật ký Truy vết | *"Hàm `insertAuditLog` lưu lại mọi thay đổi `old_values` và `new_values` dưới dạng JSON để ban quản lý truy vết khi có sự cố."* | [audit.repository.ts:L13-L40](file:///c:/source/lv-nhu/luanvan2026/backend/src/common/audit/audit.repository.ts#L13-L40) |
| **Connection Pool** | Hồ chứa Kết nối Database | *"Dùng `mysql2.createPool()` để duy trì sẵn các kết nối TCP tới MySQL, tránh chi phí đóng/mở kết nối liên tục gây giảm hiệu năng."* | [db.ts:L4-L11](file:///c:/source/lv-nhu/luanvan2026/backend/src/database/db.ts#L4-L11) |

---

## PHẦN 3: Kịch bản Demo 10 Phút "Ăn Điểm Absolute" Trước Hội Đồng

Hãy chủ động dẫn dắt buổi thuyết trình theo kịch bản 10 phút đã được tối ưu hóa này. Không cho Hội đồng có thời gian trống để hỏi những câu lý thuyết vụn vặt:

### Phút 01 - 02: Mở Đầu & Giới Thiệu Bài Toán Nghiệp Vụ
- *"Kính thưa Hội đồng, hệ thống **Bambi WMS** là giải pháp quản lý kho chuyên biệt cho chuỗi Cửa hàng Mẹ & Bé. Hệ thống được xây dựng theo kiến trúc Client-Server với Backend Node.js Express TypeScript kết hợp MySQL 8 và Frontend React Vite."*
- Bấm mở trang Đăng nhập `http://localhost:5173/login`, đăng nhập tài khoản Quản lý Kho.

### Phút 02 - 04: Demo Tính Năng Độc Đáo - Quick Receive Bằng QR Code
- Điều hướng tới màn hình `http://localhost:5173/quick-receive`.
- Trình diễn quét mã QR (hoặc nhập mã SKU/Barcode và mã ô vị trí kho `WH01-ZA-S01-L01`).
- Nhấn "Xác nhận Nhập nhanh". Hệ thống báo nhập kho thành công trong 1 giây.
- **Lời thoại ghi điểm:** *"Hệ thống tự động nhận diện mã ô vị trí, tạo lô hàng Lot/Expiry nếu có và cập nhật tồn kho bằng câu lệnh SQL `ON DUPLICATE KEY UPDATE` chỉ trong 1 giao dịch nguyên tố."*

### Phút 04 - 06: Demo Thuật Toán Phân Bổ Tồn Kho FEFO (First Expired, First Out)
- Điều hướng sang màn hình Xuất kho / Phân bổ Tồn kho.
- Nhập thông tin mặt hàng Sữa bột có nhiều lô hạn dùng khác nhau.
- Bấm "Xem trước Phân bổ (Preview Allocation)".
- **Lời thoại ghi điểm:** *"Hội đồng có thể thấy hệ thống tự động bốc lô sữa có `expiry_date` gần nhất (hạn dùng ngắn nhất) ra trước. Đây chính là thuật toán FEFO em cài đặt trong Service để tránh rủi ro hàng Mẹ & Bé bị quá hạn trong kho."*

### Phút 06 - 08: Demo Engine Hoàn Tác Giao Dịch (Reversal Engine) & An Toàn Đồng Thời
- Mở một Phiếu Nhập đã Xác nhận (`CONFIRMED`). Bấm nút "Hoàn tác / Hủy phiếu" (`REVERSED`).
- Cho Hội đồng xem số lượng tồn kho tự động được trả về trạng thái cũ.
- **Lời thoại ghi điểm:** *"Dự án của em không dùng câu lệnh `DELETE` để xóa dữ liệu. Thay vào đó, Reversal Engine sử dụng khóa bi quan `FOR UPDATE` và băm version `version = version + 1` để chèn một giao dịch đảo ngược đối ứng, giữ nguyên nhật ký kiểm toán."*

### Phút 08 - 10: Tổng Kết Bảo Mật, Audit Log & Kết Thúc
- Mở màn hình `Audit Logs` cho xem lịch sử truy vết từng hành động.
- Trình bày về hệ thống Phân quyền RBAC và Rate Limiting chống Brute-force.
- **Kết luận:** *"Em xin cảm ơn Quý Thầy/Cô trong Hội đồng đã lắng nghe. Em sẵn sàng nhận các câu hỏi phản biện ạ!"*

---

## PHẦN 4: Chiến thuật "Thủ Thế" & Ứng Biến Khi Bị Bắt Bài Lỗi AI

Khi dùng AI viết code, đôi khi AI sinh ra code thừa, chưa tối ưu hoặc Thầy/Cô cố tình xoáy vào một điểm chưa hoàn hảo. Hãy áp dụng **Chiến thuật 3 Bắt (Bắt Nhịp - Bắt Gốc - Bắt Hướng)** để trả lời cực kỳ thông minh:

### 🎭 Kịch bản 1: Thầy/Cô bắt bài *"Code đoạn này dài/rườm rà quá, chắc do AI viết đúng không?"*
- ❌ **KHÔNG ĐƯỢC:** Ứng úng, chối bỏ hoặc thừa nhận *"Em không biết do AI tự sinh ra"*.
- ✅ **BẢN LĨNH ĐÁP:** 
  > *"Báo cáo Thầy/Cô, trong quá trình phát triển em có sử dụng công cụ AI để hỗ trợ sinh mã thô (boilerplate code) nhằm tăng tốc độ phát triển. Tuy nhiên, đoạn code rườm rà này là do AI cố tình bọc nhiều tầng kiểm tra an toàn (defensive programming) như type validation và try/catch. Em đã rà soát và thấy việc bọc kỹ này giúp ứng dụng không bị sập (crash) khi gặp dữ liệu bất thường. Em xin ghi nhận ý kiến của Thầy/Cô để refactor đoạn này gọn hơn ở phiên bản sau ạ!"*

### 🎭 Kịch bản 2: Thầy/Cô xoáy vào lỗi *"Tại sao chỗ này không dùng Caching Redis mà lại query MySQL trực tiếp?"*
- ❌ **KHÔNG ĐƯỢC:** Nói *"Em không biết dùng Redis"*.
- ✅ **BẢN LĨNH ĐÁP:** 
  > *"Dạ thưa Thầy/Cô, trong phạm vi đồ án hiện tại, em ưu tiên đảm bảo **Tính nhất quán dữ liệu tuyệt đối (Strong Consistency)** và giảm độ phức tạp của hạ tầng deployment nên em thực hiện truy vấn trực tiếp vào MySQL kèm Index tối ưu và Connection Pool. Trong thực tế khi quy mô người dùng tăng lên hàng chục ngàn request/giây, việc tích hợp **Redis Caching** cho các API đọc tồn kho là hoàn toàn cần thiết, và em đã thiết kế tầng Service độc lập để sẵn sàng plug-in Redis vào mà không làm ảnh hưởng tới logic hiện tại ạ!"*

### 🎭 Kịch bản 3: Thầy/Cô yêu cầu *"Em hãy chỉnh sửa 1 đoạn code ngay tại chỗ cho Thầy/Cô xem!"*
- 💡 **BÍ KÍP XỬ LÝ TRONG 30 GIÂY:**
  1. Bình tĩnh hít một hơi sâu.
  2. Mở file theo Bảng tra cứu siêu tốc ([00-BANG-TRA-CUU-CODE-NHANH.md](file:///c:/source/lv-nhu/luanvan2026/docs/00-BANG-TRA-CUU-CODE-NHANH.md)).
  3. Nếu câu hỏi về sửa Validation: Chỉ cần mở file `*.validation.ts` sửa điều kiện Zod `.min()` hoặc `.max()`.
  4. Nếu câu hỏi về sửa câu SQL: Mở file `*.repository.ts`, thêm điều kiện vào mảng `where.push('status = :status')`.
  5. Giải thích hành động: *"Dạ em đang thêm điều kiện lọc vào tầng Repository để đảm bảo câu lệnh SQL được Parameterized đúng chuẩn ạ."*
