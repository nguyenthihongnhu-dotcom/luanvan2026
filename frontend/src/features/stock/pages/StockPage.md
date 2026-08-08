# GIẢI THÍCH TRANG STOCK PAGE (`StockPage.tsx`)

File: [`StockPage.tsx`](file:///c:/source/lv-nhu/luanvan2026/frontend/src/features/stock/pages/StockPage.tsx)

## 1. TỔNG QUAN CHỨC NĂNG
Trang **Quản lý Tồn kho** (`/stock`) hỗ trợ nhân viên và quản lý kho:
1. **Lọc tồn kho**: Theo Kho hàng và theo mã Variant ID.
2. **Preview phân bổ xuất kho**: Giả lập xuất kho FEFO (hạn ngắn nhất xuất trước) hoặc FIFO (nhập sớm nhất xuất trước).
3. **Xem tồn kho hiện tại**: Bảng hiển thị chi tiết mã SKU, vị trí ô/kệ (`location_code`), lô (`batch_id`, `lot_number`), hạn sử dụng và số lượng.
4. **Cảnh báo cận date**: Danh sách các lô hàng sắp hết hạn (`days_until_expiry`).

---

## 2. CHIA TÁCH CHI TIẾT: THÔNG BÁO VS CẢNH BÁO

### 📢 2.1 THÔNG BÁO (Notifications & Informational Feedback)
Cung cấp thông tin trạng thái hoạt động bình thường, thông báo ngữ cảnh và thông báo sự kiện:
- **Thông báo Kho làm việc**: Badge màu hồng ghi tên kho (Ví dụ: `KHO-HCM-02 - Kho chi nhánh Quận 7`).
- **Thông báo Loading**: Nút bấm hiển thị `"Đang tải"` / `"Đang xem"` thông báo hệ thống đang truy vấn.
- **Thông báo Kết quả Phân bổ**: Bảng viền xanh hiển thị danh sách vị trí/lô trích xuất hàng hoặc thông báo `"Không có tồn khả dụng."`.
- **Thông báo Chuông Hệ thống**: Biểu tượng chuông trên Header hiển thị badge số lượng (Ví dụ: badge số `2`) báo các sự kiện toàn hệ thống (phiếu mới, yêu cầu duyệt...).

### ⚠️ 2.2 CẢNH BÁO (Warnings, Alerts & Error Banners)
Cảnh báo rủi ro tổn thất, thiếu hụt tồn kho hoặc lỗi thao tác/lỗi kết nối:
- **Cảnh báo Lô hàng gần hết hạn**: Bảng "Lô gần hết hạn" liệt kê sản phẩm cận date với cột **"Còn lại"** (`days_until_expiry`) để thủ kho ưu tiên xuất trước theo FEFO.
- **Cảnh báo Thiếu hụt Tồn kho**: Badge màu đỏ **"Không đủ tồn"** và Banner màu đỏ hiển thị chi tiết khi số lượng cần xuất > tổng khả dụng trong kho. Cảnh báo ghi rõ **từng vị trí ô/kệ cụ thể có bao nhiêu sản phẩm** (Ví dụ: `Vị trí HCM02-A-A01-01 chỉ có 5 sản phẩm khả dụng`) và báo số lượng sản phẩm còn thiếu.
- **Cảnh báo Lỗi thao tác & Lỗi kết nối**: Banner màu đỏ (`bg-red-50 text-red-700`) báo nguyên nhân lỗi nhập thiếu dữ liệu hoặc lỗi HTTP từ Backend.

---

## 3. Ý NGHĨA CÁC FIELD DỮ LIỆU
- **SKU (`sku`)**: Mã quản lý đơn vị sản phẩm.
- **Sản phẩm (`product_name` + `variant_name`)**: Tên mặt hàng và phân loại biến thể.
- **Kho (`warehouse_code` + `warehouse_name`)**: Mã & tên chi nhánh kho.
- **Vị trí (`location_code`)**: Mã ô/kệ lưu trữ (Ví dụ: `HCM02-A-A01-01`).
- **Lô (`batch_id` + `lot_number`)**: Lô hệ thống (`batch_id`) và số lô nhà sản xuất (`lot_number`). Hiển thị dạng `#batch_id - lot_number`.
- **Hạn sử dụng (`expiry_date`)**: Ngày hết hạn dùng của lô.
- **Tồn (`quantity`)**: Tổng số lượng vật lý đếm được thực tế tại kệ.
- **Đã giữ (`reserved_quantity`)**: Số lượng đã được giữ chỗ cho các đơn bán/phiếu xuất chưa hoàn thành.
- **Khả dụng (`available_quantity`)**: Số lượng thực sự sẵn sàng bán = `Tồn` - `Đã giữ`.

---

## 4. CÁC API SERVICE KẾT NỐI
- `GET /stock/current`: Lấy danh sách tồn kho hiện tại.
- `GET /stock/near-expiry`: Lấy danh sách lô gần hết hạn.
- `GET /stock/allocation`: Lấy kết quả xem trước phân bổ xuất kho FEFO/FIFO.
