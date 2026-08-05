// Nạp schema + sample data vào một CSDL nháp rồi soi tính toàn vẹn của dữ liệu mẫu.
// Không đụng tới CSDL đang dùng.
//
//   node scripts/verify-sample-data.mjs
//
// Mô phỏng đúng thứ tự nạp của docker-compose và README:
//   warehouse_management_mysql.sql (một file duy nhất: schema + seed + dữ liệu mẫu)
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';

const SCRATCH_DB = 'wms_sample_check';
// Mặc định nạp file dữ liệu chuẩn; truyền tên file qua tham số
// để kiểm tra riêng từng file, ví dụ: node scripts/verify-sample-data.mjs warehouse_management_mysql.sql
const FILES =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : ['warehouse_management_mysql.sql'];

// QUAN TRỌNG: warehouse_management_mysql.sql có sẵn `CREATE DATABASE` và `USE warehouse_management`.
// Nếu để nguyên, kết nối sẽ tự nhảy sang CSDL thật và mọi INSERT chạy vào đó thay vì CSDL nháp.
// Bắt buộc phải loại bỏ hai loại câu lệnh này trước khi chạy.
function splitStatements(sql) {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/^\s*(USE|CREATE\s+DATABASE|DROP\s+DATABASE)\b/i.test(s));
}

const base = new URL(process.env.DATABASE_URL);
base.pathname = '/';
const root = await mysql.createConnection({
  host: base.hostname,
  port: Number(base.port || 3306),
  user: decodeURIComponent(base.username),
  password: decodeURIComponent(base.password),
  multipleStatements: false,
});

console.log(`Dựng lại CSDL nháp ${SCRATCH_DB}...`);
await root.query(`DROP DATABASE IF EXISTS \`${SCRATCH_DB}\``);
await root.query(`CREATE DATABASE \`${SCRATCH_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await root.end();

const c = await mysql.createConnection({
  host: base.hostname,
  port: Number(base.port || 3306),
  user: decodeURIComponent(base.username),
  password: decodeURIComponent(base.password),
  database: SCRATCH_DB,
});

const loadErrors = [];

// Chốt chặn: nếu vì lý do gì đó kết nối bị đổi sang CSDL khác thì dừng ngay,
// tuyệt đối không được ghi nhầm vào CSDL thật.
async function assertScratchDb() {
  const [[row]] = await c.query('SELECT DATABASE() AS db');
  if (row.db !== SCRATCH_DB) {
    throw new Error(`Kết nối đang ở CSDL "${row.db}" chứ không phải "${SCRATCH_DB}". Dừng để tránh ghi nhầm.`);
  }
}

await assertScratchDb();

for (const file of FILES) {
  const statements = splitStatements(readFileSync(file, 'utf8'));
  let ok = 0;
  for (const [i, statement] of statements.entries()) {
    await assertScratchDb();
    try {
      await c.query(statement);
      ok += 1;
    } catch (error) {
      loadErrors.push({ file, index: i + 1, code: error.code, message: error.sqlMessage, sql: statement.replace(/\s+/g, ' ').slice(0, 120) });
    }
  }
  console.log(`  ${file}: ${ok}/${statements.length} câu lệnh chạy được`);
}

console.log('\n================ LỖI KHI NẠP ================');
if (loadErrors.length === 0) {
  console.log('Không có câu lệnh nào lỗi.');
} else {
  for (const e of loadErrors) {
    console.log(`[${e.file} #${e.index}] ${e.code}: ${e.message}`);
    console.log(`   ${e.sql}`);
  }
}

async function report(title, sql, okMessage) {
  const [rows] = await c.query(sql);
  console.log(`\n--- ${title}`);
  if (rows.length === 0) {
    console.log(`    ${okMessage}`);
  } else {
    console.table(rows);
  }
  return rows;
}

console.log('\n================ KIỂM TRA TOÀN VẸN ================');

