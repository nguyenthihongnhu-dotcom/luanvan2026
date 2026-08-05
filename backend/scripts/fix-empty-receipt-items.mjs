// Bổ sung dòng hàng còn thiếu cho chứng từ trong dữ liệu mẫu.
// Dùng khi CSDL được nạp từ bản dữ liệu mẫu cũ, khiến phiếu nháp
// không có dòng hàng nào và bấm "Xác nhận" luôn báo ..._HAS_NO_ITEMS.
//
//   node scripts/fix-empty-receipt-items.mjs
//
// Các câu lệnh giống hệt khối INSERT trong warehouse_management_mysql.sql và đều có
// WHERE NOT EXISTS nên chạy nhiều lần cũng không nhân đôi dữ liệu.
import 'dotenv/config';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [before] = await connection.query(
    `SELECT gr.receipt_code, gr.status, COUNT(gri.id) AS so_dong
     FROM goods_receipts gr
     LEFT JOIN goods_receipt_items gri ON gri.goods_receipt_id = gr.id
     GROUP BY gr.id, gr.receipt_code, gr.status
     HAVING so_dong = 0`,
  );

  if (before.length === 0) {
    console.log('Không có phiếu nhập nào bị thiếu dòng hàng. Không cần sửa.');
  } else {
    console.log('Phiếu đang thiếu dòng hàng:', before.map((r) => r.receipt_code).join(', '));
  }

  const [result] = await connection.query(`
    INSERT INTO goods_receipt_items (goods_receipt_id, product_variant_id, batch_id, location_id, quantity, unit_cost, note)
    SELECT gr.id, v.id, b.id, l.id, x.quantity, x.unit_cost, x.note
    FROM (
        SELECT 'PN-202607-001' receipt_code, 'SUA-FRISO-3' sku, 'LOT-FRISO3-202605' lot_number, 'HCM01-A-A01-01' location_code, 80.000 quantity, 498000.00 unit_cost, 'Nhập mới' note
        UNION ALL SELECT 'PN-202607-001', 'SUA-FRISO-4', 'LOT-FRISO4-202605', 'HCM01-A-A02-01', 64.000, 510000.00, 'Nhập mới'
        UNION ALL SELECT 'PN-202607-002', 'BIM-HUG-M', 'LOT-HUG-M-202607', 'HCM01-B-B01-01', 150.000, 205000.00, 'Nhập mới'
        UNION ALL SELECT 'PN-202607-002', 'BIM-HUG-L', 'LOT-HUG-L-202607', 'HCM01-B-B01-01', 95.000, 219000.00, 'Nhập mới'
        UNION ALL SELECT 'PN-202607-003', 'BIM-MOONY-M', 'LOT-MOONY-M-202607', 'HCM02-A-A01-01', 42.000, 350000.00, 'Nhập bổ sung chi nhánh'
    ) x
    JOIN goods_receipts gr ON gr.receipt_code = x.receipt_code
    JOIN product_variants v ON v.sku = x.sku
    JOIN product_batches b ON b.product_variant_id = v.id AND b.lot_number = x.lot_number
    JOIN warehouse_locations l ON l.code = x.location_code
    WHERE NOT EXISTS (
        SELECT 1 FROM goods_receipt_items gi
        WHERE gi.goods_receipt_id = gr.id AND gi.product_variant_id = v.id
          AND gi.batch_id = b.id AND gi.location_id = l.id
    )
  `);

  console.log(`Đã thêm ${result.affectedRows} dòng hàng cho phiếu nhập.`);

  const [transferResult] = await connection.query(`
    INSERT INTO stock_transfer_items (stock_transfer_id, product_variant_id, batch_id, source_location_id, destination_location_id, quantity, note)
    SELECT st.id, v.id, b.id, src.id, dst.id, x.quantity, x.note
    FROM (
        SELECT 'CK-202607-001' transfer_code, 'BIM-HUG-M' sku, 'LOT-HUG-M-202607' lot_number, 'HCM01-B-B01-01' source_code, 'HCM02-A-A01-01' destination_code, 30.000 quantity, 'Chuyển về chi nhánh' note
        UNION ALL SELECT 'CK-202607-002', 'SUA-FRISO-4', 'LOT-FRISO4-202605', 'HCM01-A-A02-01', 'HCM02-A-A01-01', 20.000, 'Dự kiến bổ sung sữa Friso'
    ) x
    JOIN stock_transfers st ON st.transfer_code = x.transfer_code
    JOIN product_variants v ON v.sku = x.sku
    JOIN product_batches b ON b.product_variant_id = v.id AND b.lot_number = x.lot_number
    JOIN warehouse_locations src ON src.code = x.source_code
    JOIN warehouse_locations dst ON dst.code = x.destination_code
    WHERE NOT EXISTS (
        SELECT 1 FROM stock_transfer_items ti
        WHERE ti.stock_transfer_id = st.id AND ti.product_variant_id = v.id AND ti.batch_id = b.id
    )
  `);

  console.log(`Đã thêm ${transferResult.affectedRows} dòng hàng cho phiếu chuyển kho.`);

  const [after] = await connection.query(
    `SELECT 'Nhập kho' AS loai, gr.receipt_code AS so_phieu, gr.status AS trang_thai, COUNT(gri.id) AS so_dong
     FROM goods_receipts gr
     LEFT JOIN goods_receipt_items gri ON gri.goods_receipt_id = gr.id
     GROUP BY gr.id, gr.receipt_code, gr.status
     UNION ALL
     SELECT 'Chuyển kho', st.transfer_code, st.status, COUNT(sti.id)
     FROM stock_transfers st
     LEFT JOIN stock_transfer_items sti ON sti.stock_transfer_id = st.id
     GROUP BY st.id, st.transfer_code, st.status`,
  );
  console.table(after);
} finally {
  await connection.end();
}
