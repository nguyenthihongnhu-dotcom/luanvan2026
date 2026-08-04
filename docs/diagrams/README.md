# Thư mục sơ đồ (diagrams)

Toàn bộ 54 sơ đồ trong [../../THIET_KE_HE_THONG.md](../../THIET_KE_HE_THONG.md) được render sẵn ra ảnh.

## Quy ước trình bày (theo chuẩn BA/PM)

Tất cả sơ đồ đã được vẽ lại theo cùng một bộ quy ước:

- **Trắng đen, không màu trang trí**: nền node trắng, viền đen, chữ đen; không đổ bóng, không gradient, không emoji/icon.
- **Đường nối gấp khúc 90°** (`curve: stepAfter` trong Mermaid, `linetype ortho` trong PlantUML), không dùng đường cong hay đường chéo; các node được sắp theo luồng chính trước, nhánh phụ sau để hạn chế đường cắt nhau.
- **Khoảng thở**: `nodeSpacing 60`, `rankSpacing 70`, `padding 12` — chữ không dính sát viền khung.
- **Sơ đồ luồng/hoạt động**: bắt đầu bằng đúng một node `Bắt đầu`, kết thúc bằng một hoặc nhiều node `Kết thúc` **có nêu trạng thái kết quả** (ví dụ *Kết thúc: Tồn kho không đổi*). Mọi nhánh của hình thoi quyết định đều có nhãn và đều dẫn tới một điểm kết thúc hoặc vòng ngược về bước trước — không có nhánh cụt.
- **Sơ đồ tuần tự**: đã ẩn footbox (`mirrorActors: false`) nên tên participant chỉ xuất hiện ở đầu sơ đồ; mọi request đều có response tương ứng, kể cả nhánh lỗi (`alt`/`else`).
- **Sơ đồ trạng thái**: mỗi transition đều ghi rõ sự kiện gây chuyển trạng thái; tên trạng thái khớp nguyên văn với `ENUM` trong `backend/warehouse_management_mysql.sql`.
- **Ngôn ngữ**: diễn giải bằng tiếng Việt; giữ nguyên tiếng Anh cho **giá trị enum** (`DRAFT`, `CONFIRMED`, `RECEIPT`, `REVERSAL`…), **tên bảng/cột** trong ERD và Class, **mã lỗi** (`INSUFFICIENT_STOCK`, `SELF_APPROVAL_FORBIDDEN`…) và câu lệnh SQL trong sơ đồ tuần tự.