await report(
  'Chứng từ không có dòng hàng nào',
  `SELECT 'goods_receipts' AS bang, h.receipt_code AS ma, h.status FROM goods_receipts h
     LEFT JOIN goods_receipt_items i ON i.goods_receipt_id = h.id
     GROUP BY h.id, h.receipt_code, h.status HAVING COUNT(i.id) = 0
   UNION ALL
   SELECT 'goods_issues', h.issue_code, h.status FROM goods_issues h
     LEFT JOIN goods_issue_items i ON i.goods_issue_id = h.id
     GROUP BY h.id, h.issue_code, h.status HAVING COUNT(i.id) = 0
   UNION ALL
   SELECT 'stock_transfers', h.transfer_code, h.status FROM stock_transfers h
     LEFT JOIN stock_transfer_items i ON i.stock_transfer_id = h.id
     GROUP BY h.id, h.transfer_code, h.status HAVING COUNT(i.id) = 0
   UNION ALL
   SELECT 'stock_counts', h.count_code, h.status FROM stock_counts h
     LEFT JOIN stock_count_items i ON i.stock_count_id = h.id
     GROUP BY h.id, h.count_code, h.status HAVING COUNT(i.id) = 0
   UNION ALL
   SELECT 'stock_adjustments', h.adjustment_code, h.status FROM stock_adjustments h
     LEFT JOIN stock_adjustment_items i ON i.stock_adjustment_id = h.id
     GROUP BY h.id, h.adjustment_code, h.status HAVING COUNT(i.id) = 0`,
  'Mọi chứng từ đều có ít nhất một dòng hàng.',
);

await report(
  'Tồn âm trong stock_locations',
  `SELECT sl.id, pv.sku, wl.code AS vi_tri, sl.quantity, sl.reserved_quantity
   FROM stock_locations sl
   JOIN product_variants pv ON pv.id = sl.product_variant_id
   JOIN warehouse_locations wl ON wl.id = sl.location_id
   WHERE sl.quantity < 0 OR sl.reserved_quantity < 0 OR sl.reserved_quantity > sl.quantity`,
  'Không có tồn âm và không có bản ghi giữ chỗ vượt tồn.',
);

await report(
  'Vị trí của dòng hàng không thuộc kho của chứng từ',
  `SELECT gr.receipt_code AS phieu, wl.code AS vi_tri, w.code AS kho_cua_vi_tri, w2.code AS kho_cua_phieu
   FROM goods_receipt_items gri
   JOIN goods_receipts gr ON gr.id = gri.goods_receipt_id
   JOIN warehouse_locations wl ON wl.id = gri.location_id
   JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
   JOIN warehouse_zones wz ON wz.id = ws.zone_id
   JOIN warehouses w ON w.id = wz.warehouse_id
   JOIN warehouses w2 ON w2.id = gr.warehouse_id
   WHERE w.id <> w2.id`,
  'Mọi dòng phiếu nhập đều nhập vào vị trí thuộc đúng kho của phiếu.',
);

await report(
  'SKU bật theo dõi lô nhưng dòng chứng từ thiếu batch_id',
  `SELECT 'goods_receipt_items' AS bang, gr.receipt_code AS phieu, pv.sku
   FROM goods_receipt_items i
   JOIN goods_receipts gr ON gr.id = i.goods_receipt_id
   JOIN product_variants pv ON pv.id = i.product_variant_id
   WHERE pv.requires_lot_tracking = 1 AND i.batch_id IS NULL
   UNION ALL
   SELECT 'goods_issue_items', gi.issue_code, pv.sku
   FROM goods_issue_items i
   JOIN goods_issues gi ON gi.id = i.goods_issue_id
   JOIN product_variants pv ON pv.id = i.product_variant_id
   WHERE pv.requires_lot_tracking = 1 AND i.batch_id IS NULL`,
  'Mọi dòng của SKU theo lô đều có batch_id.',
);

await report(
  'Lô gán sai SKU (batch thuộc SKU khác với dòng chứng từ)',
  `SELECT 'stock_locations' AS bang, pv.sku, b.lot_number
   FROM stock_locations sl
   JOIN product_variants pv ON pv.id = sl.product_variant_id
   JOIN product_batches b ON b.id = sl.batch_id
   WHERE b.product_variant_id <> sl.product_variant_id`,
  'Mọi lô đều gán đúng SKU.',
);

await report(
  'Giao dịch tồn tham chiếu chứng từ không tồn tại',
  `SELECT it.transaction_code, it.reference_type, it.reference_id
   FROM inventory_transactions it
   WHERE (it.reference_type = 'GOODS_RECEIPT' AND NOT EXISTS (SELECT 1 FROM goods_receipts x WHERE x.id = it.reference_id))
      OR (it.reference_type = 'GOODS_ISSUE'   AND NOT EXISTS (SELECT 1 FROM goods_issues x WHERE x.id = it.reference_id))
      OR (it.reference_type = 'STOCK_TRANSFER' AND NOT EXISTS (SELECT 1 FROM stock_transfers x WHERE x.id = it.reference_id))
      OR (it.reference_type = 'STOCK_ADJUSTMENT' AND NOT EXISTS (SELECT 1 FROM stock_adjustments x WHERE x.id = it.reference_id))`,
  'Mọi giao dịch tồn đều trỏ tới chứng từ có thật.',
);

