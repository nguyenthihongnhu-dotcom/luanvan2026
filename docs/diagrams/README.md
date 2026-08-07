# Thư mục sơ đồ (diagrams)

Toàn bộ 68 sơ đồ trong [../../THIET_KE_HE_THONG.md](../../THIET_KE_HE_THONG.md) được render sẵn ra ảnh.

## Nguồn sự thật: mã nguồn, không phải tài liệu cũ

Bộ sơ đồ này được dựng lại bằng cách **đọc mã nguồn đang chạy**, không chép lại tài liệu trước đó. Cụ thể, mọi tên endpoint, tên quyền, mã lỗi, tên bảng và tên cột trong sơ đồ đều lấy nguyên văn từ:

- `backend/src/modules/*/*.routes.ts` — đường dẫn API và quyền gắn kèm `requirePermission`
- `backend/src/modules/*/*.service.ts` — mã lỗi nghiệp vụ và mã HTTP
- `backend/src/modules/*/*.repository.ts` — thứ tự câu lệnh SQL trong từng giao dịch
- `backend/warehouse_management_mysql.sql` — `ENUM` trạng thái, ràng buộc, dữ liệu phân quyền khởi tạo
- `frontend/src/app/router/AppRouter.tsx` — đường dẫn màn hình dùng cho sơ đồ luồng người dùng

Những chỗ lược đồ cơ sở dữ liệu rộng hơn phần đã cài đặt được liệt kê ở **Phụ lục C** của tài liệu thiết kế; sơ đồ chỉ vẽ phần đã cài đặt.

## Quy ước trình bày (theo chuẩn BA/PM)

- **Trắng đen, không màu trang trí**: nền node trắng, viền đen, chữ đen; không đổ bóng, không gradient, không emoji.
- **Đường nối gấp khúc 90°** (`curve: stepAfter` trong Mermaid, `linetype ortho` trong PlantUML), không dùng đường cong hay đường chéo; node sắp theo luồng chính trước, nhánh phụ sau để hạn chế đường cắt nhau.
- **Khoảng thở**: `nodeSpacing 60`, `rankSpacing 70`, `padding 12`.
- **Sơ đồ luồng/hoạt động**: đúng một node `Bắt đầu`, một hoặc nhiều node `Kết thúc` **có nêu trạng thái kết quả** (ví dụ *Kết thúc: Tồn kho không đổi*). Mọi nhánh của hình thoi quyết định đều có nhãn và đều dẫn tới điểm kết thúc hoặc vòng ngược về bước trước — không có nhánh cụt.
- **Sơ đồ tuần tự**: ẩn footbox (`mirrorActors: false`); mọi request đều có response, kể cả nhánh lỗi trong `alt`/`else`.
- **Sơ đồ trạng thái**: mỗi transition ghi rõ **endpoint** gây chuyển trạng thái, ví dụ `POST /:id/confirm`; tên trạng thái khớp nguyên văn `ENUM` trong lược đồ CSDL.
- **Ngôn ngữ**: diễn giải tiếng Việt; giữ tiếng Anh cho giá trị `ENUM`, tên bảng và cột, mã lỗi (`INSUFFICIENT_STOCK`, `SELF_APPROVAL_NOT_ALLOWED`…), tên quyền và câu lệnh SQL.

## Sơ đồ luồng dùng bản draw.io để không có đường cắt nhau

Mermaid để thư viện dagre tự dàn trang, không cho can thiệp vào đường đi, nên các sơ đồ có nhánh quay ngược (nhánh lỗi sửa rồi thử lại, vòng lặp *còn dòng hàng*) luôn sinh ra đường cắt qua nhau. Vì vậy **25 sơ đồ luồng** được sinh thêm bản `.drawio` bằng `docs/gen-drawio.mjs`, với bố cục do script tự đặt tọa độ:

