// Sinh lại docs/diagrams/README.md kèm kích thước PNG thật đo được từ file.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'diagrams');

const SECTION = {
  '2-4-1': '2.4.1 Quy trình nghiệp vụ',
  '2-4-2': '2.4.2 Sơ đồ chức năng',
  '2-4-3': '2.4.3 Use case tổng quát',
  '3-1-1': '3.1.1 Mô hình ý niệm',
  '3-1-2': '3.1.2 Mô hình luận lý',
  '3-2-2': '3.2.2 Sơ đồ tuần tự',
  '3-2-3': '3.2.3 Sơ đồ hoạt động',
  '3-3-1': '3.3.1 Nhập kho',
  '3-3-2': '3.3.2 Xuất kho',
  '3-3-3': '3.3.3 Chuyển kho',
  '3-3-4': '3.3.4 Kiểm kê',
  '3-3-5': '3.3.5 Điều chỉnh tồn',
  '3-3-6': '3.3.6 Sản phẩm và SKU',
  '3-3-7': '3.3.7 Người dùng và phân quyền',
  '3-3-8': '3.3.8 Cấu trúc kho',
  '3-3-9': '3.3.9 Cảnh báo và thông báo',
  '3-3-10': '3.3.10 Báo cáo và nhật ký',
  '4-1': '4.1 Context Diagram',
  '4-2': '4.2 BPMN (swimlane)',
  '4-3': '4.3 DFD',
  '4-4': '4.4 Class Diagram',
  '4-5': '4.5 Component Diagram',
  '4-6': '4.6 Deployment Diagram',
  '4-7': '4.7 C4 Model',
  '4-8': '4.8 Package Diagram',
  '4-9': '4.9 User Flow',
};

const TYPE = {
  flow: 'Luồng/Hoạt động',
  state: 'Trạng thái',
  sequence: 'Tuần tự',
  erd: 'ERD',
  class: 'Lớp',
  usecase: 'Use case (UML)',
};