await report(
  'Chứng từ CONFIRMED/APPROVED nhưng không sinh giao dịch tồn nào',
  `SELECT 'goods_receipts' AS bang, gr.receipt_code AS ma FROM goods_receipts gr
     WHERE gr.status = 'CONFIRMED'
       AND NOT EXISTS (SELECT 1 FROM inventory_transactions it WHERE it.reference_type='GOODS_RECEIPT' AND it.reference_id=gr.id)
   UNION ALL
   SELECT 'goods_issues', gi.issue_code FROM goods_issues gi
     WHERE gi.status = 'CONFIRMED'
       AND NOT EXISTS (SELECT 1 FROM inventory_transactions it WHERE it.reference_type='GOODS_ISSUE' AND it.reference_id=gi.id)
   UNION ALL
   SELECT 'stock_transfers', st.transfer_code FROM stock_transfers st
     WHERE st.status = 'CONFIRMED'
       AND NOT EXISTS (SELECT 1 FROM inventory_transactions it WHERE it.reference_type='STOCK_TRANSFER' AND it.reference_id=st.id)
   UNION ALL
   SELECT 'stock_adjustments', sa.adjustment_code FROM stock_adjustments sa
     WHERE sa.status = 'APPROVED'
       AND NOT EXISTS (SELECT 1 FROM inventory_transactions it WHERE it.reference_type='STOCK_ADJUSTMENT' AND it.reference_id=sa.id)`,
  'Mọi chứng từ đã ghi sổ đều có giao dịch tồn tương ứng.',
);

await report(
  'Dòng kiểm kê đã đếm nhưng lệch với tồn hệ thống ở thời điểm chốt',
  `SELECT sc.count_code, pv.sku, i.system_quantity, i.actual_quantity, i.difference_quantity
   FROM stock_count_items i
   JOIN stock_counts sc ON sc.id = i.stock_count_id
   JOIN product_variants pv ON pv.id = i.product_variant_id
   WHERE i.actual_quantity IS NOT NULL
     AND i.difference_quantity <> (i.actual_quantity - i.system_quantity)`,
  'Cột difference_quantity khớp với actual trừ system.',
);

await report(
  'Bản ghi bị trùng do nạp sample data hai lần',
  `SELECT 'warehouses' AS bang, code AS ma, COUNT(*) AS so_ban FROM warehouses GROUP BY code HAVING COUNT(*) > 1
   UNION ALL SELECT 'product_variants', sku, COUNT(*) FROM product_variants GROUP BY sku HAVING COUNT(*) > 1
   UNION ALL SELECT 'goods_receipts', receipt_code, COUNT(*) FROM goods_receipts GROUP BY receipt_code HAVING COUNT(*) > 1
   UNION ALL SELECT 'inventory_transactions', transaction_code, COUNT(*) FROM inventory_transactions GROUP BY transaction_code HAVING COUNT(*) > 1
   UNION ALL SELECT 'goods_receipt_items', CONCAT(goods_receipt_id,'/',product_variant_id,'/',IFNULL(batch_id,0),'/',location_id), COUNT(*) FROM goods_receipt_items GROUP BY goods_receipt_id, product_variant_id, batch_id, location_id HAVING COUNT(*) > 1
   UNION ALL SELECT 'stock_transfer_items', CONCAT(stock_transfer_id,'/',product_variant_id,'/',IFNULL(batch_id,0)), COUNT(*) FROM stock_transfer_items GROUP BY stock_transfer_id, product_variant_id, batch_id HAVING COUNT(*) > 1
   UNION ALL SELECT 'stock_locations', CONCAT(product_variant_id,'/',location_id,'/',IFNULL(batch_id,0)), COUNT(*) FROM stock_locations GROUP BY product_variant_id, location_id, batch_id HAVING COUNT(*) > 1`,
  'Không có bản ghi nào bị nhân đôi.',
);

await report(
  'Vai trò chưa được gán quyền nào',
  `SELECT r.code AS vai_tro FROM roles r
   LEFT JOIN role_permissions rp ON rp.role_id = r.id
   GROUP BY r.id, r.code HAVING COUNT(rp.permission_id) = 0`,
  'Mọi vai trò đều có ít nhất một quyền.',
);

console.log(`\nCSDL nháp ${SCRATCH_DB} vẫn còn để bạn soi thêm. Xóa bằng: DROP DATABASE ${SCRATCH_DB};`);
await c.end();