- Nhánh chính chạy dọc ở cột giữa; mỗi nhánh rẽ treo sang trái, bắt đầu ở hàng **dưới** node quyết định nên đoạn nối ngang luôn đi qua vùng trống.
- Nhánh chính chỉ đi tiếp sau khi mọi nhánh rẽ tại bước đó đã kết thúc, nhờ vậy các cột nhánh không bao giờ chồng khoảng y.
- Node quyết định có từ 3 nhánh trở lên dùng một **trục dọc chung**, các nhánh xếp chồng trong cùng một cột — vừa hẹp hơn nhiều, vừa tách được nhãn của từng nhánh ra các độ cao khác nhau.
- Cạnh quay ngược đi theo **kênh dọc riêng** phía ngoài cùng bên trái, cạnh có khoảng cách ngắn nằm ở kênh gần hơn nên các kênh lồng nhau chứ không cắt nhau.
- Mọi cạnh dùng `edgeStyle=orthogonalEdgeStyle;rounded=0` → gấp khúc 90°, không đường cong, không đường chéo.

Với 25 sơ đồ này, **`.png`/`.svg` được export từ bản `.drawio`**, không phải từ Mermaid. File `.mmd` vẫn giữ làm nguồn nội dung (bố cục draw.io được sinh lại từ chính nó), và khối mermaid trong tài liệu thiết kế vẫn dùng để xem nhanh trên GitHub/VS Code. Nội dung hai bản luôn khớp nhau vì cùng sinh từ một nguồn; chỉ khác cách dàn trang.

