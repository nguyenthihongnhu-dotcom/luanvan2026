// Kiểm tra nhanh dữ liệu sau khi chạy migration.
//   node scripts/check-data.mjs
import 'dotenv/config';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

async function show(title, sql) {
  const [rows] = await connection.query(sql);
  console.log(`\n=== ${title} ===`);
  console.table(rows);
}

try {
  await show(
    'Cột vị trí mặt bằng trong warehouse_zones',
    `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'warehouse_zones'
       AND COLUMN_NAME IN ('grid_row','grid_col','grid_size')`,
  );

  await show(
    'Khu theo từng kho',
    `SELECT w.code AS kho, wz.code AS khu, wz.name AS ten_khu,
            wz.grid_row, wz.grid_col,
            COUNT(DISTINCT ws.id) AS so_ke
     FROM warehouse_zones wz
     JOIN warehouses w ON w.id = wz.warehouse_id
     LEFT JOIN warehouse_shelves ws ON ws.zone_id = wz.id AND ws.deleted_at IS NULL
     WHERE wz.deleted_at IS NULL
     GROUP BY wz.id, w.code, wz.code, wz.name, wz.grid_row, wz.grid_col
     ORDER BY w.code, wz.sort_order`,
  );

  await show(
    'Số dòng hàng của từng phiếu nhập',
    `SELECT gr.receipt_code AS so_phieu, gr.status AS trang_thai,
            COUNT(gri.id) AS so_dong
     FROM goods_receipts gr
     LEFT JOIN goods_receipt_items gri ON gri.goods_receipt_id = gr.id
     GROUP BY gr.id, gr.receipt_code, gr.status
     ORDER BY gr.id`,
  );
} finally {
  await connection.end();
}