const pngSize = (f) => {
  const b = readFileSync(join(DIR, f));
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

const pngs = readdirSync(DIR)
  .filter((f) => /^\d\d_.*\.png$/.test(f))
  .sort((a, b) => Number(a.split('_')[0]) - Number(b.split('_')[0]));

const hasDrawio = new Set(
  readdirSync(DIR)
    .filter((f) => f.endsWith('.drawio'))
    .map((f) => f.replace(/\.drawio$/, '')),
);

const rows = pngs.map((f) => {
  const base = f.replace(/\.png$/, '');
  const parts = base.split('_');
  const stt = parts[0];
  const sectionKey = parts[1];
  const kind = parts[parts.length - 1];
  const [w, h] = pngSize(f);
  // Sơ đồ use case chỉ có .drawio (không sinh từ .mmd), nên phải xét trước
  // nhánh hasDrawio vốn mặc định là cặp `.mmd` + `.drawio`.
  const src = kind === 'usecase'
    ? '`.drawio`'
    : hasDrawio.has(base)
      ? '`.mmd` + `.drawio`'
      : '`.mmd`';
  const note = h > 3200 ? 'Cao — đặt trang riêng, nên dùng SVG' : '';
  const section = SECTION[sectionKey] ?? sectionKey;
  return `| ${stt} | ${section} | ${TYPE[kind] ?? kind} | ${src} | \`${base}\` | ${w}×${h} | ${note} |`;
});

const md = `# Thư mục sơ đồ (diagrams)

Toàn bộ ${rows.length} sơ đồ trong [../../THIET_KE_HE_THONG.md](../../THIET_KE_HE_THONG.md) được render sẵn ra ảnh.

## Nguồn sự thật: mã nguồn, không phải tài liệu cũ

Bộ sơ đồ này được dựng lại bằng cách **đọc mã nguồn đang chạy**, không chép lại tài liệu trước đó. Cụ thể, mọi tên endpoint, tên quyền, mã lỗi, tên bảng và tên cột trong sơ đồ đều lấy nguyên văn từ:

- \`backend/src/modules/*/*.routes.ts\` — đường dẫn API và quyền gắn kèm \`requirePermission\`
- \`backend/src/modules/*/*.service.ts\` — mã lỗi nghiệp vụ và mã HTTP
- \`backend/src/modules/*/*.repository.ts\` — thứ tự câu lệnh SQL trong từng giao dịch
- \`backend/warehouse_management_mysql.sql\` — \`ENUM\` trạng thái, ràng buộc, dữ liệu phân quyền khởi tạo
- \`frontend/src/app/router/AppRouter.tsx\` — đường dẫn màn hình dùng cho sơ đồ luồng người dùng

Những chỗ lược đồ cơ sở dữ liệu rộng hơn phần đã cài đặt được liệt kê ở **Phụ lục C** của tài liệu thiết kế; sơ đồ chỉ vẽ phần đã cài đặt.

## Quy ước trình bày (theo chuẩn BA/PM)

- **Trắng đen, không màu trang trí**: nền node trắng, viền đen, chữ đen; không đổ bóng, không gradient, không emoji.
- **Đường nối gấp khúc 90°** (\`curve: stepAfter\` trong Mermaid, \`linetype ortho\` trong PlantUML), không dùng đường cong hay đường chéo; node sắp theo luồng chính trước, nhánh phụ sau để hạn chế đường cắt nhau.
- **Khoảng thở**: \`nodeSpacing 60\`, \`rankSpacing 70\`, \`padding 12\`.
- **Sơ đồ luồng/hoạt động**: đúng một node \`Bắt đầu\`, một hoặc nhiều node \`Kết thúc\` **có nêu trạng thái kết quả** (ví dụ *Kết thúc: Tồn kho không đổi*). Mọi nhánh của hình thoi quyết định đều có nhãn và đều dẫn tới điểm kết thúc hoặc vòng ngược về bước trước — không có nhánh cụt.
- **Sơ đồ tuần tự**: ẩn footbox (\`mirrorActors: false\`); mọi request đều có response, kể cả nhánh lỗi trong \`alt\`/\`else\`.
- **Sơ đồ trạng thái**: mỗi transition ghi rõ **endpoint** gây chuyển trạng thái, ví dụ \`POST /:id/confirm\`; tên trạng thái khớp nguyên văn \`ENUM\` trong lược đồ CSDL.
- **Ngôn ngữ**: diễn giải tiếng Việt; giữ tiếng Anh cho giá trị \`ENUM\`, tên bảng và cột, mã lỗi (\`INSUFFICIENT_STOCK\`, \`SELF_APPROVAL_NOT_ALLOWED\`…), tên quyền và câu lệnh SQL.

## Sơ đồ luồng dùng bản draw.io để không có đường cắt nhau

Mermaid để thư viện dagre tự dàn trang, không cho can thiệp vào đường đi, nên các sơ đồ có nhánh quay ngược (nhánh lỗi sửa rồi thử lại, vòng lặp *còn dòng hàng*) luôn sinh ra đường cắt qua nhau. Vì vậy **${hasDrawio.size} sơ đồ luồng** được sinh thêm bản \`.drawio\` bằng \`docs/gen-drawio.mjs\`, với bố cục do script tự đặt tọa độ:

- Nhánh chính chạy dọc ở cột giữa; mỗi nhánh rẽ treo sang trái, bắt đầu ở hàng **dưới** node quyết định nên đoạn nối ngang luôn đi qua vùng trống.
- Nhánh chính chỉ đi tiếp sau khi mọi nhánh rẽ tại bước đó đã kết thúc, nhờ vậy các cột nhánh không bao giờ chồng khoảng y.
- Node quyết định có từ 3 nhánh trở lên dùng một **trục dọc chung**, các nhánh xếp chồng trong cùng một cột — vừa hẹp hơn nhiều, vừa tách được nhãn của từng nhánh ra các độ cao khác nhau.
- Cạnh quay ngược đi theo **kênh dọc riêng** phía ngoài cùng bên trái, cạnh có khoảng cách ngắn nằm ở kênh gần hơn nên các kênh lồng nhau chứ không cắt nhau.
- Mọi cạnh dùng \`edgeStyle=orthogonalEdgeStyle;rounded=0\` → gấp khúc 90°, không đường cong, không đường chéo.

Với ${hasDrawio.size} sơ đồ này, **\`.png\`/\`.svg\` được export từ bản \`.drawio\`**, không phải từ Mermaid. File \`.mmd\` vẫn giữ làm nguồn nội dung (bố cục draw.io được sinh lại từ chính nó), và khối mermaid trong tài liệu thiết kế vẫn dùng để xem nhanh trên GitHub/VS Code. Nội dung hai bản luôn khớp nhau vì cùng sinh từ một nguồn; chỉ khác cách dàn trang.

Muốn chỉnh tay: mở file \`.drawio\` bằng [draw.io](https://app.diagrams.net) hoặc extension *Draw.io Integration* trong VS Code. Lưu ý chạy lại \`gen-drawio.mjs\` sẽ **ghi đè** chỉnh sửa tay.

> **Một hạn chế đã biết:** bảy sơ đồ ERD (14–20) vẫn vẽ đường quan hệ hơi cong. Bộ render \`erDiagram\` của Mermaid dùng đường cong cố định trong mã nguồn, không nhận tham số \`curve\`, nên không ép về gấp khúc 90° được. Ký hiệu chân gà (crow's foot) và nhãn khóa ngoại vẫn đúng chuẩn. Nếu bắt buộc phải có đường thẳng tuyệt đối, cần vẽ lại bằng draw.io.

## File và cách chèn vào Word

- Mỗi sơ đồ có 3 file cùng tên: nguồn (\`.mmd\`, hoặc \`.drawio\` với sơ đồ 12), \`.png\` (raster nền trắng, 2x) và \`.svg\` (vector).
- **Chèn Word nên dùng \`.svg\`**: Insert > Pictures > chọn SVG.
- Sơ đồ cao trên 3200 px (cột *Ghi chú*) nên đặt riêng một trang.

## Cách render lại

\`\`\`bash
# Sơ đồ luồng có bản .drawio — export từ draw.io (ảnh chính thức)
draw.io --no-sandbox -x -f svg -b 10 -o <ten-file>.svg <ten-file>.drawio
draw.io --no-sandbox -x -f png -s 2 -b 10 -o <ten-file>.png <ten-file>.drawio

# Sơ đồ chỉ có Mermaid (tuần tự, trạng thái, ERD, lớp, kiến trúc)
npx -y @mermaid-js/mermaid-cli -i <ten-file>.mmd -o <ten-file>.svg -b white
npx -y @mermaid-js/mermaid-cli -i <ten-file>.mmd -o <ten-file>.png -b white -s 2

# Sơ đồ 12 (use case) — nguồn là .drawio, render như các sơ đồ .drawio khác
draw.io --no-sandbox -x -f svg -b 10 -o 12_2-4-3_so-do-use-case-tong-quat_usecase.svg 12_2-4-3_so-do-use-case-tong-quat_usecase.drawio
draw.io --no-sandbox -x -f png -s 2 -b 10 -o 12_2-4-3_so-do-use-case-tong-quat_usecase.png 12_2-4-3_so-do-use-case-tong-quat_usecase.drawio
\`\`\`

Quy trình sửa hàng loạt:

1. \`node docs/insert-sections.mjs\` — chèn mục mới vào \`THIET_KE_HE_THONG.md\` (chạy nhiều lần vẫn an toàn)
2. \`node docs/regen-diagrams.mjs\` — ghi lại toàn bộ \`.mmd\` và đồng bộ khối mermaid trong tài liệu
3. \`node docs/gen-drawio.mjs\` — sinh lại các bản \`.drawio\` từ \`.mmd\`
4. Render lại bằng lệnh ở trên
5. \`node docs/check-diagrams.mjs\` — kiểm tra nhánh cụt, cạnh quyết định thiếu nhãn, màu sót lại
6. \`node docs/gen-readme.mjs\` — sinh lại bảng dưới đây

> **Vì sao sơ đồ 12 dùng draw.io:** Mermaid không có ký hiệu chuẩn cho use case diagram (không hình người que, không ranh giới hệ thống, không quan hệ tổng quát hóa). Bản PlantUML trước đó đúng notation nhưng \`linetype ortho\` đẩy các đường đi vòng và cắt nhau, nên chuyển sang draw.io để đặt tọa độ thủ công: ba actor xếp một cột bên trái theo thứ tự kế thừa, khối use case của mỗi actor chiếm một dải y không chồng lấn khối của actor khác, hai mũi tên kế thừa chạy trong hai làn riêng bên trái — nhờ vậy không đường nào cắt nhau. File \`.puml\` cũ vẫn giữ để đối chiếu.

## Danh sách

| STT | Mục | Loại | Nguồn | Tên file (bỏ đuôi) | KT PNG (px) | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}
`;

writeFileSync(join(DIR, 'README.md'), md, 'utf8');
console.log(`Đã ghi README với ${rows.length} dòng`);