> **Một hạn chế đã biết:** sáu sơ đồ ERD (11–16) vẫn vẽ đường quan hệ hơi cong. Bộ render `erDiagram` của Mermaid dùng đường cong cố định trong mã nguồn, không nhận tham số `curve`, nên không ép về gấp khúc 90° được. Ký hiệu chân gà (crow's foot) và nhãn khóa ngoại vẫn đúng chuẩn. Nếu bắt buộc phải có đường thẳng tuyệt đối, cần vẽ lại bằng draw.io.

## File và cách chèn vào Word

- Mỗi sơ đồ có 3 file cùng tên: nguồn (`.mmd` hoặc `.puml`), `.png` (raster nền trắng, 2x) và `.svg` (vector).
- **Chèn Word nên dùng `.svg`**: Insert > Pictures > chọn SVG (vector, phóng to nhỏ vẫn nét, tự vừa cột).
- Sơ đồ nào cao trên 3200 px (cột *Ghi chú*) nên đặt riêng một trang.

## Cách render lại

Sau khi sửa nguồn, chạy lại lệnh tương ứng trong thư mục này:

```bash
# 53 sơ đồ Mermaid
npx -y @mermaid-js/mermaid-cli -i <ten-file>.mmd -o <ten-file>.svg -b white
npx -y @mermaid-js/mermaid-cli -i <ten-file>.mmd -o <ten-file>.png -b white -s 2

# Sơ đồ 09 (PlantUML) — cần plantuml.jar và Java
java -jar plantuml.jar -charset UTF-8 -tsvg 09_2-4-3_so-do-use-case-tong-quat_flow.puml
java -jar plantuml.jar -charset UTF-8 -Sdpi=192 -tpng 09_2-4-3_so-do-use-case-tong-quat_flow.puml
```

Muốn sửa hàng loạt thì sửa trong `docs/regen-diagrams.mjs` rồi chạy `node docs/regen-diagrams.mjs` — script ghi lại toàn bộ `.mmd` và đồng bộ luôn các khối mermaid trong `THIET_KE_HE_THONG.md`.

> **Vì sao sơ đồ 09 dùng PlantUML:** Mermaid không có ký hiệu chuẩn cho use case diagram (không có hình người que, không có ranh giới hệ thống), vẽ bằng Mermaid sẽ ra sơ đồ sai notation và dàn thành một hàng rất dài. PlantUML cho đúng actor hình người que, use case hình elip và khung `rectangle` làm ranh giới hệ thống.

## Danh sách

| STT | Mục | Loại | Nguồn | Tên file (bỏ đuôi) | KT PNG (px) | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | 2.4.1 Quy trình nghiệp vụ | Luồng/Kiến trúc | `.mmd` | `01_2-4-1_quy-trinh-chung-cua-mot-chung-tu-kho_flow` | 1810×3824 | Cao — đặt trang riêng, nên dùng SVG |
| 02 | 2.4.1 Quy trình nghiệp vụ | Luồng/Kiến trúc | `.mmd` | `02_2-4-1_1-quy-trinh-nhap-kho-goods-receipt_flow` | 1874×4448 | Cao — đặt trang riêng, nên dùng SVG |
| 03 | 2.4.1 Quy trình nghiệp vụ | Luồng/Kiến trúc | `.mmd` | `03_2-4-1_2-quy-trinh-xuat-kho-goods-issue_flow` | 1426×3866 | Cao — đặt trang riêng, nên dùng SVG |
| 04 | 2.4.1 Quy trình nghiệp vụ | Luồng/Kiến trúc | `.mmd` | `04_2-4-1_3-quy-trinh-chuyen-kho-stock-transfer_flow` | 1716×3406 | Cao — đặt trang riêng, nên dùng SVG |
| 05 | 2.4.1 Quy trình nghiệp vụ | Trạng thái | `.mmd` | `05_2-4-1_4-quy-trinh-kiem-ke-stock-count_state` | 1398×1336 |  |
| 06 | 2.4.1 Quy trình nghiệp vụ | Trạng thái | `.mmd` | `06_2-4-1_5-quy-trinh-dieu-chinh-ton-stock-adjustment_state` | 920×1038 |  |
| 07 | 2.4.1 Quy trình nghiệp vụ | Luồng/Kiến trúc | `.mmd` | `07_2-4-1_6-quy-trinh-xac-thuc-va-phan-quyen_flow` | 1392×3768 | Cao — đặt trang riêng, nên dùng SVG |
| 08 | 2.4.2 Sơ đồ chức năng | Luồng/Kiến trúc | `.mmd` | `08_2-4-2_so-do-chuc-nang_flow` | 1560×4616 | Cao — đặt trang riêng, nên dùng SVG |
| 09 | 2.4.3 Use case tổng quát | Use case (UML) | `.puml` | `09_2-4-3_so-do-use-case-tong-quat_flow` | 666×2110 |  |
| 10 | 3.1.1 Mô hình ý niệm | Luồng/Kiến trúc | `.mmd` | `10_3-1-1_muc-y-niem-conceptual_flow` | 2542×542 |  |
| 11 | 3.1.2 Mô hình luận lý | ERD | `.mmd` | `11_3-1-2_muc-luan-ly-logical_erd` | 1650×1516 |  |
| 12 | 3.1.2 Mô hình luận lý | ERD | `.mmd` | `12_3-1-2_muc-luan-ly-logical_erd` | 1206×1862 |  |
| 13 | 3.1.2 Mô hình luận lý | ERD | `.mmd` | `13_3-1-2_muc-luan-ly-logical_erd` | 1714×2366 |  |
| 14 | 3.1.2 Mô hình luận lý | ERD | `.mmd` | `14_3-1-2_muc-luan-ly-logical_erd` | 1668×1170 |  |
| 15 | 3.1.2 Mô hình luận lý | ERD | `.mmd` | `15_3-1-2_muc-luan-ly-logical_erd` | 2276×1242 |  |
| 16 | 3.1.2 Mô hình luận lý | ERD | `.mmd` | `16_3-1-2_muc-luan-ly-logical_erd` | 3774×1026 |  |
| 17 | 3.2.2 Sơ đồ tuần tự | Tuần tự | `.mmd` | `17_3-2-2_sequence-1-dang-nhap_sequence` | 3794×2262 |  |
| 18 | 3.2.2 Sơ đồ tuần tự | Tuần tự | `.mmd` | `18_3-2-2_sequence-2-xac-nhan-phieu-xuat-kho-fefo-nghiep-vu-loi_sequence` | 4672×3052 |  |
| 19 | 3.2.2 Sơ đồ tuần tự | Tuần tự | `.mmd` | `19_3-2-2_sequence-3-tao-phieu-nhap-kho_sequence` | 4028×1718 |  |
| 20 | 3.2.2 Sơ đồ tuần tự | Tuần tự | `.mmd` | `20_3-2-2_sequence-4-duyet-phieu-dieu-chinh-ton_sequence` | 3396×1642 |  |
| 21 | 3.2.3 Sơ đồ hoạt động | Luồng/Kiến trúc | `.mmd` | `21_3-2-3_activity-1-xac-nhan-phieu-xuat-kho-theo-fefo_flow` | 1408×5206 | Cao — đặt trang riêng, nên dùng SVG |
| 22 | 3.2.3 Sơ đồ hoạt động | Luồng/Kiến trúc | `.mmd` | `22_3-2-3_activity-2-quy-trinh-kiem-ke_flow` | 1636×4034 | Cao — đặt trang riêng, nên dùng SVG |
| 23 | 3.2.3 Sơ đồ hoạt động | Luồng/Kiến trúc | `.mmd` | `23_3-2-3_activity-3-phan-quyen-request-bat-ky_flow` | 1506×3438 | Cao — đặt trang riêng, nên dùng SVG |
| 24 | 3.3.1 Nhập kho | Tuần tự | `.mmd` | `24_3-3-1_chuc-nang-nhap-kho-goods-receipt_sequence` | 3936×2284 |  |
| 25 | 3.3.1 Nhập kho | Luồng/Kiến trúc | `.mmd` | `25_3-3-1_chuc-nang-nhap-kho-goods-receipt_flow` | 1872×4678 | Cao — đặt trang riêng, nên dùng SVG |
| 26 | 3.3.1 Nhập kho | Trạng thái | `.mmd` | `26_3-3-1_chuc-nang-nhap-kho-goods-receipt_state` | 956×1252 |  |
| 27 | 3.3.2 Xuất kho | Tuần tự | `.mmd` | `27_3-3-2_chuc-nang-xuat-kho-goods-issue_sequence` | 3228×1952 |  |
| 28 | 3.3.2 Xuất kho | Luồng/Kiến trúc | `.mmd` | `28_3-3-2_chuc-nang-xuat-kho-goods-issue_flow` | 1408×4490 | Cao — đặt trang riêng, nên dùng SVG |
| 29 | 3.3.2 Xuất kho | Trạng thái | `.mmd` | `29_3-3-2_chuc-nang-xuat-kho-goods-issue_state` | 956×1252 |  |
| 30 | 3.3.3 Chuyển kho | Tuần tự | `.mmd` | `30_3-3-3_chuc-nang-chuyen-kho-stock-transfer_sequence` | 3010×2144 |  |
| 31 | 3.3.3 Chuyển kho | Luồng/Kiến trúc | `.mmd` | `31_3-3-3_chuc-nang-chuyen-kho-stock-transfer_flow` | 1382×3510 | Cao — đặt trang riêng, nên dùng SVG |
| 32 | 3.3.3 Chuyển kho | Trạng thái | `.mmd` | `32_3-3-3_chuc-nang-chuyen-kho-stock-transfer_state` | 956×1252 |  |
| 33 | 3.3.4 Kiểm kê | Tuần tự | `.mmd` | `33_3-3-4_chuc-nang-kiem-ke-stock-count_sequence` | 3182×2622 |  |
| 34 | 3.3.4 Kiểm kê | Luồng/Kiến trúc | `.mmd` | `34_3-3-4_chuc-nang-kiem-ke-stock-count_flow` | 1636×3720 | Cao — đặt trang riêng, nên dùng SVG |
| 35 | 3.3.4 Kiểm kê | Trạng thái | `.mmd` | `35_3-3-4_chuc-nang-kiem-ke-stock-count_state` | 1398×1336 |  |
| 36 | 3.3.5 Điều chỉnh tồn | Tuần tự | `.mmd` | `36_3-3-5_chuc-nang-dieu-chinh-ton-stock-adjustment_sequence` | 3158×2390 |  |
| 37 | 3.3.5 Điều chỉnh tồn | Luồng/Kiến trúc | `.mmd` | `37_3-3-5_chuc-nang-dieu-chinh-ton-stock-adjustment_flow` | 2038×2956 |  |
| 38 | 3.3.5 Điều chỉnh tồn | Trạng thái | `.mmd` | `38_3-3-5_chuc-nang-dieu-chinh-ton-stock-adjustment_state` | 920×1038 |  |
| 39 | 3.3.6 Sản phẩm và SKU | Tuần tự | `.mmd` | `39_3-3-6_chuc-nang-quan-ly-san-pham-va-sku-catalog_sequence` | 4202×1614 |  |
| 40 | 3.3.6 Sản phẩm và SKU | Luồng/Kiến trúc | `.mmd` | `40_3-3-6_chuc-nang-quan-ly-san-pham-va-sku-catalog_flow` | 1032×2064 |  |
| 41 | 3.3.6 Sản phẩm và SKU | Trạng thái | `.mmd` | `41_3-3-6_chuc-nang-quan-ly-san-pham-va-sku-catalog_state` | 1096×1038 |  |
| 42 | 3.3.7 Người dùng và phân quyền | Tuần tự | `.mmd` | `42_3-3-7_chuc-nang-quan-ly-nguoi-dung-va-phan-quyen_sequence` | 3368×1902 |  |
| 43 | 3.3.7 Người dùng và phân quyền | Luồng/Kiến trúc | `.mmd` | `43_3-3-7_chuc-nang-quan-ly-nguoi-dung-va-phan-quyen_flow` | 1758×2714 |  |
| 44 | 3.3.7 Người dùng và phân quyền | Trạng thái | `.mmd` | `44_3-3-7_chuc-nang-quan-ly-nguoi-dung-va-phan-quyen_state` | 1092×782 |  |
| 45 | 4.1 Context Diagram | Luồng/Kiến trúc | `.mmd` | `45_4-1_so-do-ngu-canh-context-diagram-c4-level-1_flow` | 1266×740 |  |
| 46 | 4.2 BPMN (swimlane) | Luồng/Kiến trúc | `.mmd` | `46_4-2_so-do-bpmn-business-process-quy-trinh-nhap-kho-dang-lane_flow` | 1044×3010 |  |
| 47 | 4.3 DFD | Luồng/Kiến trúc | `.mmd` | `47_4-3_so-do-luong-du-lieu-data-flow-diagram-dfd_flow` | 2916×670 |  |
| 48 | 4.4 Class Diagram | Lớp | `.mmd` | `48_4-4_so-do-lop-class-diagram-mo-hinh-mien_class` | 1568×1640 |  |
| 49 | 4.5 Component Diagram | Luồng/Kiến trúc | `.mmd` | `49_4-5_so-do-thanh-phan-component-diagram_flow` | 688×2552 |  |
| 50 | 4.6 Deployment Diagram | Luồng/Kiến trúc | `.mmd` | `50_4-6_so-do-trien-khai-deployment-diagram_flow` | 1316×1382 |  |
| 51 | 4.7 C4 Model | Luồng/Kiến trúc | `.mmd` | `51_4-7_c4-model_flow` | 688×1354 |  |
| 52 | 4.7 C4 Model | Luồng/Kiến trúc | `.mmd` | `52_4-7_c4-model_flow` | 2390×1266 |  |
| 53 | 4.8 Package Diagram | Luồng/Kiến trúc | `.mmd` | `53_4-8_so-do-goi-package-diagram-cau-truc-ma-nguon_flow` | 3746×840 |  |
| 54 | 4.9 User Flow | Luồng/Kiến trúc | `.mmd` | `54_4-9_so-do-luong-nguoi-dung-user-flow_flow` | 3322×2682 |  |
