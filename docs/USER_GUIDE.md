# Hướng Dẫn Sử Dụng — Bambi WMS

Tài liệu mô tả chi tiết từng chức năng của hệ thống quản lý kho **Bambi WMS**.
Phiên bản: 2026 · Ngôn ngữ giao diện: Tiếng Việt

---

## Mục lục

1. [Đăng nhập](#1-đăng-nhập)
2. [Hàng hóa & Danh mục](#2-hàng-hóa--danh-mục)
3. [Sơ đồ kho](#3-sơ-đồ-kho)
4. [Lô hàng](#4-lô-hàng)
5. [Tồn kho hiện tại](#5-tồn-kho-hiện-tại)
6. [Chứng từ kho (Nhập / Xuất / Điều chỉnh)](#6-chứng-từ-kho-nhập--xuất--điều-chỉnh)
7. [Nhận hàng nhanh (Quick Receive)](#7-nhận-hàng-nhanh-quick-receive)
8. [Chuyển kho](#8-chuyển-kho)
9. [Kiểm kê kho](#9-kiểm-kê-kho)
10. [Báo cáo tồn kho](#10-báo-cáo-tồn-kho)
11. [Đối tác / Nhà cung cấp](#11-đối-tác--nhà-cung-cấp)
12. [Nhân viên](#12-nhân-viên)
13. [Phân quyền](#13-phân-quyền)
14. [Cảnh báo & Thông báo](#14-cảnh-báo--thông-báo)
15. [Nhật ký thao tác](#15-nhật-ký-thao-tác)
16. [Tệp đính kèm](#16-tệp-đính-kèm)
17. [Cài đặt hệ thống](#17-cài-đặt-hệ-thống)

---

## 1. Đăng nhập

**URL:** `/login`

Màn hình đăng nhập để truy cập hệ thống. Mỗi tài khoản được gán 1 vai trò (ADMIN / MANAGER / STAFF), vai trò quyết định các thao tác được phép thực hiện.

### Các bước sử dụng

1. Nhập **Email** và **Mật khẩu** vào form.
2. Nhấn **Đăng nhập**.
3. Hệ thống xác thực và chuyển hướng vào dashboard.

### Lưu ý

- Sai mật khẩu quá 10 lần trong 15 phút → tạm khóa theo IP.
- Token xác thực lưu trong `sessionStorage`, đóng tab/trình duyệt là hết phiên.
- Nếu thấy lỗi 403 ở các thao tác, liên hệ ADMIN để cấp thêm quyền.

---

## 2. Hàng hóa & Danh mục

**URL:** `/products` · `/categories`

Quản lý danh mục hàng hóa và sản phẩm (SKU). Mỗi sản phẩm có thể có nhiều biến thể và được gắn vào 1 danh mục.

### Danh mục (`/categories`)

| Thao tác | Mô tả |
|---|---|
| Thêm danh mục | Nhấn `+ Thêm danh mục`, nhập tên và mô tả |
| Sửa | Nhấn nút **Sửa** trên dòng tương ứng |
| Xóa | Nhấn nút **Xóa** — chỉ xóa được danh mục chưa có sản phẩm |

### Hàng hóa (`/products`)

| Thao tác | Mô tả |
|---|---|
| Xem danh sách | Hiển thị SKU, tên, danh mục, tồn hiện tại, hạn dùng gần nhất, vị trí đang chứa hàng |
| Thêm sản phẩm | Nhấn `+ Thêm sản phẩm`, khai báo **SKU, tên, danh mục, tồn tối thiểu** |
| Sửa | Cập nhật SKU, tên, danh mục, tồn tối thiểu |
| Xóa | Chỉ xóa được sản phẩm chưa từng xuất hiện trên chứng từ nào và không còn tồn |

### Lưu ý

- **Sản phẩm mới luôn bắt đầu với tồn kho 0.** Màn danh mục chỉ *khai báo* sản phẩm;
  số lượng chỉ tăng khi có **phiếu nhập kho được xác nhận**. Nhờ vậy mọi thay đổi tồn
  đều truy ngược được về một chứng từ, không có đường nào cộng tồn lặng lẽ.
- **Không khai vị trí và hạn dùng ở đây.** Vị trí thuộc về dòng hàng của phiếu nhập,
  hạn dùng thuộc về lô hàng — mỗi lô một hạn khác nhau.
- Cột **Hạn dùng gần nhất** là hạn của lô sắp hết hạn sớm nhất còn trong kho, không
  phải một hạn cố định của sản phẩm.
- **Không xóa được sản phẩm đã có phiếu.** Hệ thống trả lỗi `PRODUCT_HAS_DOCUMENTS`
  nếu sản phẩm được tham chiếu ở bất kỳ dòng phiếu nhập/xuất/điều chỉnh nào, và
  `PRODUCT_HAS_STOCK` nếu còn tồn. Xóa đi thì các phiếu cũ mất đối tượng tham chiếu
  và nhật ký kho không dựng lại được.
- Mỗi biến thể sản phẩm có **SKU** riêng biệt dùng trong tất cả chứng từ.

---

## 3. Sơ đồ kho

**URL:** `/locations`

Quản lý cấu trúc vật lý của kho theo phân cấp: **Kho → Khu → Kệ → Tầng kệ → Vị trí**.

### Cấu trúc phân cấp

```
Kho (Warehouse)
 └── Khu (Zone)
      └── Kệ (Shelf)
           └── Tầng kệ (Layer)
                └── Vị trí (Location)
```

### Các chức năng chính

| Chức năng | Mô tả |
|---|---|
| Sơ đồ mặt bằng | Hiển thị mặt bằng kho dạng bản đồ 2D |
| Thêm khu | Thêm khu mới vào kho, đặt số kệ và số tầng mỗi kệ |
| Đặt biệt danh khu | Nút `Đặt tên` trên thẻ khu — đặt tên gọi quen như "Khu sữa bột" |
| Kéo thả khu | Giữ chuột kéo khu từ sidebar thả vào mặt bằng; đang kéo bấm `F` xoay ngang/dọc, `Esc` hủy |
| Xóa khu | Nút `Xóa` trên thẻ khu; chỉ xóa được khi trong khu **không còn vị trí nào có hàng** |
| Thêm kệ | Thêm kệ vào khu, chỉ định số tầng |
| Xem vị trí | Click vào ô kệ trên sơ đồ để xem chi tiết vị trí và lịch sử tồn |
| Lịch sử vị trí | Mỗi vị trí hiển thị lịch sử biến động tồn |

### Cách đọc mặt bằng

- **Khoảng trắng là lối đi**, không phải ô trống chờ đặt khu. Lưới ô nét đứt chỉ hiện
  khi bạn đang kéo một khu — đúng lúc cần ngắm chỗ thả.
- Mỗi khu hiện **mã khu** (A, B, C) in đậm; nếu đã đặt biệt danh thì biệt danh nằm ngay dưới.
- Khu hết chỗ được phủ vệt gạch chéo đỏ và ghi `ĐẦY`.
- **Mã khu không đổi được** vì nó nằm trong mã của từng ô lưu trữ
  (`HCM01-A-A01-01` = Kho HCM01, khu A, kệ A01, tầng 01). Muốn gọi tên khác thì đặt biệt danh.

### Trạng thái vị trí

| Trạng thái | Ý nghĩa |
|---|---|
| Trống | Vị trí không có hàng |
| Có hàng | Vị trí đang chứa hàng |
| Đầy | Vị trí đạt sức chứa tối đa |

---

## 4. Lô hàng

**URL:** `/batches`

Xem danh sách lô hàng được tạo tự động khi **Xác nhận phiếu nhập**. Mỗi lô gắn với 1 sản phẩm, 1 nhà cung cấp và có hạn sử dụng (nếu có).

### Thông tin hiển thị

| Cột | Nội dung |
|---|---|
| Mã lô | Mã định danh lô hàng |
| Sản phẩm | SKU + Tên sản phẩm |
| Nhà cung cấp | Tên nhà cung cấp |
| Số lượng | Số lượng của lô |
| Ngày sản xuất | Ngày nhà sản xuất đóng lô, in trên bao bì |
| Ngày nhập kho | Ngày lô được nhập vào kho — dùng để xuất theo FIFO |
| Hạn sử dụng | Ngày hết hạn — dùng để xuất theo FEFO và cảnh báo cận hạn |

### Lưu ý

- Lô hàng **không tự tạo thủ công** — tạo bằng cách **Xác nhận phiếu nhập**.
- 1 đơn hàng (phiếu nhập) có thể nhập **nhiều lần**, mỗi lần tạo 1 lô riêng.
- Hệ thống xuất kho theo nguyên tắc **FEFO** (First Expired, First Out).

### Ràng buộc khi nhập hàng theo lô

Khi xác nhận phiếu nhập, hệ thống từ chối nếu:

| Lỗi | Nguyên nhân |
|---|---|
| `BATCH_REQUIRED` | Sản phẩm bật theo dõi lô nhưng dòng hàng chưa chọn lô |
| `EXPIRY_DATE_REQUIRED` | Sản phẩm bật theo dõi hạn nhưng lô chưa có hạn sử dụng |
| `BATCH_VARIANT_MISMATCH` | Lô gắn vào dòng hàng **thuộc sản phẩm khác** |
| `BATCH_EXPIRED` | Lô đã quá hạn sử dụng |
| `BATCH_NOT_RECEIVABLE` | Lô đang ở trạng thái `EXPIRED` hoặc `BLOCKED` |

> Kiểm tra lô đúng sản phẩm là bắt buộc: khóa ngoại chỉ bảo đảm lô **tồn tại**, không
> bảo đảm lô **thuộc đúng sản phẩm**. Gắn nhầm thì tồn kho mang hạn dùng của sản phẩm
> khác, kéo theo FEFO và cảnh báo cận hạn chạy sai.

---

## 5. Tồn kho hiện tại

**URL:** `/stock`

Xem số lượng tồn hiện tại của từng sản phẩm theo vị trí kho, kết hợp phân bổ xuất kho trước (allocation preview).

### Các chức năng

| Chức năng | Mô tả |
|---|---|
| Lọc theo kho | Chọn kho để xem tồn kho của kho đó |
| Lọc theo SKU | Gõ mã SKU, hệ thống **gợi ý** theo mã và tên sản phẩm |
| Phân bổ xuất kho | Chọn SKU và số lượng để xem hệ thống sẽ lấy hàng từ lô/vị trí nào (FEFO hoặc FIFO) |

### Ý nghĩa ba cột số lượng

| Cột | Ý nghĩa |
|---|---|
| **Tồn** | Số lượng vật lý thực tế đang nằm tại vị trí đó |
| **Đã giữ** | Số lượng đã giữ chỗ cho phiếu xuất chưa hoàn tất |
| **Khả dụng** | Số còn có thể xuất được — bằng *Tồn* trừ *Đã giữ* |

### Lưu ý

- Tồn kho thay đổi **ngay sau khi** xác nhận phiếu nhập/xuất/chuyển kho/điều chỉnh.
- Ô số lượng **chuyển đỏ ngay khi gõ quá** tồn khả dụng, kèm câu nói rõ kho còn bao
  nhiêu và đang thừa bao nhiêu; nút `Xem phân bổ` bị khóa cho tới khi số hợp lệ.
- Cột **Lô** hiện kèm id lô (`#8 - LOT-MOONY-M-202607`) vì số lô của nhà sản xuất có
  thể trùng nhau giữa các lần nhập.
- **FEFO** ưu tiên lô hết hạn sớm nhất, **FIFO** ưu tiên lô nhập vào sớm nhất. Lô đã
  hết hạn hoặc bị khóa không được đưa vào phân bổ.

---

## 6. Chứng từ kho (Nhập / Xuất / Điều chỉnh)

**URL:** `/transactions`

Trung tâm quản lý tất cả chứng từ kho. Mỗi chứng từ phải qua quy trình duyệt mới tác động vào tồn kho.

### Quy trình chứng từ

```
Tạo (DRAFT)  →  Xác nhận (CONFIRMED)  →  Tồn kho được cập nhật
                      ↓
                Đảo phiếu (REVERSED)  →  Tồn kho hoàn lại

Điều chỉnh:
Tạo (DRAFT)  →  Chờ duyệt (PENDING_APPROVAL)  →  Duyệt / Từ chối
```

### Tạo phiếu nhập

1. Nhấn **+ Tạo phiếu** → chọn loại **Nhập kho**.
2. Nhập Mã phiếu và chọn Nhà cung cấp.
3. Thêm từng dòng hàng: chọn SKU + vị trí + số lượng + hạn sử dụng.
4. Nhấn **Lưu nháp** hoặc **Xác nhận** ngay.

### Tạo phiếu xuất

1. Nhấn **+ Tạo phiếu** → chọn loại **Xuất kho**.
2. Thêm dòng hàng — hệ thống gợi ý phân bổ theo FEFO.
3. Nhấn **Xem phân bổ** để kiểm tra trước.
4. Xác nhận phiếu để trừ tồn.

### Tạo phiếu điều chỉnh

1. Chọn loại **Điều chỉnh** và chọn kho.
2. Chọn sản phẩm, rồi chọn **kiểu điều chỉnh**:
   - **Sửa số lượng** — hàng vẫn ở chỗ cũ, chỉ đổi số
   - **Chuyển vị trí** — chuyển nguyên số lượng sang ô khác
   - **Cả hai** — vừa chuyển chỗ vừa đổi số
3. Chọn nơi đang có hàng từ danh sách tồn thực có (hiện sẵn tồn từng ô và từng lô).
   Thanh tóm tắt cho biết tồn hiện tại và tồn **sau điều chỉnh** sẽ là bao nhiêu.
4. Ghi rõ lý do rồi lưu. Phiếu tạo tay vào trạng thái **Nháp**.
5. Người có quyền `stock_adjustments:approve` bấm **Duyệt phiếu** thì tồn mới đổi.

> Phiếu điều chỉnh **chưa duyệt thì không tác động gì tới tồn kho**. Duyệt được cả
> phiếu ở trạng thái Nháp lẫn Chờ duyệt.

### Trạng thái chứng từ

| Trạng thái | Ý nghĩa |
|---|---|
| Nháp | Mới tạo, chưa tác động tồn |
| Chờ duyệt | Cần phê duyệt (điều chỉnh) |
| Đã xác nhận | Tồn kho đã được cập nhật |
| Đã duyệt | Điều chỉnh được chấp thuận |
| Đã từ chối | Yêu cầu bị từ chối |
| Đã đảo phiếu | Tồn kho được hoàn lại |
| Đã hủy | Phiếu bị hủy |

---

## 7. Nhận hàng nhanh (Quick Receive)

**URL:** `/quick-receive`

Màn hình tối giản để nhập hàng nhanh bằng quét mã vạch hoặc nhập thủ công. Phù hợp cho nhân viên kho trên thiết bị di động.

### Quy trình

1. Quét / nhập **SKU** sản phẩm.
2. Quét / nhập **mã vị trí** kho.
3. Nhập **số lượng** và **hạn sử dụng** (nếu có).
4. Nhấn **Ghi nhận** — hệ thống tự tạo và xác nhận phiếu nhập ngay lập tức.

### Lưu ý

- Quick Receive tạo 1 phiếu nhập đã xác nhận ngay — tồn kho tăng liền.
- Phiếu tạo ra vẫn xuất hiện trong `/transactions` để tra soát.

---

## 8. Chuyển kho

**URL:** `/transfers`

Quản lý phiếu chuyển hàng giữa 2 vị trí/kho khác nhau. Tồn kho chỉ thay đổi sau khi **Xác nhận** phiếu.

### Quy trình chuyển kho

```
Tạo (DRAFT)  →  Xác nhận (CONFIRMED)  →  Tồn kho được chuyển
                      ↓
                Đảo phiếu (REVERSED)  →  Hoàn tồn về kho nguồn
```

### Cột THAO TÁC

| Nút | Điều kiện | Hành động |
|---|---|---|
| Chi tiết | Luôn hiển thị | Mở modal xem thông tin đầy đủ phiếu |
| Xác nhận | Trạng thái DRAFT / PENDING | Xác nhận phiếu, cập nhật tồn kho |
| Đảo phiếu | Trạng thái CONFIRMED | Hoàn lại tồn về kho nguồn |

---

## 9. Kiểm kê kho

**URL:** `/stock-counts`

Thực hiện kiểm kê (đếm thực tế) tồn kho và đối chiếu với số liệu hệ thống.

### Phạm vi kiểm kê

| Phạm vi | Ý nghĩa |
|---|---|
| Toàn kho | Kiểm kê toàn bộ kho |
| Theo khu | Kiểm kê 1 khu cụ thể |
| Theo kệ | Kiểm kê 1 kệ cụ thể |
| Theo vị trí | Kiểm kê 1 vị trí cụ thể |
| Theo SKU | Kiểm kê toàn bộ tồn của 1 sản phẩm |
| Theo danh mục | Kiểm kê toàn bộ sản phẩm trong 1 danh mục |

### Quy trình kiểm kê

```
Tạo phiếu (DRAFT) — hệ thống chốt số liệu tồn tại thời điểm tạo
    ↓
Bắt đầu kiểm kê (IN_PROGRESS) — nhân viên đếm thực tế từng dòng
    ↓
Gửi duyệt (SUBMITTED) — khóa lại, không sửa số được nữa
    ↓                          ↘ Trả về sửa → quay lại IN_PROGRESS
Duyệt (APPROVED) — sinh PHIẾU ĐIỀU CHỈNH cho các dòng lệch
    ↓
Duyệt tiếp phiếu điều chỉnh đó thì TỒN KHO mới thay đổi
```

> **Duyệt phiếu kiểm kê chưa trừ tồn.** Nó chỉ sinh ra một phiếu điều chỉnh ở trạng
> thái *Chờ xử lý*. Phải vào **Chứng từ → Giao dịch** duyệt tiếp phiếu đó thì tồn mới
> đổi. Sau khi duyệt kiểm kê, màn hình hiện luôn mã phiếu điều chỉnh vừa sinh kèm nút
> đi thẳng tới đó.

### Quy tắc sửa số đếm

- **Chưa gửi duyệt** (đang IN_PROGRESS): sửa lại bao nhiêu lần cũng được, kể cả dòng
  đã lưu. Dòng đã lưu được đánh dấu `✓ Đã đếm`, nút đổi thành `Lưu lại`.
- **Đã gửi duyệt**: khóa, không nhập được nữa. Muốn sửa thì người duyệt bấm
  **Trả về sửa** kèm lý do, phiếu quay lại *Đang kiểm kê* cho nhân viên đếm lại.
- Ô **Lý do** chỉ mở khi dòng đó thực sự lệch; khớp số thì không cần giải thích.

### Cột THAO TÁC

| Nút | Điều kiện |
|---|---|
| Chi tiết | Luôn hiển thị — xem và nhập số lượng thực đếm |
| Bắt đầu | Trạng thái DRAFT |
| Gửi duyệt | Trạng thái IN_PROGRESS |
| Trả về sửa | Trạng thái SUBMITTED — đưa phiếu về cho nhân viên đếm lại, bắt buộc nêu lý do |
| Duyệt | Trạng thái SUBMITTED |

Các nút này cũng nằm ngay trong màn **Chi tiết kiểm kê** nên không phải đóng ra đóng vào.

---

## 10. Báo cáo tồn kho

**URL:** `/reports` · `/inventory-transactions`

### Các loại báo cáo

| Báo cáo | Nội dung |
|---|---|
| Tồn kho theo vị trí | Số lượng hiện tại từng SKU tại từng vị trí |
| Sắp hết hạn | Danh sách lô hàng hết hạn trong N ngày tới |
| Biến động tồn | Lịch sử nhập/xuất/chuyển theo thời gian |

Tại `/inventory-transactions`: xem danh sách tất cả giao dịch tồn kho kèm người thực hiện.

---

## 11. Đối tác / Nhà cung cấp

**URL:** `/partners`

Quản lý danh sách nhà cung cấp (NCC) — đối tác được tham chiếu khi tạo phiếu nhập hàng.

| Thao tác | Mô tả |
|---|---|
| Thêm đối tác | Nhập tên, mã NCC, email, địa chỉ |
| Sửa | Cập nhật thông tin đối tác |
| Xóa | Xóa đối tác không còn sử dụng |

### Lưu ý

- Không thể xóa NCC đang được tham chiếu bởi phiếu nhập hàng.

---

## 12. Nhân viên

**URL:** `/employees`

Quản lý tài khoản nhân viên trong hệ thống.

### Vai trò

| Vai trò | Quyền hạn |
|---|---|
| ADMIN | Toàn quyền hệ thống |
| MANAGER | Duyệt chứng từ, xem báo cáo, quản lý nhân viên |
| STAFF | Tạo chứng từ, nhập hàng, kiểm kê |

### Cột THAO TÁC

| Nút | Mô tả |
|---|---|
| Sửa | Cập nhật họ tên, email, số điện thoại, vai trò |
| Đặt lại mật khẩu | Cấp một **mã dùng một lần** để nhân viên tự đặt mật khẩu mới |
| Ngưng / Bật lại | Bật tắt tài khoản |

### Lưu ý

- **Không xóa được tài khoản nhân viên.** Mọi phiếu nhập, xuất, điều chỉnh và dòng
  `audit_logs` đều ghi ai tạo và ai duyệt; xóa tài khoản là nhật ký kho mất người
  chịu trách nhiệm. Thay vào đó dùng **Ngưng hoạt động** — tài khoản không đăng nhập
  được nữa nhưng toàn bộ lịch sử thao tác vẫn nguyên vẹn.
- **Quản trị viên không xem và không đặt hộ mật khẩu.** Nút *Đặt lại mật khẩu* sinh
  một mã dùng một lần, có hạn vài phút; đưa mã đó cho nhân viên để họ tự nhập mật
  khẩu mới. Nhờ vậy không ai ngoài chính nhân viên biết mật khẩu của họ.
- Đăng ký công khai luôn tạo tài khoản **STAFF**.
- Để tạo tài khoản MANAGER/ADMIN, dùng chức năng **Thêm nhân viên** ở màn này.

---

## 13. Phân quyền

**URL:** `/authorization`

Xem và cấu hình quyền cho từng vai trò. ADMIN có thể bật/tắt từng quyền cụ thể.

### Quyền quan trọng

| Quyền | Ý nghĩa |
|---|---|
| `goods_receipts:confirm` | Xác nhận phiếu nhập |
| `goods_receipts:reverse` | Đảo phiếu nhập |
| `goods_issues:confirm` | Xác nhận phiếu xuất |
| `stock_transfers:confirm` | Xác nhận chuyển kho |
| `stock_transfers:reverse` | Đảo phiếu chuyển kho |
| `stock_adjustments:approve` | Duyệt phiếu điều chỉnh |
| `stock_counts:approve` | Duyệt kiểm kê, và trả phiếu về cho nhân viên đếm lại |
| `users:create` / `users:update` | Thêm / Sửa nhân viên |
| `settings:update` | Thay đổi cài đặt hệ thống |

Tên quyền và tên nhóm hiển thị bằng tiếng Việt; phần mã (`stock_adjustments:approve`)
giữ tiếng Anh vì backend dùng nó làm khóa kiểm tra quyền.

### Cách cập nhật

1. Chọn Vai trò cần cấu hình.
2. Tick/untick từng quyền.
3. Nhấn **Lưu**.
4. Nhân viên cần **đăng xuất và đăng nhập lại** để token cập nhật quyền mới.

---

## 14. Cảnh báo & Thông báo

**URL:** `/alerts`

Hiển thị cảnh báo vận hành kho (gần hết tồn, sắp hết hạn) và thông báo hệ thống.

### Tab Cảnh báo

| Thao tác | Mô tả |
|---|---|
| Đã đọc | Đánh dấu cảnh báo đã được xem xét |
| Xử lý | Đánh dấu cảnh báo đã được giải quyết |
| Sinh cảnh báo | Kích hoạt thủ công để tạo cảnh báo mới |

### Tab Thông báo

| Thao tác | Mô tả |
|---|---|
| Đã đọc | Đánh dấu thông báo đã đọc |
| Sinh thông báo | Kích hoạt tạo thông báo thủ công |

---

## 15. Nhật ký thao tác

**URL:** `/audit-logs`

Lịch sử toàn bộ thao tác người dùng: ai làm gì, lúc nào, trên đối tượng nào.

| Cột | Ý nghĩa |
|---|---|
| Người thực hiện | Tên đầy đủ nhân viên |
| Hành động | CREATE / UPDATE / DELETE / CONFIRM / REVERSE / v.v. |
| Đối tượng | Loại bản ghi bị tác động |
| Mã đối tượng | ID bản ghi cụ thể |
| Thời gian | Thời điểm thực hiện |

### Lưu ý

- Nhật ký là **append-only** — không thể chỉnh sửa hoặc xóa.

---

## 16. Tệp đính kèm

**URL:** `/attachments`

Xem danh sách metadata tệp đính kèm (hóa đơn, chứng từ scan, v.v.).

| Cột | Ý nghĩa |
|---|---|
| Tên tệp | Tên file gốc |
| Loại tệp | MIME type |
| Kích thước | Dung lượng file |
| Người tải lên | Tên đầy đủ nhân viên |
| Ngày tải | Thời điểm upload |

---

## 17. Cài đặt hệ thống

**URL:** `/settings`

Xem và cập nhật các tham số cấu hình vận hành.

### Các cài đặt phổ biến

| Cài đặt | Ý nghĩa |
|---|---|
| LOW_STOCK_THRESHOLD | Ngưỡng tồn kho thấp để kích hoạt cảnh báo |
| NEAR_EXPIRY_DAYS | Số ngày cận hạn để sinh cảnh báo sắp hết hạn |
| FEFO_ENABLED | Bật/tắt xuất kho theo nguyên tắc FEFO |

### Lưu ý

- Cần quyền `settings:update` để thay đổi.
- Thay đổi ngưỡng cảnh báo có hiệu lực ở lần sinh cảnh báo tiếp theo.

---

## Phụ lục: Luồng nghiệp vụ tổng quát

```
[Setup]
Tạo Kho → Tạo Khu/Kệ/Vị trí → Thêm NCC → Thêm Sản phẩm

[Nhập hàng]
Tạo phiếu nhập → Thêm dòng hàng → Xác nhận → Tồn kho tăng → Lô hàng được tạo

[Xuất hàng]
Tạo phiếu xuất → Hệ thống phân bổ FEFO → Xác nhận → Tồn kho giảm

[Chuyển kho]
Tạo phiếu chuyển → Xác nhận → Tồn kho chuyển giữa 2 vị trí

[Kiểm kê]
Tạo phiếu → Bắt đầu → Đếm thực tế → Nộp → Duyệt → Điều chỉnh tồn tự động

[Điều chỉnh thủ công]
Tạo phiếu → Chờ duyệt → MANAGER duyệt → Tồn kho điều chỉnh
```

---

*Cập nhật lần cuối: 2026-08-05*
