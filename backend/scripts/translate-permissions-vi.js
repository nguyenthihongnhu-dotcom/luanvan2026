/**
 * Dịch tên và mô tả quyền sang tiếng Việt, ở cả CSDL đang chạy lẫn file seed.
 * Mã quyền (code) và tên module giữ nguyên tiếng Anh vì code dùng chúng làm khóa
 * trong requirePermission(); chỉ dịch phần con người đọc.
 *
 * Chạy thử: node vi-permissions.js      |  Chạy thật: node vi-permissions.js --apply
 */
const fs = require('fs');
const mysql = require('mysql2/promise');

const SEED = require('path').join(__dirname, '..', 'warehouse_management_mysql.sql');

const VI = {
  'alerts:generate': ['Sinh cảnh báo tồn kho', 'Quét dữ liệu tồn để sinh cảnh báo tồn thấp và hàng cận hạn'],
  'alerts:read': ['Đánh dấu đã đọc cảnh báo', 'Đánh dấu một cảnh báo là đã đọc'],
  'alerts:resolve': ['Xử lý cảnh báo', 'Đóng cảnh báo tồn kho sau khi đã xử lý'],
  'authorization:read': ['Xem phân quyền', 'Xem danh sách vai trò và quyền'],
  'authorization:update': ['Sửa phân quyền', 'Gán hoặc gỡ quyền của một vai trò'],
  'goods_issues:confirm': ['Xác nhận phiếu xuất', 'Xác nhận phiếu xuất và trừ tồn kho'],
  'goods_issues:reverse': ['Đảo phiếu xuất', 'Đảo phiếu xuất đã xác nhận, hoàn lại tồn kho'],
  'goods_receipts:confirm': ['Xác nhận phiếu nhập', 'Xác nhận phiếu nhập và cộng tồn kho'],
  'goods_receipts:reverse': ['Đảo phiếu nhập', 'Đảo phiếu nhập đã xác nhận, trừ lại tồn kho'],
  'notifications:generate': ['Sinh thông báo', 'Sinh thông báo từ các cảnh báo đang mở'],
  'notifications:read': ['Đánh dấu đã đọc thông báo', 'Đánh dấu một thông báo là đã đọc'],
  'settings:update': ['Sửa tham số hệ thống', 'Thay đổi cấu hình chung của hệ thống'],
  'stock_adjustments:approve': ['Duyệt phiếu điều chỉnh', 'Duyệt phiếu điều chỉnh và cập nhật tồn kho'],
  'stock_adjustments:cancel': ['Hủy phiếu điều chỉnh', 'Hủy phiếu điều chỉnh còn ở trạng thái nháp hoặc chờ duyệt'],
  'stock_adjustments:reject': ['Từ chối phiếu điều chỉnh', 'Từ chối phiếu điều chỉnh trước khi tồn kho thay đổi'],
  'stock_counts:approve': ['Duyệt phiếu kiểm kê', 'Duyệt kết quả kiểm kê và sinh phiếu điều chỉnh cho phần lệch'],
  'stock_counts:count': ['Ghi số đếm kiểm kê', 'Nhập số lượng đếm thực tế cho từng dòng'],
  'stock_counts:create': ['Tạo phiếu kiểm kê', 'Tạo phiếu kiểm kê và chốt số liệu tồn tại thời điểm đó'],
  'stock_counts:start': ['Bắt đầu kiểm kê', 'Chuyển phiếu kiểm kê sang trạng thái đang kiểm kê'],
  'stock_counts:submit': ['Gửi duyệt kiểm kê', 'Nộp kết quả đếm để chờ duyệt'],
  'stock_transfers:confirm': ['Xác nhận phiếu chuyển kho', 'Xác nhận chuyển hàng giữa hai vị trí'],
  'stock_transfers:reverse': ['Đảo phiếu chuyển kho', 'Đảo phiếu chuyển kho đã xác nhận'],
  'users:create': ['Thêm nhân viên', 'Tạo tài khoản nhân viên mới'],
  'users:delete': ['Vô hiệu hóa nhân viên', 'Ngừng hoạt động tài khoản nhân viên'],
  'users:read': ['Xem nhân viên', 'Xem danh sách tài khoản nhân viên'],
  'users:update': ['Sửa nhân viên', 'Cập nhật thông tin và vai trò của nhân viên'],
  'warehouses:create': ['Thêm kho', 'Tạo kho mới'],
  'warehouses:delete': ['Xóa kho', 'Ngừng hoạt động một kho'],
  'warehouses:update': ['Sửa kho', 'Cập nhật thông tin kho'],
};

function escapeSql(value) {
  return value.replace(/'/g, "''");
}

async function main() {
  const apply = process.argv.includes('--apply');
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL ?? 'mysql://root:@localhost:3306/warehouse_management',
  );

  try {
    const [rows] = await connection.query('SELECT code, name FROM permissions ORDER BY code');
    const missing = rows.filter((row) => !VI[row.code]);
    if (missing.length) {
      throw new Error(`Chưa có bản dịch cho: ${missing.map((m) => m.code).join(', ')}`);
    }

    console.log(`Số quyền sẽ dịch: ${rows.length}`);
    rows.slice(0, 5).forEach((row) => console.log(`  ${row.code}: "${row.name}" -> "${VI[row.code][0]}"`));
    console.log('  ...');

    if (!apply) {
      console.log('\n(Chạy thử — chưa ghi gì. Thêm --apply để đổi thật.)');
      return;
    }

    for (const [code, [name, description]] of Object.entries(VI)) {
      await connection.query('UPDATE permissions SET name = ?, description = ? WHERE code = ?', [
        name,
        description,
        code,
      ]);
    }
    console.log(`\nĐã cập nhật ${Object.keys(VI).length} quyền trong CSDL.`);

    // Đồng bộ luôn file seed để cài mới cũng ra tiếng Việt.
    let sql = fs.readFileSync(SEED, 'utf8');
    let seedChanged = 0;
    for (const [code, [name, description]] of Object.entries(VI)) {
      // Dòng seed dạng: ('code', 'Name', 'module', 'Description'),
      const re = new RegExp(`\\('${code.replace(/[:]/g, ':')}',\\s*'([^']*)',\\s*'([^']*)',\\s*'([^']*)'\\)`, 'g');
      sql = sql.replace(re, (whole, _oldName, moduleName) => {
        seedChanged += 1;
        return `('${code}', '${escapeSql(name)}', '${moduleName}', '${escapeSql(description)}')`;
      });
    }
    fs.writeFileSync(SEED, sql, 'utf8');
    console.log(`Đã cập nhật ${seedChanged} dòng trong file seed.`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Lỗi:', error.message);
  process.exit(1);
});