Muốn chỉnh tay: mở file `.drawio` bằng [draw.io](https://app.diagrams.net) hoặc extension *Draw.io Integration* trong VS Code. Lưu ý chạy lại `gen-drawio.mjs` sẽ **ghi đè** chỉnh sửa tay.

> **Một hạn chế đã biết:** bảy sơ đồ ERD (14–20) vẫn vẽ đường quan hệ hơi cong. Bộ render `erDiagram` của Mermaid dùng đường cong cố định trong mã nguồn, không nhận tham số `curve`, nên không ép về gấp khúc 90° được. Ký hiệu chân gà (crow's foot) và nhãn khóa ngoại vẫn đúng chuẩn. Nếu bắt buộc phải có đường thẳng tuyệt đối, cần vẽ lại bằng draw.io.

## File và cách chèn vào Word

- Mỗi sơ đồ có 3 file cùng tên: nguồn (`.mmd`, hoặc `.drawio` với sơ đồ 12), `.png` (raster nền trắng, 2x) và `.svg` (vector).
- **Chèn Word nên dùng `.svg`**: Insert > Pictures > chọn SVG.
- Sơ đồ cao trên 3200 px (cột *Ghi chú*) nên đặt riêng một trang.

## Cách render lại

```bash
# Sơ đồ luồng có bản .drawio — export từ draw.io (ảnh chính thức)
draw.io --no-sandbox -x -f svg -b 10 -o <ten-file>.svg <ten-file>.drawio
draw.io --no-sandbox -x -f png -s 2 -b 10 -o <ten-file>.png <ten-file>.drawio

# Sơ đồ chỉ có Mermaid (tuần tự, trạng thái, ERD, lớp, kiến trúc)
npx -y @mermaid-js/mermaid-cli -i <ten-file>.mmd -o <ten-file>.svg -b white
npx -y @mermaid-js/mermaid-cli -i <ten-file>.mmd -o <ten-file>.png -b white -s 2

# Sơ đồ 12 (use case) — nguồn là .drawio, render như các sơ đồ .drawio khác
draw.io --no-sandbox -x -f svg -b 10 -o 12_2-4-3_so-do-use-case-tong-quat_usecase.svg 12_2-4-3_so-do-use-case-tong-quat_usecase.drawio
draw.io --no-sandbox -x -f png -s 2 -b 10 -o 12_2-4-3_so-do-use-case-tong-quat_usecase.png 12_2-4-3_so-do-use-case-tong-quat_usecase.drawio
```

Quy trình sửa hàng loạt:

1. `node docs/insert-sections.mjs` — chèn mục mới vào `THIET_KE_HE_THONG.md` (chạy nhiều lần vẫn an toàn)
2. `node docs/regen-diagrams.mjs` — ghi lại toàn bộ `.mmd` và đồng bộ khối mermaid trong tài liệu
3. `node docs/gen-drawio.mjs` — sinh lại các bản `.drawio` từ `.mmd`
4. Render lại bằng lệnh ở trên
5. `node docs/check-diagrams.mjs` — kiểm tra nhánh cụt, cạnh quyết định thiếu nhãn, màu sót lại
6. `node docs/gen-readme.mjs` — sinh lại bảng dưới đây

> **Vì sao sơ đồ 12 dùng draw.io:** Mermaid không có ký hiệu chuẩn cho use case diagram (không hình người que, không ranh giới hệ thống, không quan hệ tổng quát hóa). Bản PlantUML trước đó đúng notation nhưng `linetype ortho` đẩy các đường đi vòng và cắt nhau, nên chuyển sang draw.io để đặt tọa độ thủ công: ba actor xếp một cột bên trái theo thứ tự kế thừa, khối use case của mỗi actor chiếm một dải y không chồng lấn khối của actor khác, hai mũi tên kế thừa chạy trong hai làn riêng bên trái — nhờ vậy không đường nào cắt nhau. File `.puml` cũ vẫn giữ để đối chiếu.

## Danh sách

| STT | Mục | Loại | Nguồn | Tên file (bỏ đuôi) | KT PNG (px) | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | 2.4.1 Quy trình nghiệp vụ | Luồng/Hoạt động | `.mmd` + `.drawio` | `01_2-4-1_quy-trinh-chung-cua-mot-chung-tu-kho_flow` | 1843×3803 | Cao — đặt trang riêng, nên dùng SVG |
| 02 | 2.4.1 Quy trình nghiệp vụ | Luồng/Hoạt động | `.mmd` + `.drawio` | `02_2-4-1_1-quy-trinh-nhap-kho-goods-receipt_flow` | 2731×4287 | Cao — đặt trang riêng, nên dùng SVG |
| 03 | 2.4.1 Quy trình nghiệp vụ | Luồng/Hoạt động | `.mmd` + `.drawio` | `03_2-4-1_2-quy-trinh-xuat-kho-goods-issue_flow` | 1963×4351 | Cao — đặt trang riêng, nên dùng SVG |
| 04 | 2.4.1 Quy trình nghiệp vụ | Luồng/Hoạt động | `.mmd` + `.drawio` | `04_2-4-1_3-quy-trinh-chuyen-kho-stock-transfer_flow` | 1895×3995 | Cao — đặt trang riêng, nên dùng SVG |
| 05 | 2.4.1 Quy trình nghiệp vụ | Trạng thái | `.mmd` | `05_2-4-1_4-quy-trinh-kiem-ke-stock-count_state` | 872×1378 |  |
| 06 | 2.4.1 Quy trình nghiệp vụ | Trạng thái | `.mmd` | `06_2-4-1_5-quy-trinh-dieu-chinh-ton-stock-adjustment_state` | 1308×824 |  |
| 07 | 2.4.1 Quy trình nghiệp vụ | Luồng/Hoạt động | `.mmd` + `.drawio` | `07_2-4-1_6-quy-trinh-xac-thuc-va-phan-quyen_flow` | 2083×4863 | Cao — đặt trang riêng, nên dùng SVG |
| 08 | 2.4.1 Quy trình nghiệp vụ | Luồng/Hoạt động | `.mmd` + `.drawio` | `08_2-4-1_7-quy-trinh-dao-chung-tu-reverse_flow` | 1819×4095 | Cao — đặt trang riêng, nên dùng SVG |
| 09 | 2.4.1 Quy trình nghiệp vụ | Luồng/Hoạt động | `.mmd` + `.drawio` | `09_2-4-1_8-quy-trinh-nhan-nhanh-qr-quick-receive_flow` | 2013×3571 | Cao — đặt trang riêng, nên dùng SVG |
| 10 | 2.4.1 Quy trình nghiệp vụ | Luồng/Hoạt động | `.mmd` + `.drawio` | `10_2-4-1_9-quy-trinh-canh-bao-va-thong-bao_flow` | 1843×3699 | Cao — đặt trang riêng, nên dùng SVG |
| 11 | 2.4.2 Sơ đồ chức năng | Luồng/Hoạt động | `.mmd` | `11_2-4-2_so-do-chuc-nang_flow` | 1560×6128 | Cao — đặt trang riêng, nên dùng SVG |
| 12 | 2.4.3 Use case tổng quát | Use case (UML) | `.drawio` | `12_2-4-3_so-do-use-case-tong-quat_usecase` | 1448×2920 |  |
| 13 | 3.1.1 Mô hình ý niệm | Luồng/Hoạt động | `.mmd` | `13_3-1-1_muc-y-niem-conceptual_flow` | 2542×550 |  |
| 14 | 3.1.2 Mô hình luận lý | ERD | `.mmd` | `14_3-1-2_a-xac-thuc-va-phan-quyen_erd` | 1710×1660 |  |
| 15 | 3.1.2 Mô hình luận lý | ERD | `.mmd` | `15_3-1-2_b-cau-truc-kho_erd` | 1214×2006 |  |
| 16 | 3.1.2 Mô hình luận lý | ERD | `.mmd` | `16_3-1-2_c-danh-muc-va-lo-hang_erd` | 1714×2510 |  |
| 17 | 3.1.2 Mô hình luận lý | ERD | `.mmd` | `17_3-1-2_d-ton-theo-vi-tri_erd` | 1668×1170 |  |
| 18 | 3.1.2 Mô hình luận lý | ERD | `.mmd` | `18_3-1-2_e-lich-su-giao-dich_erd` | 2276×1822 |  |
| 19 | 3.1.2 Mô hình luận lý | ERD | `.mmd` | `19_3-1-2_f-chung-tu-nghiep-vu_erd` | 3752×1732 |  |
| 20 | 3.1.2 Mô hình luận lý | ERD | `.mmd` | `20_3-1-2_g-van-hanh-va-he-thong_erd` | 3652×1098 |  |
| 21 | 3.2.2 Sơ đồ tuần tự | Tuần tự | `.mmd` | `21_3-2-2_sequence-1-dang-nhap_sequence` | 3932×3954 | Cao — đặt trang riêng, nên dùng SVG |
| 22 | 3.2.2 Sơ đồ tuần tự | Tuần tự | `.mmd` | `22_3-2-2_sequence-2-xac-nhan-phieu-xuat-kho-fefo_sequence` | 5994×5348 | Cao — đặt trang riêng, nên dùng SVG |
| 23 | 3.2.2 Sơ đồ tuần tự | Tuần tự | `.mmd` | `23_3-2-2_sequence-3-tao-phieu-nhap-kho_sequence` | 4346×1982 |  |
| 24 | 3.2.2 Sơ đồ tuần tự | Tuần tự | `.mmd` | `24_3-2-2_sequence-4-duyet-phieu-dieu-chinh-ton_sequence` | 3690×3238 | Cao — đặt trang riêng, nên dùng SVG |
| 25 | 3.2.2 Sơ đồ tuần tự | Tuần tự | `.mmd` | `25_3-2-2_sequence-5-lam-moi-token-va-dang-xuat_sequence` | 3934×2642 |  |
| 26 | 3.2.2 Sơ đồ tuần tự | Tuần tự | `.mmd` | `26_3-2-2_sequence-6-dao-phieu-nhap-kho_sequence` | 3798×3532 | Cao — đặt trang riêng, nên dùng SVG |
| 27 | 3.2.2 Sơ đồ tuần tự | Tuần tự | `.mmd` | `27_3-2-2_sequence-7-duyet-kiem-ke-sinh-phieu-dieu-chinh_sequence` | 3748×3104 |  |
| 28 | 3.2.3 Sơ đồ hoạt động | Luồng/Hoạt động | `.mmd` + `.drawio` | `28_3-2-3_activity-1-xac-nhan-phieu-xuat-kho-theo-fefo_flow` | 2181×5767 | Cao — đặt trang riêng, nên dùng SVG |
| 29 | 3.2.3 Sơ đồ hoạt động | Luồng/Hoạt động | `.mmd` + `.drawio` | `29_3-2-3_activity-2-quy-trinh-kiem-ke_flow` | 1883×5087 | Cao — đặt trang riêng, nên dùng SVG |
| 30 | 3.2.3 Sơ đồ hoạt động | Luồng/Hoạt động | `.mmd` + `.drawio` | `30_3-2-3_activity-3-phan-quyen-request-bat-ky_flow` | 1901×3687 | Cao — đặt trang riêng, nên dùng SVG |
| 31 | 3.2.3 Sơ đồ hoạt động | Luồng/Hoạt động | `.mmd` + `.drawio` | `31_3-2-3_activity-4-nhan-nhanh-qr_flow` | 1995×4323 | Cao — đặt trang riêng, nên dùng SVG |
| 32 | 3.2.3 Sơ đồ hoạt động | Luồng/Hoạt động | `.mmd` + `.drawio` | `32_3-2-3_activity-5-sinh-canh-bao-va-thong-bao_flow` | 2657×3807 | Cao — đặt trang riêng, nên dùng SVG |
| 33 | 3.3.1 Nhập kho | Tuần tự | `.mmd` | `33_3-3-1_chuc-nang-nhap-kho-goods-receipt_sequence` | 4026×4122 | Cao — đặt trang riêng, nên dùng SVG |
| 34 | 3.3.1 Nhập kho | Luồng/Hoạt động | `.mmd` + `.drawio` | `34_3-3-1_chuc-nang-nhap-kho-goods-receipt_flow` | 2765×4515 | Cao — đặt trang riêng, nên dùng SVG |
| 35 | 3.3.1 Nhập kho | Trạng thái | `.mmd` | `35_3-3-1_chuc-nang-nhap-kho-goods-receipt_state` | 552×1080 |  |
| 36 | 3.3.2 Xuất kho | Tuần tự | `.mmd` | `36_3-3-2_chuc-nang-xuat-kho-goods-issue_sequence` | 3418×3038 |  |
| 37 | 3.3.2 Xuất kho | Luồng/Hoạt động | `.mmd` + `.drawio` | `37_3-3-2_chuc-nang-xuat-kho-goods-issue_flow` | 1889×4299 | Cao — đặt trang riêng, nên dùng SVG |
| 38 | 3.3.2 Xuất kho | Trạng thái | `.mmd` | `38_3-3-2_chuc-nang-xuat-kho-goods-issue_state` | 552×1080 |  |
| 39 | 3.3.3 Chuyển kho | Tuần tự | `.mmd` | `39_3-3-3_chuc-nang-chuyen-kho-stock-transfer_sequence` | 3206×3230 | Cao — đặt trang riêng, nên dùng SVG |
| 40 | 3.3.3 Chuyển kho | Luồng/Hoạt động | `.mmd` + `.drawio` | `40_3-3-3_chuc-nang-chuyen-kho-stock-transfer_flow` | 1895×3995 | Cao — đặt trang riêng, nên dùng SVG |
| 41 | 3.3.3 Chuyển kho | Trạng thái | `.mmd` | `41_3-3-3_chuc-nang-chuyen-kho-stock-transfer_state` | 552×1080 |  |
| 42 | 3.3.4 Kiểm kê | Tuần tự | `.mmd` | `42_3-3-4_chuc-nang-kiem-ke-stock-count_sequence` | 3560×3992 | Cao — đặt trang riêng, nên dùng SVG |
| 43 | 3.3.4 Kiểm kê | Luồng/Hoạt động | `.mmd` + `.drawio` | `43_3-3-4_chuc-nang-kiem-ke-stock-count_flow` | 1615×3595 | Cao — đặt trang riêng, nên dùng SVG |
| 44 | 3.3.4 Kiểm kê | Trạng thái | `.mmd` | `44_3-3-4_chuc-nang-kiem-ke-stock-count_state` | 710×1294 |  |
| 45 | 3.3.5 Điều chỉnh tồn | Tuần tự | `.mmd` | `45_3-3-5_chuc-nang-dieu-chinh-ton-stock-adjustment_sequence` | 3840×3166 |  |
| 46 | 3.3.5 Điều chỉnh tồn | Luồng/Hoạt động | `.mmd` + `.drawio` | `46_3-3-5_chuc-nang-dieu-chinh-ton-stock-adjustment_flow` | 2607×5219 | Cao — đặt trang riêng, nên dùng SVG |
| 47 | 3.3.5 Điều chỉnh tồn | Trạng thái | `.mmd` | `47_3-3-5_chuc-nang-dieu-chinh-ton-stock-adjustment_state` | 1160×782 |  |
| 48 | 3.3.6 Sản phẩm và SKU | Tuần tự | `.mmd` | `48_3-3-6_chuc-nang-quan-ly-san-pham-va-sku-catalog_sequence` | 3618×2274 |  |
| 49 | 3.3.6 Sản phẩm và SKU | Luồng/Hoạt động | `.mmd` + `.drawio` | `49_3-3-6_chuc-nang-quan-ly-san-pham-va-sku-catalog_flow` | 1665×2639 |  |
| 50 | 3.3.6 Sản phẩm và SKU | Trạng thái | `.mmd` | `50_3-3-6_chuc-nang-quan-ly-san-pham-va-sku-catalog_state` | 1176×1132 |  |
| 51 | 3.3.7 Người dùng và phân quyền | Tuần tự | `.mmd` | `51_3-3-7_chuc-nang-quan-ly-nguoi-dung-va-phan-quyen_sequence` | 3828×3070 |  |
| 52 | 3.3.7 Người dùng và phân quyền | Luồng/Hoạt động | `.mmd` + `.drawio` | `52_3-3-7_chuc-nang-quan-ly-nguoi-dung-va-phan-quyen_flow` | 1635×3367 | Cao — đặt trang riêng, nên dùng SVG |
| 53 | 3.3.7 Người dùng và phân quyền | Trạng thái | `.mmd` | `53_3-3-7_chuc-nang-quan-ly-nguoi-dung-va-phan-quyen_state` | 2050×876 |  |
| 54 | 3.3.8 Cấu trúc kho | Tuần tự | `.mmd` | `54_3-3-8_chuc-nang-quan-ly-cau-truc-kho_sequence` | 4034×3226 | Cao — đặt trang riêng, nên dùng SVG |
| 55 | 3.3.8 Cấu trúc kho | Luồng/Hoạt động | `.mmd` + `.drawio` | `55_3-3-8_chuc-nang-quan-ly-cau-truc-kho_flow` | 2529×4311 | Cao — đặt trang riêng, nên dùng SVG |
| 56 | 3.3.9 Cảnh báo và thông báo | Luồng/Hoạt động | `.mmd` + `.drawio` | `56_3-3-9_chuc-nang-canh-bao-va-thong-bao_flow` | 1615×4119 | Cao — đặt trang riêng, nên dùng SVG |
| 57 | 3.3.9 Cảnh báo và thông báo | Trạng thái | `.mmd` | `57_3-3-9_chuc-nang-canh-bao-va-thong-bao_state` | 762×1132 |  |
| 58 | 3.3.10 Báo cáo và nhật ký | Luồng/Hoạt động | `.mmd` + `.drawio` | `58_3-3-10_chuc-nang-bao-cao-va-nhat-ky-thao-tac_flow` | 2747×3899 | Cao — đặt trang riêng, nên dùng SVG |
| 59 | 4.1 Context Diagram | Luồng/Hoạt động | `.mmd` | `59_4-1_so-do-ngu-canh-context-diagram-c4-level-1_flow` | 1312×782 |  |
| 60 | 4.2 BPMN (swimlane) | Luồng/Hoạt động | `.mmd` | `60_4-2_so-do-bpmn-quy-trinh-nhap-kho-dang-lane_flow` | 1044×3240 | Cao — đặt trang riêng, nên dùng SVG |
| 61 | 4.3 DFD | Luồng/Hoạt động | `.mmd` | `61_4-3_so-do-luong-du-lieu-data-flow-diagram-dfd_flow` | 3490×772 |  |
| 62 | 4.4 Class Diagram | Lớp | `.mmd` | `62_4-4_so-do-lop-class-diagram-mo-hinh-mien_class` | 1568×1186 |  |
| 63 | 4.5 Component Diagram | Luồng/Hoạt động | `.mmd` | `63_4-5_so-do-thanh-phan-component-diagram_flow` | 974×2662 |  |
| 64 | 4.6 Deployment Diagram | Luồng/Hoạt động | `.mmd` | `64_4-6_so-do-trien-khai-deployment-diagram_flow` | 1316×1382 |  |
| 65 | 4.7 C4 Model | Luồng/Hoạt động | `.mmd` | `65_4-7_c4-level-2-container_flow` | 688×1204 |  |
| 66 | 4.7 C4 Model | Luồng/Hoạt động | `.mmd` | `66_4-7_c4-level-3-component_flow` | 2734×1518 |  |
| 67 | 4.8 Package Diagram | Luồng/Hoạt động | `.mmd` | `67_4-8_so-do-goi-package-diagram_flow` | 3746×882 |  |
| 68 | 4.9 User Flow | Luồng/Hoạt động | `.mmd` + `.drawio` | `68_4-9_so-do-luong-nguoi-dung-user-flow_flow` | 2627×3635 | Cao — đặt trang riêng, nên dùng SVG |
