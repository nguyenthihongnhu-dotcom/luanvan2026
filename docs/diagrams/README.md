# Thư mục sơ đồ (diagrams)

Toàn bộ sơ đồ trong [../../THIET_KE_HE_THONG.md](../../THIET_KE_HE_THONG.md) được render sẵn ra ảnh (54 sơ đồ).

- Mỗi sơ đồ có 3 file cùng tên: `.mmd` (nguồn Mermaid), `.png` (raster nền trắng 2x), `.svg` (vector).
- **Chèn Word nên dùng `.svg`**: Insert > Pictures > chọn SVG (vector, kéo to/nhỏ vẫn nét, tự vừa cột).
- Đường nối đã đặt **thẳng** (linear). Ngôn ngữ: tiếng Việt đồng bộ; chỉ giữ tiếng Anh cho **giá trị enum** (DRAFT, CONFIRMED, RECEIPT, REVERSAL...), **tên bảng/cột** trong ERD/Class và **tên lớp + câu lệnh SQL** trong sơ đồ tuần tự.
- Chương 4 bổ sung góc nhìn BA/SA/Architect: Context, BPMN, DFD, Class, Component, Deployment, C4, Package, User Flow.

## Danh sách

| STT | Mục | Loại | Tên file (bỏ đuôi) | KT PNG (px) | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| 01 | 2.4.1 Quy trình nghiệp vụ | Luồng/Kiến trúc | `01_2-4-1_quy-trinh-chung-cua-mot-chung-tu-kho_flow` | 1568×154 |  |
| 02 | 2.4.1 Quy trình nghiệp vụ | Luồng/Kiến trúc | `02_2-4-1_1-quy-trinh-nhap-kho-goods-receipt_flow` | 908×3084 | Cao — đặt trang riêng / dùng SVG |
| 03 | 2.4.1 Quy trình nghiệp vụ | Luồng/Kiến trúc | `03_2-4-1_2-quy-trinh-xuat-kho-goods-issue_flow` | 1120×3096 | Cao — đặt trang riêng / dùng SVG |
| 04 | 2.4.1 Quy trình nghiệp vụ | Luồng/Kiến trúc | `04_2-4-1_3-quy-trinh-chuyen-kho-stock-transfer_flow` | 936×2198 | Cao — đặt trang riêng / dùng SVG |
| 05 | 2.4.1 Quy trình nghiệp vụ | Trạng thái | `05_2-4-1_4-quy-trinh-kiem-ke-stock-count_state` | 974×1196 |  |
| 06 | 2.4.1 Quy trình nghiệp vụ | Trạng thái | `06_2-4-1_5-quy-trinh-dieu-chinh-ton-stock-adjustment_state` | 884×872 |  |
| 07 | 2.4.1 Quy trình nghiệp vụ | Luồng/Kiến trúc | `07_2-4-1_6-quy-trinh-xac-thuc-va-phan-quyen_flow` | 1568×142 |  |
| 08 | 2.4.2 Sơ đồ chức năng | Luồng/Kiến trúc | `08_2-4-2_so-do-chuc-nang_flow` | 1568×88 |  |
| 09 | 2.4.3 Use case tổng quát | Luồng/Kiến trúc | `09_2-4-3_so-do-use-case-tong-quat_flow` | 1568×1024 |  |
| 10 | 3.1.1 Mô hình ý niệm | Luồng/Kiến trúc | `10_3-1-1_muc-y-niem-conceptual_flow` | 1542×652 |  |
| 11 | 3.1.2 Mô hình luận lý | ERD | `11_3-1-2_muc-luan-ly-logical_erd` | 1568×1544 |  |
| 12 | 3.1.2 Mô hình luận lý | ERD | `12_3-1-2_muc-luan-ly-logical_erd` | 1254×2092 |  |
| 13 | 3.1.2 Mô hình luận lý | ERD | `13_3-1-2_muc-luan-ly-logical_erd` | 1568×2332 |  |
| 14 | 3.1.2 Mô hình luận lý | ERD | `14_3-1-2_muc-luan-ly-logical_erd` | 1568×1192 |  |
| 15 | 3.1.2 Mô hình luận lý | ERD | `15_3-1-2_muc-luan-ly-logical_erd` | 1568×938 |  |
| 16 | 3.1.2 Mô hình luận lý | ERD | `16_3-1-2_muc-luan-ly-logical_erd` | 1568×424 |  |
| 17 | 3.2.2 Sơ đồ tuần tự | Tuần tự | `17_3-2-2_sequence-1-dang-nhap_sequence` | 1568×974 |  |
| 18 | 3.2.2 Sơ đồ tuần tự | Tuần tự | `18_3-2-2_sequence-2-xac-nhan-phieu-xuat-kho-fefo-nghiep-vu-loi_sequence` | 1568×968 |  |
| 19 | 3.2.2 Sơ đồ tuần tự | Tuần tự | `19_3-2-2_sequence-3-tao-phieu-nhap-kho_sequence` | 1568×724 |  |
| 20 | 3.2.2 Sơ đồ tuần tự | Tuần tự | `20_3-2-2_sequence-4-duyet-phieu-dieu-chinh-ton_sequence` | 1568×920 |  |
| 21 | 3.2.3 Sơ đồ hoạt động | Luồng/Kiến trúc | `21_3-2-3_activity-1-xac-nhan-phieu-xuat-kho-theo-fefo_flow` | 1308×4538 | Cao — đặt trang riêng / dùng SVG |
| 22 | 3.2.3 Sơ đồ hoạt động | Luồng/Kiến trúc | `22_3-2-3_activity-2-quy-trinh-kiem-ke_flow` | 1530×3492 | Cao — đặt trang riêng / dùng SVG |
| 23 | 3.2.3 Sơ đồ hoạt động | Luồng/Kiến trúc | `23_3-2-3_activity-3-phan-quyen-request-bat-ky_flow` | 1348×2856 |  |
| 24 | 3.3.1 Nhập kho | Tuần tự | `24_3-3-1_chuc-nang-nhap-kho-goods-receipt_sequence` | 1568×988 |  |
| 25 | 3.3.1 Nhập kho | Luồng/Kiến trúc | `25_3-3-1_chuc-nang-nhap-kho-goods-receipt_flow` | 884×3458 | Cao — đặt trang riêng / dùng SVG |
| 26 | 3.3.1 Nhập kho | Trạng thái | `26_3-3-1_chuc-nang-nhap-kho-goods-receipt_state` | 680×1022 |  |
| 27 | 3.3.2 Xuất kho | Tuần tự | `27_3-3-2_chuc-nang-xuat-kho-goods-issue_sequence` | 1568×1008 |  |
| 28 | 3.3.2 Xuất kho | Luồng/Kiến trúc | `28_3-3-2_chuc-nang-xuat-kho-goods-issue_flow` | 1288×3268 | Cao — đặt trang riêng / dùng SVG |
| 29 | 3.3.2 Xuất kho | Trạng thái | `29_3-3-2_chuc-nang-xuat-kho-goods-issue_state` | 680×1022 |  |
| 30 | 3.3.3 Chuyển kho | Tuần tự | `30_3-3-3_chuc-nang-chuyen-kho-stock-transfer_sequence` | 1568×1128 |  |
| 31 | 3.3.3 Chuyển kho | Luồng/Kiến trúc | `31_3-3-3_chuc-nang-chuyen-kho-stock-transfer_flow` | 986×2310 | Cao — đặt trang riêng / dùng SVG |
| 32 | 3.3.3 Chuyển kho | Trạng thái | `32_3-3-3_chuc-nang-chuyen-kho-stock-transfer_state` | 680×1022 |  |
| 33 | 3.3.4 Kiểm kê | Tuần tự | `33_3-3-4_chuc-nang-kiem-ke-stock-count_sequence` | 1568×1072 |  |
| 34 | 3.3.4 Kiểm kê | Luồng/Kiến trúc | `34_3-3-4_chuc-nang-kiem-ke-stock-count_flow` | 1464×2776 |  |
| 35 | 3.3.4 Kiểm kê | Trạng thái | `35_3-3-4_chuc-nang-kiem-ke-stock-count_state` | 1032×1100 |  |
| 36 | 3.3.5 Điều chỉnh tồn | Tuần tự | `36_3-3-5_chuc-nang-dieu-chinh-ton-stock-adjustment_sequence` | 1568×854 |  |
| 37 | 3.3.5 Điều chỉnh tồn | Luồng/Kiến trúc | `37_3-3-5_chuc-nang-dieu-chinh-ton-stock-adjustment_flow` | 1266×2416 |  |
| 38 | 3.3.5 Điều chỉnh tồn | Trạng thái | `38_3-3-5_chuc-nang-dieu-chinh-ton-stock-adjustment_state` | 790×872 |  |
| 39 | 3.3.6 Sản phẩm và SKU | Tuần tự | `39_3-3-6_chuc-nang-quan-ly-san-pham-va-sku-catalog_sequence` | 1568×736 |  |
| 40 | 3.3.6 Sản phẩm và SKU | Luồng/Kiến trúc | `40_3-3-6_chuc-nang-quan-ly-san-pham-va-sku-catalog_flow` | 868×1758 |  |
| 41 | 3.3.6 Sản phẩm và SKU | Trạng thái | `41_3-3-6_chuc-nang-quan-ly-san-pham-va-sku-catalog_state` | 894×872 |  |
| 42 | 3.3.7 Người dùng và phân quyền | Tuần tự | `42_3-3-7_chuc-nang-quan-ly-nguoi-dung-va-phan-quyen_sequence` | 1568×974 |  |
| 43 | 3.3.7 Người dùng và phân quyền | Luồng/Kiến trúc | `43_3-3-7_chuc-nang-quan-ly-nguoi-dung-va-phan-quyen_flow` | 1040×2358 | Cao — đặt trang riêng / dùng SVG |
| 44 | 3.3.7 Người dùng và phân quyền | Trạng thái | `44_3-3-7_chuc-nang-quan-ly-nguoi-dung-va-phan-quyen_state` | 692×692 |  |
| 45 | 4.1 Context Diagram | Luồng/Kiến trúc | `45_4-1_so-do-ngu-canh-context-diagram-c4-level-1_flow` | 1312×756 |  |
| 46 | 4.2 BPMN (swimlane) | Luồng/Kiến trúc | `46_4-2_so-do-bpmn-business-process-quy-trinh-nhap-kho-dang-lane_flow` | 1568×362 |  |
| 47 | 4.3 DFD | Luồng/Kiến trúc | `47_4-3_so-do-luong-du-lieu-data-flow-diagram-dfd_flow` | 1568×398 |  |
| 48 | 4.4 Class Diagram | Lớp | `48_4-4_so-do-lop-class-diagram-mo-hinh-mien_class` | 1568×1290 |  |
| 49 | 4.5 Component Diagram | Luồng/Kiến trúc | `49_4-5_so-do-thanh-phan-component-diagram_flow` | 1568×690 |  |
| 50 | 4.6 Deployment Diagram | Luồng/Kiến trúc | `50_4-6_so-do-trien-khai-deployment-diagram_flow` | 1236×1166 |  |
| 51 | 4.7 C4 Model | Luồng/Kiến trúc | `51_4-7_c4-model_flow` | 630×1118 |  |
| 52 | 4.7 C4 Model | Luồng/Kiến trúc | `52_4-7_c4-model_flow` | 1568×776 |  |
| 53 | 4.8 Package Diagram | Luồng/Kiến trúc | `53_4-8_so-do-goi-package-diagram-cau-truc-ma-nguon_flow` | 1568×396 |  |
| 54 | 4.9 User Flow | Luồng/Kiến trúc | `54_4-9_so-do-luong-nguoi-dung-user-flow_flow` | 1568×1668 |  |
