// Chèn 14 mục mới vào THIET_KE_HE_THONG.md cho các nghiệp vụ đã có trong mã nguồn
// nhưng chưa được lập sơ đồ. Mỗi mục gồm tiêu đề + phần mô tả + khối mermaid rỗng,
// nội dung sơ đồ do docs/regen-diagrams.mjs ghi vào sau.
// Script chỉ chèn khi mục chưa tồn tại nên chạy nhiều lần vẫn an toàn.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const MD = join(dirname(fileURLToPath(import.meta.url)), '..', 'THIET_KE_HE_THONG.md');
const F = '```';
const BLOCK = `${F}mermaid\n${F}`;

/** @type {{anchor: string, marker: string, text: string}[]} */
const SECTIONS = [
  {
    anchor: '## 2.4.2 Sơ đồ chức năng',
    marker: '### 7) Quy trình Đảo chứng từ (Reverse)',
    text: `### 7) Quy trình Đảo chứng từ (Reverse)

Mục đích: sửa sai một chứng từ **đã xác nhận** mà không xóa lịch sử. Hệ thống sinh giao dịch đối ứng loại \`REVERSAL\` và chuyển phiếu gốc sang \`CANCELLED\`. Áp dụng cho phiếu nhập, phiếu xuất và phiếu chuyển kho (quyền \`goods_receipts:reverse\`, \`goods_issues:reverse\`, \`stock_transfers:reverse\`).

Sơ đồ trả lời câu hỏi: một phiếu đã ghi sổ được hoàn tác theo trình tự nào và bị chặn ở đâu khi đã đảo rồi hoặc tồn không đủ để hoàn tác.

${BLOCK}

Điểm cần lưu ý: đảo phiếu **nhập** làm giảm tồn nên có thể vướng \`REVERSAL_INSUFFICIENT_STOCK\` nếu hàng đã được xuất đi; đảo phiếu **xuất** làm tăng tồn trở lại nên không gặp lỗi này.
`,
  },
  {
    anchor: '## 2.4.2 Sơ đồ chức năng',
    marker: '### 8) Quy trình Nhận nhanh bằng QR (Quick Receive)',
    text: `### 8) Quy trình Nhận nhanh bằng QR (Quick Receive)

Mục đích: nhập hàng tại chỗ bằng cách quét mã sản phẩm và mã vị trí, **không cần soạn phiếu nhập**. Dùng cho hàng lẻ, hàng bù. Endpoint \`POST /stock/quick-receive\`.

Sơ đồ trả lời câu hỏi: một lần quét QR làm thay đổi tồn kho như thế nào và dừng ở đâu khi quét sai mã.

${BLOCK}

Giao dịch sinh ra có \`transaction_type = 'RECEIPT'\` và \`reference_type = 'QUICK_RECEIVE'\` (không trỏ về phiếu nào), nhờ đó vẫn truy vết được nguồn gốc biến động.
`,
  },
  {
    anchor: '## 2.4.2 Sơ đồ chức năng',
    marker: '### 9) Quy trình Cảnh báo và Thông báo',
    text: `### 9) Quy trình Cảnh báo và Thông báo

Mục đích: phát hiện tồn bất thường và đưa tới người dùng. Hệ thống quét tồn theo ba nhóm quy tắc để sinh **cảnh báo** (\`alerts\`), sau đó chuyển cảnh báo đang mở thành **thông báo** (\`notifications\`) cho người dùng.

Sơ đồ trả lời câu hỏi: cảnh báo được sinh từ quy tắc nào và đi tới người dùng qua bước nào.

${BLOCK}

Ba nhóm quy tắc: hết hàng và sắp hết hàng (\`OUT_OF_STOCK\`, \`LOW_STOCK\`), vượt tồn tối đa (\`OVER_MAX_STOCK\`), và hàng cận hạn (\`NEAR_EXPIRY\`). Cả hai bước đều chạy theo yêu cầu qua API (\`POST /alerts/generate\`, \`POST /notifications/generate\`), chưa có bộ lập lịch tự động.
`,
  },
  {
    anchor: '### 3.1.3 Mức vật lý (Physical)',
    marker: '**g) Phân hệ Vận hành và hệ thống**',
    text: `**g) Phân hệ Vận hành và hệ thống**

Nhóm bảng phục vụ vận hành: cảnh báo, thông báo, nhật ký thao tác, tệp đính kèm và tham số cấu hình.

Sơ đồ trả lời câu hỏi: dữ liệu vận hành được lưu ở những bảng nào và tham chiếu ngược về người dùng, kho, SKU ra sao.

${BLOCK}

\`audit_logs\` và \`attachments\` dùng cặp \`entity_type\` + \`entity_id\` để trỏ tới bất kỳ thực thể nào (quan hệ đa hình), nên không có khóa ngoại cứng tới từng bảng chứng từ.
`,
  },
  {
    anchor: '### 3.2.3 Sơ đồ hoạt động (Activity)',
    marker: '#### Sequence 5: Làm mới token và đăng xuất',
    text: `#### Sequence 5: Làm mới token và đăng xuất

Sơ đồ trả lời câu hỏi: phiên đăng nhập được gia hạn và kết thúc thông qua bảng \`user_sessions\` như thế nào.

${BLOCK}
`,
  },
  {
    anchor: '### 3.2.3 Sơ đồ hoạt động (Activity)',
    marker: '#### Sequence 6: Đảo phiếu nhập kho đã xác nhận',
    text: `#### Sequence 6: Đảo phiếu nhập kho đã xác nhận

Sơ đồ trả lời câu hỏi: thao tác đảo phiếu đọc lại giao dịch gốc và sinh giao dịch đối ứng ở bước nào.

${BLOCK}
`,
  },
  {
    anchor: '### 3.2.3 Sơ đồ hoạt động (Activity)',
    marker: '#### Sequence 7: Duyệt kiểm kê và sinh phiếu điều chỉnh',
    text: `#### Sequence 7: Duyệt kiểm kê và sinh phiếu điều chỉnh

Sơ đồ trả lời câu hỏi: vì sao duyệt kiểm kê **chưa** làm đổi tồn ngay, mà phải qua một phiếu điều chỉnh trung gian.

${BLOCK}

Đây là điểm dễ hiểu nhầm nhất của nghiệp vụ kiểm kê: \`POST /stock-counts/:id/approve\` chỉ chốt kết quả đếm và sinh phiếu \`stock_adjustments\` loại \`COUNT\` ở trạng thái \`PENDING\`. Tồn kho chỉ thay đổi khi phiếu điều chỉnh đó được duyệt bằng \`POST /stock-adjustments/:id/approve\`.
`,
  },
  {
    anchor: '## Phụ lục A: Bản đồ module ↔ chức năng ↔ bảng dữ liệu',
    marker: '#### Activity 4: Nhận nhanh bằng QR',
    text: `#### Activity 4: Nhận nhanh bằng QR

Sơ đồ trả lời câu hỏi: một lần quét QR đi qua những bước kiểm tra nào trong cùng một giao dịch cơ sở dữ liệu.

${BLOCK}
`,
  },
  {
    anchor: '## Phụ lục A: Bản đồ module ↔ chức năng ↔ bảng dữ liệu',
    marker: '#### Activity 5: Sinh cảnh báo và thông báo',
    text: `#### Activity 5: Sinh cảnh báo và thông báo

Sơ đồ trả lời câu hỏi: ba nhóm quy tắc cảnh báo được quét theo thứ tự nào và làm sao tránh sinh trùng cảnh báo đang mở.

${BLOCK}
`,
  },
  {
    anchor: '# CHƯƠNG 4: SƠ ĐỒ NGHIỆP VỤ VÀ KIẾN TRÚC MỞ RỘNG (GÓC NHÌN BA / SA / SOLUTION ARCHITECT)',
    marker: '### 3.3.8 Chức năng: Quản lý cấu trúc kho',
    text: `### 3.3.8 Chức năng: Quản lý cấu trúc kho

**(1) Mô tả**

| Mục | Nội dung |
| --- | --- |
| Actor | Quản trị viên (tạo/sửa/xóa kho), Quản lý kho (khai báo khu vực, kệ, tầng, vị trí) |
| Mục tiêu | Dựng cây \`Kho → Khu vực → Kệ → Vị trí\` để hàng có chỗ lưu và có mã QR để quét |
| Tiền điều kiện | Đăng nhập; quyền \`warehouses:create\` / \`warehouses:update\` / \`warehouses:delete\` cho thao tác trên kho |
| Kích hoạt | Người dùng mở màn hình *Vị trí kho* hoặc *Kho* |
| Luồng chính | 1. Tạo kho → 2. Thêm khu vực → 3. Thêm kệ → 4. Thêm tầng/vị trí → 5. Đồng bộ ma trận vị trí → 6. Sắp xếp lại thứ tự kệ |
| Ngoại lệ | Xóa vị trí còn tồn → \`LOCATION_HAS_STOCK\`; xóa kho không tồn tại → \`WAREHOUSE_NOT_FOUND\`; thiếu quyền → 403 |
| Hậu điều kiện | Cây vị trí sẵn sàng cho nhập, xuất, chuyển và kiểm kê |

**(2) Sơ đồ tuần tự**

Sơ đồ trả lời câu hỏi: thao tác thêm một tầng vị trí đi qua những lớp nào và bị chặn ở đâu khi vị trí còn hàng.

${BLOCK}

**(3) Sơ đồ hoạt động**

Sơ đồ trả lời câu hỏi: người dùng dựng cây vị trí theo thứ tự nào và xóa được ở mức nào.

${BLOCK}
`,
  },
  {
    anchor: '# CHƯƠNG 4: SƠ ĐỒ NGHIỆP VỤ VÀ KIẾN TRÚC MỞ RỘNG (GÓC NHÌN BA / SA / SOLUTION ARCHITECT)',
    marker: '### 3.3.9 Chức năng: Cảnh báo và thông báo',
    text: `### 3.3.9 Chức năng: Cảnh báo và thông báo

**(1) Mô tả**

| Mục | Nội dung |
| --- | --- |
| Actor | Quản lý kho (xem, đánh dấu đã đọc, xử lý), Hệ thống (sinh cảnh báo theo quy tắc) |
| Mục tiêu | Phát hiện sớm tồn bất thường: hết hàng, sắp hết, vượt tồn tối đa, hàng cận hạn |
| Tiền điều kiện | Đăng nhập; quyền \`alerts:generate\` / \`alerts:read\` / \`alerts:resolve\`, \`notifications:generate\` / \`notifications:read\` |
| Kích hoạt | Gọi \`POST /alerts/generate\` (quét tồn) hoặc \`POST /notifications/generate\` (đẩy thông báo) |
| Luồng chính | 1. Quét quy tắc tồn → 2. Chèn cảnh báo \`OPEN\` (bỏ qua cảnh báo trùng đang mở) → 3. Sinh thông báo từ cảnh báo \`OPEN\` → 4. Người dùng đọc → 5. Người dùng xử lý |
| Ngoại lệ | Thiếu quyền → 403; không có tồn nào vi phạm quy tắc → \`createdCount = 0\`, không sinh cảnh báo |
| Hậu điều kiện | Cảnh báo ở \`OPEN\`/\`READ\`/\`RESOLVED\`; thông báo tham chiếu ngược về cảnh báo qua \`reference_type = 'ALERT'\` |

**(3) Sơ đồ hoạt động**

Sơ đồ trả lời câu hỏi: từ lúc quét quy tắc tới lúc người dùng xử lý xong, cảnh báo đi qua những bước nào.

${BLOCK}

**(4) Sơ đồ trạng thái**

Sơ đồ trả lời câu hỏi: một cảnh báo có những trạng thái nào và sự kiện nào làm nó chuyển trạng thái.

${BLOCK}
`,
  },
  {
    anchor: '# CHƯƠNG 4: SƠ ĐỒ NGHIỆP VỤ VÀ KIẾN TRÚC MỞ RỘNG (GÓC NHÌN BA / SA / SOLUTION ARCHITECT)',
    marker: '### 3.3.10 Chức năng: Báo cáo và nhật ký thao tác',
    text: `### 3.3.10 Chức năng: Báo cáo và nhật ký thao tác

**(1) Mô tả**

| Mục | Nội dung |
| --- | --- |
| Actor | Quản lý kho, Quản trị viên |
| Mục tiêu | Tổng hợp số liệu tồn và tra cứu lại mọi thao tác đã thực hiện |
| Tiền điều kiện | Đăng nhập |
| Kích hoạt | Người dùng mở màn hình *Báo cáo* hoặc *Nhật ký thao tác* |
| Luồng chính | 1. Chọn loại báo cáo và bộ lọc → 2. Hệ thống tổng hợp từ \`stock_locations\` và \`inventory_transactions\` → 3. Hiển thị bảng kết quả |
| Ngoại lệ | Bộ lọc không khớp dữ liệu nào → trả danh sách rỗng, không phải lỗi |
| Hậu điều kiện | Không thay đổi dữ liệu nghiệp vụ (chỉ đọc) |

Bốn báo cáo hiện có: tồn theo sản phẩm (\`/reports/product-stock\`), hàng cận hạn (\`/reports/near-expiry\`), biến động tồn (\`/reports/inventory-movements\`) và chi tiết giao dịch (\`/reports/inventory-transactions\`). Nhật ký thao tác (\`/audit-logs\`) được ghi tự động bởi \`insertAuditLog\` trong cùng giao dịch với nghiệp vụ, nên không thể ghi lệch.

**(3) Sơ đồ hoạt động**

Sơ đồ trả lời câu hỏi: dữ liệu báo cáo được tổng hợp từ nguồn nào và nhật ký thao tác được ghi vào lúc nào.

${BLOCK}
`,
  },
];

let md = readFileSync(MD, 'utf8');
let inserted = 0;

for (const s of SECTIONS) {
  if (md.includes(s.marker)) continue;
  const at = md.indexOf(s.anchor);
  if (at < 0) {
    console.error(`Không tìm thấy mốc chèn: ${s.anchor}`);
    process.exit(1);
  }
  md = md.slice(0, at) + s.text + '\n' + md.slice(at);
  inserted++;
}

writeFileSync(MD, md, 'utf8');
const blocks = md.match(new RegExp(F + 'mermaid', 'g')) || [];
console.log(`Đã chèn ${inserted} mục mới. Tổng khối mermaid: ${blocks.length}`);
