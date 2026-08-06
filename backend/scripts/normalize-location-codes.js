/**
 * Chuẩn hoá mã ô lưu trữ về dạng `<TiềnTốKho>-<Khu>-<Kệ>-<Tầng>` (ví dụ HCM01-A-A01-01).
 *
 * Lý do: mã ô sinh ra trước đây bỏ tiền tố kho (`A-A01-01`), trong khi cột
 * warehouse_locations.code là UNIQUE trên toàn bảng chứ không phải theo từng kho.
 * Hai kho cùng có khu A kệ A01 sẽ sinh trùng mã và lệnh đồng bộ ma trận của kho
 * thứ hai vỡ vì trùng khoá.
 *
 * Chỉ đổi cột `code` (chuỗi hiển thị). Mọi tham chiếu tồn kho, phiếu, giao dịch
 * đều dùng warehouse_locations.id nên dữ liệu nghiệp vụ không bị ảnh hưởng.
 *
 * Chạy thử (mặc định, không ghi gì):  node scripts/normalize-location-codes.js
 * Chạy thật:                          node scripts/normalize-location-codes.js --apply
 */
const mysql = require('mysql2/promise');

function warehouseCodePrefix(warehouseCode) {
  return warehouseCode.replace(/^KHO-/i, '').replaceAll('-', '');
}

async function main() {
  const apply = process.argv.includes('--apply');
  const url =
    process.env.DATABASE_URL ??
    'mysql://root:@localhost:3306/warehouse_management';
  const connection = await mysql.createConnection(url);

  try {
    const [rows] = await connection.query(`
      SELECT
        wl.id,
        wl.code AS current_code,
        wl.layer_no,
        wz.code AS zone_code,
        ws.code AS shelf_code,
        w.code AS warehouse_code
      FROM warehouse_locations wl
      JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
      JOIN warehouse_zones wz ON wz.id = ws.zone_id
      JOIN warehouses w ON w.id = wz.warehouse_id
      ORDER BY w.code, wz.code, ws.code, wl.layer_no
    `);

    const changes = [];
    const targets = new Map();

    for (const row of rows) {
      const layerCode = String(row.layer_no).padStart(2, '0');
      const expected = `${warehouseCodePrefix(row.warehouse_code)}-${row.zone_code}-${row.shelf_code}-${layerCode}`;

      if (targets.has(expected)) {
        throw new Error(
          `Mã đích bị trùng: ${expected} (ô #${row.id} và ô #${targets.get(expected)}). Dừng lại, không đổi gì.`,
        );
      }
      targets.set(expected, row.id);

      if (row.current_code !== expected) {
        changes.push({ id: row.id, from: row.current_code, to: expected });
      }
    }

    console.log(`Tổng số ô: ${rows.length}`);
    console.log(`Số ô cần đổi mã: ${changes.length}`);
    changes.slice(0, 20).forEach((c) => console.log(`  #${c.id}  ${c.from}  ->  ${c.to}`));
    if (changes.length > 20) console.log(`  ... và ${changes.length - 20} ô nữa`);

    if (!apply) {
      console.log('\n(Chạy thử — chưa ghi gì vào DB. Thêm --apply để đổi thật.)');
      return;
    }

    if (changes.length === 0) {
      console.log('\nKhông có gì để đổi.');
      return;
    }

    await connection.beginTransaction();
    try {
      // Đổi qua mã tạm trước rồi mới đặt mã đích: tránh va vào ràng buộc UNIQUE
      // khi mã mới của ô này đang là mã cũ của ô khác.
      for (const change of changes) {
        await connection.query(
          'UPDATE warehouse_locations SET code = ? WHERE id = ?',
          [`TMP-${change.id}`, change.id],
        );
      }
      for (const change of changes) {
        await connection.query(
          'UPDATE warehouse_locations SET code = ? WHERE id = ?',
          [change.to, change.id],
        );
      }
      await connection.commit();
      console.log(`\nĐã đổi ${changes.length} mã ô.`);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Lỗi:', error.message);
  process.exit(1);
});
