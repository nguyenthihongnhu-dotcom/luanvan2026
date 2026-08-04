USE warehouse_management;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- BAMBI WMS - SAMPLE DATA
-- Optional standalone sample data; already merged into backend/warehouse_management_mysql.sql
-- Tai khoan mau: admin@bambi.test / 123456
-- Mat khau hash bcrypt tuong ung voi 123456.
-- =========================================================

-- 1) Nhan su mau
INSERT INTO users (role_id, employee_code, full_name, email, phone, password_hash, status)
SELECT r.id, 'NV-ADMIN', 'Quản trị hệ thống', 'admin@bambi.test', '0900000001', '$2b$10$KLhvKbVc8KKE8OaYcIvYQegHfWaKu4jL7x4DHnUBQ5EtsaEi6SUbi', 'ACTIVE'
FROM roles r WHERE r.code = 'ADMIN'
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role_id = VALUES(role_id), password_hash = VALUES(password_hash), failed_login_attempts = 0, locked_until = NULL, status = VALUES(status);

INSERT INTO users (role_id, employee_code, full_name, email, phone, password_hash, status)
SELECT r.id, 'NV-QLK', 'Quản lý kho Bambi', 'manager@bambi.test', '0900000002', '$2b$10$KLhvKbVc8KKE8OaYcIvYQegHfWaKu4jL7x4DHnUBQ5EtsaEi6SUbi', 'ACTIVE'
FROM roles r WHERE r.code = 'WAREHOUSE_MANAGER'
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role_id = VALUES(role_id), password_hash = VALUES(password_hash), failed_login_attempts = 0, locked_until = NULL, status = VALUES(status);

INSERT INTO users (role_id, employee_code, full_name, email, phone, password_hash, status)
SELECT r.id, 'NV-KHO-01', 'Nhân viên PHS', 'staff@bambi.test', '0900000003', '$2b$10$KLhvKbVc8KKE8OaYcIvYQegHfWaKu4jL7x4DHnUBQ5EtsaEi6SUbi', 'ACTIVE'
FROM roles r WHERE r.code = 'STAFF'
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role_id = VALUES(role_id), password_hash = VALUES(password_hash), failed_login_attempts = 0, locked_until = NULL, status = VALUES(status);

-- 2) Kho, khu, ke, vi tri
INSERT INTO warehouses (code, name, address_line, ward, district, province, manager_user_id, status, description)
VALUES
('KHO-HCM-01', 'Kho trung tâm TP.HCM', '12 Nguyễn Văn Bảo', 'Phường 4', 'Gò Vấp', 'TP.HCM', (SELECT id FROM users WHERE employee_code = 'NV-QLK'), 'ACTIVE', 'Kho chính lưu hàng mẹ và bé'),
('KHO-HCM-02', 'Kho chi nhánh Quận 7', '88 Nguyễn Thị Thập', 'Tân Phú', 'Quận 7', 'TP.HCM', (SELECT id FROM users WHERE employee_code = 'NV-QLK'), 'ACTIVE', 'Kho phụ phục vụ giao hàng nội thành')
ON DUPLICATE KEY UPDATE name = VALUES(name), manager_user_id = VALUES(manager_user_id), status = VALUES(status);

INSERT INTO warehouse_zones (warehouse_id, code, name, description, status, sort_order)
VALUES
((SELECT id FROM warehouses WHERE code='KHO-HCM-01'), 'A', 'Khu A - Sữa và bột ăn dặm', 'Hàng khô, ưu tiên hạn sử dụng gần', 'ACTIVE', 1),
((SELECT id FROM warehouses WHERE code='KHO-HCM-01'), 'B', 'Khu B - Tã và vệ sinh', 'Hàng cồng kềnh, xuất nhanh', 'ACTIVE', 2),
((SELECT id FROM warehouses WHERE code='KHO-HCM-01'), 'C', 'Khu C - Đồ sơ sinh', 'Đồ dùng trẻ em và phụ kiện', 'ACTIVE', 3),
((SELECT id FROM warehouses WHERE code='KHO-HCM-02'), 'A', 'Khu A - Hàng bán chạy', 'Khu picking chi nhánh', 'ACTIVE', 1),
((SELECT id FROM warehouses WHERE code='KHO-HCM-02'), 'B', 'Khu B - Dự trữ chi nhánh', 'Khu lưu trữ bổ sung chi nhánh Q.7', 'ACTIVE', 2)
ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status), sort_order = VALUES(sort_order);

INSERT INTO warehouse_shelves (zone_id, code, name, status, sort_order)
VALUES
((SELECT z.id FROM warehouse_zones z JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-01' AND z.code='A'), 'A01', 'Kệ A01', 'ACTIVE', 1),
((SELECT z.id FROM warehouse_zones z JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-01' AND z.code='A'), 'A02', 'Kệ A02', 'ACTIVE', 2),
((SELECT z.id FROM warehouse_zones z JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-01' AND z.code='B'), 'B01', 'Kệ B01', 'ACTIVE', 1),
((SELECT z.id FROM warehouse_zones z JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-01' AND z.code='C'), 'C01', 'Kệ C01', 'ACTIVE', 1),
((SELECT z.id FROM warehouse_zones z JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-02' AND z.code='A'), 'A01', 'Kệ A01 chi nhánh', 'ACTIVE', 1),
((SELECT z.id FROM warehouse_zones z JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-02' AND z.code='A'), 'A02', 'Kệ A02 chi nhánh', 'ACTIVE', 2),
((SELECT z.id FROM warehouse_zones z JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-02' AND z.code='B'), 'B01', 'Kệ B01 chi nhánh', 'ACTIVE', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status), sort_order = VALUES(sort_order);

INSERT INTO warehouse_locations (shelf_id, code, layer_no, name, location_type, capacity_control_enabled, max_capacity, current_capacity, status, qr_code_value, notes)
VALUES
((SELECT s.id FROM warehouse_shelves s JOIN warehouse_zones z ON z.id=s.zone_id JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-01' AND z.code='A' AND s.code='A01'), 'HCM01-A-A01-01', 1, 'A01 tầng 1', 'STANDARD', TRUE, 500, 320, 'ACTIVE', 'QR-HCM01-A-A01-01', 'Sữa công thức'),
((SELECT s.id FROM warehouse_shelves s JOIN warehouse_zones z ON z.id=s.zone_id JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-01' AND z.code='A' AND s.code='A01'), 'HCM01-A-A01-02', 2, 'A01 tầng 2', 'STANDARD', TRUE, 500, 180, 'ACTIVE', 'QR-HCM01-A-A01-02', 'Bột ăn dặm'),
((SELECT s.id FROM warehouse_shelves s JOIN warehouse_zones z ON z.id=s.zone_id JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-01' AND z.code='A' AND s.code='A02'), 'HCM01-A-A02-01', 1, 'A02 tầng 1', 'STANDARD', TRUE, 450, 210, 'ACTIVE', 'QR-HCM01-A-A02-01', 'Sữa bột'),
((SELECT s.id FROM warehouse_shelves s JOIN warehouse_zones z ON z.id=s.zone_id JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-01' AND z.code='B' AND s.code='B01'), 'HCM01-B-B01-01', 1, 'B01 tầng 1', 'BULKY', TRUE, 800, 620, 'ACTIVE', 'QR-HCM01-B-B01-01', 'Tã bỉm'),
((SELECT s.id FROM warehouse_shelves s JOIN warehouse_zones z ON z.id=s.zone_id JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-01' AND z.code='C' AND s.code='C01'), 'HCM01-C-C01-01', 1, 'C01 tầng 1', 'STANDARD', TRUE, 300, 95, 'ACTIVE', 'QR-HCM01-C-C01-01', 'Đồ sơ sinh'),
((SELECT s.id FROM warehouse_shelves s JOIN warehouse_zones z ON z.id=s.zone_id JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-02' AND z.code='A' AND s.code='A01'), 'HCM02-A-A01-01', 1, 'A01 tầng 1 chi nhánh', 'STANDARD', TRUE, 350, 140, 'ACTIVE', 'QR-HCM02-A-A01-01', 'Hàng bán chạy'),
((SELECT s.id FROM warehouse_shelves s JOIN warehouse_zones z ON z.id=s.zone_id JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-02' AND z.code='A' AND s.code='A02'), 'HCM02-A-A02-01', 1, 'A02 tầng 1 chi nhánh', 'STANDARD', TRUE, 350, 0, 'ACTIVE', 'QR-HCM02-A-A02-01', 'Ô trống chi nhánh'),
((SELECT s.id FROM warehouse_shelves s JOIN warehouse_zones z ON z.id=s.zone_id JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-02' AND z.code='B' AND s.code='B01'), 'HCM02-B-B01-01', 1, 'B01 tầng 1 chi nhánh', 'BULKY', TRUE, 500, 0, 'ACTIVE', 'QR-HCM02-B-B01-01', 'Khu hàng cồng kềnh')
ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status), current_capacity = VALUES(current_capacity), notes = VALUES(notes);

-- 3) Danh muc, thuong hieu, nha cung cap
INSERT INTO categories (parent_id, code, name, description, sort_order, status)
VALUES (NULL, 'ME-VA-BE', 'Mẹ và Bé', 'Nhóm hàng mẹ và bé', 1, 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), status = VALUES(status);

INSERT INTO categories (parent_id, code, name, description, sort_order, status)
VALUES
((SELECT parent.id FROM (SELECT id FROM categories WHERE code='ME-VA-BE') parent), 'SUA-CONG-THUC', 'Sữa công thức', 'Sữa bột và sữa dinh dưỡng cho bé', 10, 'ACTIVE'),
((SELECT parent.id FROM (SELECT id FROM categories WHERE code='ME-VA-BE') parent), 'BIM-TA', 'Bỉm tã', 'Tã quần, tã dán và khăn ướt', 20, 'ACTIVE'),
((SELECT parent.id FROM (SELECT id FROM categories WHERE code='ME-VA-BE') parent), 'DO-SO-SINH', 'Đồ sơ sinh', 'Đồ dùng chăm sóc trẻ sơ sinh', 30, 'ACTIVE'),
((SELECT parent.id FROM (SELECT id FROM categories WHERE code='ME-VA-BE') parent), 'AN-DAM', 'Ăn dặm', 'Bột ăn dặm, bánh ăn dặm và cháo dinh dưỡng', 40, 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), status = VALUES(status);

INSERT INTO brands (code, name, status)
VALUES
('HUGGIES', 'Huggies', 'ACTIVE'),
('FRISO', 'Friso', 'ACTIVE'),
('CHICCO', 'Chicco', 'ACTIVE'),
('HEINZ', 'Heinz', 'ACTIVE'),
('PIGEON', 'Pigeon', 'ACTIVE'),
('MOONY', 'Moony', 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status);

INSERT INTO suppliers (code, name, tax_code, contact_name, phone, email, address, status)
VALUES
('NCC-FRISO', 'Công ty TNHH FrieslandCampina Việt Nam', '0310000001', 'Nguyễn Hoàng Anh', '02811112222', 'sales.friso@example.com', 'TP.HCM', 'ACTIVE'),
('NCC-HUGGIES', 'Nhà phân phối Kimberly-Clark', '0310000002', 'Trần Minh Khoa', '02822223333', 'sales.huggies@example.com', 'Bình Dương', 'ACTIVE'),
('NCC-BABYCARE', 'Công ty Baby Care Việt Nam', '0310000003', 'Lê Thanh Tâm', '02833334444', 'contact@babycare.example.com', 'Đồng Nai', 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), contact_name = VALUES(contact_name), phone = VALUES(phone), status = VALUES(status);

-- 4) San pham va bien the
INSERT INTO products (category_id, brand_id, code, name, description, status)
VALUES
((SELECT id FROM categories WHERE code='BIM-TA'), (SELECT id FROM brands WHERE code='HUGGIES'), 'SP-BIM-HUG', 'Tã quần Huggies', 'Tã quần cho bé, thấm hút tốt', 'ACTIVE'),
((SELECT id FROM categories WHERE code='SUA-CONG-THUC'), (SELECT id FROM brands WHERE code='FRISO'), 'SP-SUA-FRISO', 'Sữa Frisolac Gold', 'Sữa công thức cho trẻ nhỏ', 'ACTIVE'),
((SELECT id FROM categories WHERE code='DO-SO-SINH'), (SELECT id FROM brands WHERE code='CHICCO'), 'SP-TI-GIAM-CHICCO', 'Ti giả Chicco silicone', 'Ti giả silicone mềm cho bé', 'ACTIVE'),
((SELECT id FROM categories WHERE code='AN-DAM'), (SELECT id FROM brands WHERE code='HEINZ'), 'SP-BOT-HEINZ', 'Bột ăn dặm Heinz', 'Bột ăn dặm vị ngũ cốc', 'ACTIVE'),
((SELECT id FROM categories WHERE code='DO-SO-SINH'), (SELECT id FROM brands WHERE code='PIGEON'), 'SP-BINH-SUA-PIGEON', 'Bình sữa Pigeon', 'Bình sữa cổ rộng PPSU', 'ACTIVE'),
((SELECT id FROM categories WHERE code='BIM-TA'), (SELECT id FROM brands WHERE code='MOONY'), 'SP-BIM-MOONY', 'Tã quần Moony', 'Tã quần cao cấp cho bé', 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), category_id = VALUES(category_id), brand_id = VALUES(brand_id), status = VALUES(status);

INSERT INTO product_variants (product_id, unit_id, sku, barcode, variant_name, attributes_json, min_stock_level, max_stock_level, weight, requires_lot_tracking, requires_expiry_tracking, purchase_price, status)
VALUES
((SELECT id FROM products WHERE code='SP-BIM-HUG'), (SELECT id FROM units WHERE code='PACK'), 'BIM-HUG-M', '8930001000011', 'Size M - gói 68 miếng', JSON_OBJECT('size','M','pieces',68), 10, 300, 2.100, TRUE, FALSE, 205000, 'ACTIVE'),
((SELECT id FROM products WHERE code='SP-BIM-HUG'), (SELECT id FROM units WHERE code='PACK'), 'BIM-HUG-L', '8930001000012', 'Size L - gói 62 miếng', JSON_OBJECT('size','L','pieces',62), 12, 320, 2.300, TRUE, FALSE, 219000, 'ACTIVE'),
((SELECT id FROM products WHERE code='SP-SUA-FRISO'), (SELECT id FROM units WHERE code='BOX'), 'SUA-FRISO-3', '8930002000011', 'Số 3 - hộp 850g', JSON_OBJECT('stage','3','weight','850g'), 20, 240, 0.950, TRUE, TRUE, 498000, 'ACTIVE'),
((SELECT id FROM products WHERE code='SP-SUA-FRISO'), (SELECT id FROM units WHERE code='BOX'), 'SUA-FRISO-4', '8930002000012', 'Số 4 - hộp 850g', JSON_OBJECT('stage','4','weight','850g'), 15, 220, 0.950, TRUE, TRUE, 510000, 'ACTIVE'),
((SELECT id FROM products WHERE code='SP-TI-GIAM-CHICCO'), (SELECT id FROM units WHERE code='PCS'), 'TI-GIAM-CHICCO', '8930003000011', 'Silicone 0-6 tháng', JSON_OBJECT('age','0-6 tháng'), 5, 120, 0.050, TRUE, FALSE, 89000, 'ACTIVE'),
((SELECT id FROM products WHERE code='SP-BOT-HEINZ'), (SELECT id FROM units WHERE code='BOX'), 'BOT-HEINZ-GC', '8930004000011', 'Ngũ cốc 200g', JSON_OBJECT('flavor','Ngũ cốc','weight','200g'), 8, 180, 0.250, TRUE, TRUE, 79000, 'ACTIVE'),
((SELECT id FROM products WHERE code='SP-BINH-SUA-PIGEON'), (SELECT id FROM units WHERE code='PCS'), 'BINH-PIGEON-240', '8930005000011', 'PPSU cổ rộng 240ml', JSON_OBJECT('capacity','240ml'), 6, 150, 0.160, TRUE, FALSE, 265000, 'ACTIVE'),
((SELECT id FROM products WHERE code='SP-BIM-MOONY'), (SELECT id FROM units WHERE code='PACK'), 'BIM-MOONY-M', '8930006000011', 'Size M - gói 58 miếng', JSON_OBJECT('size','M','pieces',58), 10, 280, 2.000, TRUE, FALSE, 245000, 'ACTIVE')
ON DUPLICATE KEY UPDATE variant_name = VALUES(variant_name), min_stock_level = VALUES(min_stock_level), max_stock_level = VALUES(max_stock_level), purchase_price = VALUES(purchase_price), status = VALUES(status);

INSERT INTO supplier_products (supplier_id, product_variant_id, supplier_sku, last_purchase_price, lead_time_days)
VALUES
((SELECT id FROM suppliers WHERE code='NCC-HUGGIES'), (SELECT id FROM product_variants WHERE sku='BIM-HUG-M'), 'HUG-M-68', 205000, 3),
((SELECT id FROM suppliers WHERE code='NCC-HUGGIES'), (SELECT id FROM product_variants WHERE sku='BIM-HUG-L'), 'HUG-L-62', 219000, 3),
((SELECT id FROM suppliers WHERE code='NCC-FRISO'), (SELECT id FROM product_variants WHERE sku='SUA-FRISO-3'), 'FRISO-GOLD-3-850', 498000, 5),
((SELECT id FROM suppliers WHERE code='NCC-FRISO'), (SELECT id FROM product_variants WHERE sku='SUA-FRISO-4'), 'FRISO-GOLD-4-850', 510000, 5),
((SELECT id FROM suppliers WHERE code='NCC-BABYCARE'), (SELECT id FROM product_variants WHERE sku='TI-GIAM-CHICCO'), 'CHICCO-PAC-06', 89000, 4),
((SELECT id FROM suppliers WHERE code='NCC-BABYCARE'), (SELECT id FROM product_variants WHERE sku='BOT-HEINZ-GC'), 'HEINZ-CEREAL-200', 79000, 4),
((SELECT id FROM suppliers WHERE code='NCC-BABYCARE'), (SELECT id FROM product_variants WHERE sku='BINH-PIGEON-240'), 'PIGEON-PPSU-240', 265000, 4),
((SELECT id FROM suppliers WHERE code='NCC-BABYCARE'), (SELECT id FROM product_variants WHERE sku='BIM-MOONY-M'), 'MOONY-M-58', 245000, 4)
ON DUPLICATE KEY UPDATE last_purchase_price = VALUES(last_purchase_price), lead_time_days = VALUES(lead_time_days);

-- 5) Lo hang va ton kho hien tai
INSERT INTO product_batches (product_variant_id, supplier_id, lot_number, manufacture_date, expiry_date, received_date, status, notes)
VALUES
((SELECT id FROM product_variants WHERE sku='BIM-HUG-M'), (SELECT id FROM suppliers WHERE code='NCC-HUGGIES'), 'LOT-HUG-M-202607', '2026-06-01', NULL, '2026-07-01', 'ACTIVE', 'Lô tã Huggies size M'),
((SELECT id FROM product_variants WHERE sku='BIM-HUG-L'), (SELECT id FROM suppliers WHERE code='NCC-HUGGIES'), 'LOT-HUG-L-202607', '2026-06-01', NULL, '2026-07-01', 'ACTIVE', 'Lô tã Huggies size L'),
((SELECT id FROM product_variants WHERE sku='SUA-FRISO-3'), (SELECT id FROM suppliers WHERE code='NCC-FRISO'), 'LOT-FRISO3-202605', '2026-05-01', '2027-11-30', '2026-07-02', 'ACTIVE', 'Sữa Friso số 3'),
((SELECT id FROM product_variants WHERE sku='SUA-FRISO-4'), (SELECT id FROM suppliers WHERE code='NCC-FRISO'), 'LOT-FRISO4-202605', '2026-05-01', '2027-12-31', '2026-07-02', 'ACTIVE', 'Sữa Friso số 4'),
((SELECT id FROM product_variants WHERE sku='TI-GIAM-CHICCO'), (SELECT id FROM suppliers WHERE code='NCC-BABYCARE'), 'LOT-CHICCO-202606', '2026-06-10', NULL, '2026-07-03', 'ACTIVE', 'Ti giả Chicco'),
((SELECT id FROM product_variants WHERE sku='BOT-HEINZ-GC'), (SELECT id FROM suppliers WHERE code='NCC-BABYCARE'), 'LOT-HEINZ-202601', '2026-01-10', '2026-09-15', '2026-07-04', 'NEAR_EXPIRY', 'Bột ăn dặm gần hạn'),
((SELECT id FROM product_variants WHERE sku='BINH-PIGEON-240'), (SELECT id FROM suppliers WHERE code='NCC-BABYCARE'), 'LOT-PIGEON-202606', '2026-06-15', NULL, '2026-07-04', 'ACTIVE', 'Bình sữa Pigeon'),
((SELECT id FROM product_variants WHERE sku='BIM-MOONY-M'), (SELECT id FROM suppliers WHERE code='NCC-BABYCARE'), 'LOT-MOONY-M-202607', '2026-07-01', NULL, '2026-07-05', 'ACTIVE', 'Tã Moony size M')
ON DUPLICATE KEY UPDATE status = VALUES(status), expiry_date = VALUES(expiry_date), notes = VALUES(notes);

INSERT INTO stock_locations (product_variant_id, location_id, batch_id, quantity, reserved_quantity, version)
VALUES
((SELECT id FROM product_variants WHERE sku='BIM-HUG-M'), (SELECT id FROM warehouse_locations WHERE code='HCM01-B-B01-01'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='BIM-HUG-M' AND b.lot_number='LOT-HUG-M-202607'), 150, 12, 1),
((SELECT id FROM product_variants WHERE sku='BIM-HUG-L'), (SELECT id FROM warehouse_locations WHERE code='HCM01-B-B01-01'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='BIM-HUG-L' AND b.lot_number='LOT-HUG-L-202607'), 95, 8, 1),
((SELECT id FROM product_variants WHERE sku='SUA-FRISO-3'), (SELECT id FROM warehouse_locations WHERE code='HCM01-A-A01-01'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='SUA-FRISO-3' AND b.lot_number='LOT-FRISO3-202605'), 8, 0, 1),
((SELECT id FROM product_variants WHERE sku='SUA-FRISO-4'), (SELECT id FROM warehouse_locations WHERE code='HCM01-A-A02-01'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='SUA-FRISO-4' AND b.lot_number='LOT-FRISO4-202605'), 64, 4, 1),
((SELECT id FROM product_variants WHERE sku='TI-GIAM-CHICCO'), (SELECT id FROM warehouse_locations WHERE code='HCM01-C-C01-01'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='TI-GIAM-CHICCO' AND b.lot_number='LOT-CHICCO-202606'), 0, 0, 1),
((SELECT id FROM product_variants WHERE sku='BOT-HEINZ-GC'), (SELECT id FROM warehouse_locations WHERE code='HCM01-A-A01-02'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='BOT-HEINZ-GC' AND b.lot_number='LOT-HEINZ-202601'), 24, 2, 1),
((SELECT id FROM product_variants WHERE sku='BINH-PIGEON-240'), (SELECT id FROM warehouse_locations WHERE code='HCM01-C-C01-01'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='BINH-PIGEON-240' AND b.lot_number='LOT-PIGEON-202606'), 37, 3, 1),
((SELECT id FROM product_variants WHERE sku='BIM-MOONY-M'), (SELECT id FROM warehouse_locations WHERE code='HCM02-A-A01-01'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='BIM-MOONY-M' AND b.lot_number='LOT-MOONY-M-202607'), 42, 5, 1)
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), reserved_quantity = VALUES(reserved_quantity), version = version + 1;

-- 6) Phieu nhap, xuat, chuyen kho
INSERT INTO goods_receipts (receipt_code, warehouse_id, supplier_id, status, reference_no, received_at, note, created_by, confirmed_by, confirmed_at)
VALUES
('PN-202607-001', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), (SELECT id FROM suppliers WHERE code='NCC-FRISO'), 'CONFIRMED', 'HD-FRISO-0701', '2026-07-02 09:30:00.000', 'Nhập sữa Friso đầu tháng 7', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), (SELECT id FROM users WHERE employee_code='NV-QLK'), '2026-07-02 10:00:00.000'),
('PN-202607-002', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), (SELECT id FROM suppliers WHERE code='NCC-HUGGIES'), 'CONFIRMED', 'HD-HUG-0701', '2026-07-01 14:00:00.000', 'Nhập tã Huggies', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), (SELECT id FROM users WHERE employee_code='NV-QLK'), '2026-07-01 14:30:00.000'),
('PN-202607-003', (SELECT id FROM warehouses WHERE code='KHO-HCM-02'), (SELECT id FROM suppliers WHERE code='NCC-BABYCARE'), 'PENDING', 'HD-BABY-0705', NULL, 'Phiếu nháp chờ xác nhận', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), NULL, NULL)
ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), confirmed_at = VALUES(confirmed_at);

INSERT INTO goods_receipt_items (goods_receipt_id, product_variant_id, batch_id, location_id, quantity, unit_cost, note)
SELECT gr.id, v.id, b.id, l.id, x.quantity, x.unit_cost, x.note
FROM (
    SELECT 'PN-202607-001' receipt_code, 'SUA-FRISO-3' sku, 'LOT-FRISO3-202605' lot_number, 'HCM01-A-A01-01' location_code, 80.000 quantity, 498000.00 unit_cost, 'Nhập mới' note
    UNION ALL SELECT 'PN-202607-001', 'SUA-FRISO-4', 'LOT-FRISO4-202605', 'HCM01-A-A02-01', 64.000, 510000.00, 'Nhập mới'
    UNION ALL SELECT 'PN-202607-002', 'BIM-HUG-M', 'LOT-HUG-M-202607', 'HCM01-B-B01-01', 150.000, 205000.00, 'Nhập mới'
    UNION ALL SELECT 'PN-202607-002', 'BIM-HUG-L', 'LOT-HUG-L-202607', 'HCM01-B-B01-01', 95.000, 219000.00, 'Nhập mới'
    UNION ALL SELECT 'PN-202607-003', 'BIM-MOONY-M', 'LOT-MOONY-M-202607', 'HCM02-A-A01-01', 42.000, 350000.00, 'Nhập bổ sung chi nhánh'
) x
JOIN goods_receipts gr ON gr.receipt_code=x.receipt_code
JOIN product_variants v ON v.sku=x.sku
JOIN product_batches b ON b.product_variant_id=v.id AND b.lot_number=x.lot_number
JOIN warehouse_locations l ON l.code=x.location_code
WHERE NOT EXISTS (
    SELECT 1 FROM goods_receipt_items gi
    WHERE gi.goods_receipt_id=gr.id AND gi.product_variant_id=v.id AND gi.batch_id=b.id AND gi.location_id=l.id
);

INSERT INTO goods_issues (issue_code, warehouse_id, status, reference_no, issued_at, note, created_by, confirmed_by, confirmed_at)
VALUES
('PX-202607-001', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), 'CONFIRMED', 'SO-0706-001', '2026-07-06 15:00:00.000', 'Xuất bán cho cửa hàng mẹ và bé', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), (SELECT id FROM users WHERE employee_code='NV-QLK'), '2026-07-06 15:20:00.000'),
('PX-202607-002', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), 'PENDING', 'SO-0710-002', NULL, 'Chờ duyệt xuất hàng', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), NULL, NULL)
ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), confirmed_at = VALUES(confirmed_at);

INSERT INTO goods_issue_items (goods_issue_id, product_variant_id, batch_id, location_id, quantity, note)
SELECT gi.id, v.id, b.id, l.id, x.quantity, x.note
FROM (
    SELECT 'PX-202607-001' issue_code, 'SUA-FRISO-3' sku, 'LOT-FRISO3-202605' lot_number, 'HCM01-A-A01-01' location_code, 12.000 quantity, 'Xuất bán' note
    UNION ALL SELECT 'PX-202607-001', 'BIM-HUG-M', 'LOT-HUG-M-202607', 'HCM01-B-B01-01', 20.000, 'Xuất bán'
    UNION ALL SELECT 'PX-202607-002', 'BOT-HEINZ-GC', 'LOT-HEINZ-202601', 'HCM01-A-A01-02', 6.000, 'Chờ duyệt'
) x
JOIN goods_issues gi ON gi.issue_code=x.issue_code
JOIN product_variants v ON v.sku=x.sku
JOIN product_batches b ON b.product_variant_id=v.id AND b.lot_number=x.lot_number
JOIN warehouse_locations l ON l.code=x.location_code
WHERE NOT EXISTS (
    SELECT 1 FROM goods_issue_items ii
    WHERE ii.goods_issue_id=gi.id AND ii.product_variant_id=v.id AND ii.batch_id=b.id AND ii.location_id=l.id
);

INSERT INTO stock_transfers (transfer_code, source_warehouse_id, destination_warehouse_id, status, note, created_by, confirmed_by, confirmed_at)
VALUES
('CK-202607-001', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), (SELECT id FROM warehouses WHERE code='KHO-HCM-02'), 'CONFIRMED', 'Chuyển hàng bán chạy sang chi nhánh Quận 7', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), (SELECT id FROM users WHERE employee_code='NV-QLK'), '2026-07-08 11:00:00.000'),
('CK-202607-002', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), (SELECT id FROM warehouses WHERE code='KHO-HCM-02'), 'DRAFT', 'Dự kiến bổ sung sữa Friso', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), NULL, NULL)
ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), confirmed_at = VALUES(confirmed_at);

INSERT INTO stock_transfer_items (stock_transfer_id, product_variant_id, batch_id, source_location_id, destination_location_id, quantity, note)
SELECT st.id, v.id, b.id, src.id, dst.id, x.quantity, x.note
FROM (
    SELECT 'CK-202607-001' transfer_code, 'BIM-HUG-M' sku, 'LOT-HUG-M-202607' lot_number, 'HCM01-B-B01-01' source_code, 'HCM02-A-A01-01' destination_code, 30.000 quantity, 'Chuyển về chi nhánh' note
) x
JOIN stock_transfers st ON st.transfer_code=x.transfer_code
JOIN product_variants v ON v.sku=x.sku
JOIN product_batches b ON b.product_variant_id=v.id AND b.lot_number=x.lot_number
JOIN warehouse_locations src ON src.code=x.source_code
JOIN warehouse_locations dst ON dst.code=x.destination_code
WHERE NOT EXISTS (
    SELECT 1 FROM stock_transfer_items ti
    WHERE ti.stock_transfer_id=st.id AND ti.product_variant_id=v.id AND ti.batch_id=b.id
);

-- 6.1) Nhat ky giao dich ton kho
INSERT INTO inventory_transactions (transaction_code, transaction_type, warehouse_id, product_variant_id, batch_id, source_location_id, destination_location_id, quantity, quantity_before, quantity_after, reference_type, reference_id, reason_code, note, performed_by, approved_by, created_at)
VALUES
('GD-202607-001', 'RECEIPT', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), (SELECT id FROM product_variants WHERE sku='SUA-FRISO-3'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='SUA-FRISO-3' AND b.lot_number='LOT-FRISO3-202605'), NULL, (SELECT id FROM warehouse_locations WHERE code='HCM01-A-A01-01'), 80.000, 0.000, 80.000, 'GOODS_RECEIPT', (SELECT id FROM goods_receipts WHERE receipt_code='PN-202607-001'), 'NHAP_HANG', 'Nhập sữa Friso số 3', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), (SELECT id FROM users WHERE employee_code='NV-QLK'), '2026-07-02 10:00:00.000'),
('GD-202607-002', 'RECEIPT', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), (SELECT id FROM product_variants WHERE sku='BIM-HUG-M'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='BIM-HUG-M' AND b.lot_number='LOT-HUG-M-202607'), NULL, (SELECT id FROM warehouse_locations WHERE code='HCM01-B-B01-01'), 150.000, 0.000, 150.000, 'GOODS_RECEIPT', (SELECT id FROM goods_receipts WHERE receipt_code='PN-202607-002'), 'NHAP_HANG', 'Nhập tã Huggies size M', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), (SELECT id FROM users WHERE employee_code='NV-QLK'), '2026-07-01 14:30:00.000'),
('GD-202607-003', 'ISSUE', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), (SELECT id FROM product_variants WHERE sku='SUA-FRISO-3'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='SUA-FRISO-3' AND b.lot_number='LOT-FRISO3-202605'), (SELECT id FROM warehouse_locations WHERE code='HCM01-A-A01-01'), NULL, 12.000, 80.000, 68.000, 'GOODS_ISSUE', (SELECT id FROM goods_issues WHERE issue_code='PX-202607-001'), 'XUAT_BAN', 'Xuất bán sữa Friso số 3', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), (SELECT id FROM users WHERE employee_code='NV-QLK'), '2026-07-06 15:20:00.000'),
('GD-202607-004', 'ISSUE', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), (SELECT id FROM product_variants WHERE sku='BIM-HUG-M'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='BIM-HUG-M' AND b.lot_number='LOT-HUG-M-202607'), (SELECT id FROM warehouse_locations WHERE code='HCM01-B-B01-01'), NULL, 20.000, 150.000, 130.000, 'GOODS_ISSUE', (SELECT id FROM goods_issues WHERE issue_code='PX-202607-001'), 'XUAT_BAN', 'Xuất bán tã Huggies size M', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), (SELECT id FROM users WHERE employee_code='NV-QLK'), '2026-07-06 15:20:00.000'),
('GD-202607-005', 'TRANSFER_OUT', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), (SELECT id FROM product_variants WHERE sku='BIM-HUG-M'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='BIM-HUG-M' AND b.lot_number='LOT-HUG-M-202607'), (SELECT id FROM warehouse_locations WHERE code='HCM01-B-B01-01'), (SELECT id FROM warehouse_locations WHERE code='HCM02-A-A01-01'), 30.000, 130.000, 100.000, 'STOCK_TRANSFER', (SELECT id FROM stock_transfers WHERE transfer_code='CK-202607-001'), 'CHUYEN_KHO', 'Chuyển tã Huggies sang chi nhánh Quận 7', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), (SELECT id FROM users WHERE employee_code='NV-QLK'), '2026-07-08 11:00:00.000'),
('GD-202607-006', 'TRANSFER_IN', (SELECT id FROM warehouses WHERE code='KHO-HCM-02'), (SELECT id FROM product_variants WHERE sku='BIM-HUG-M'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='BIM-HUG-M' AND b.lot_number='LOT-HUG-M-202607'), (SELECT id FROM warehouse_locations WHERE code='HCM01-B-B01-01'), (SELECT id FROM warehouse_locations WHERE code='HCM02-A-A01-01'), 30.000, 0.000, 30.000, 'STOCK_TRANSFER', (SELECT id FROM stock_transfers WHERE transfer_code='CK-202607-001'), 'CHUYEN_KHO', 'Nhận tã Huggies tại chi nhánh Quận 7', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), (SELECT id FROM users WHERE employee_code='NV-QLK'), '2026-07-08 11:00:00.000'),
('GD-202607-007', 'COUNT_ADJUSTMENT_OUT', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), (SELECT id FROM product_variants WHERE sku='SUA-FRISO-3'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='SUA-FRISO-3' AND b.lot_number='LOT-FRISO3-202605'), (SELECT id FROM warehouse_locations WHERE code='HCM01-A-A01-01'), NULL, 1.000, 8.000, 7.000, 'STOCK_ADJUSTMENT', (SELECT id FROM stock_adjustments WHERE adjustment_code='DC-202607-001'), 'KIEM_KE_LECH_THIEU', 'Điều chỉnh giảm theo kiểm kê', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), (SELECT id FROM users WHERE employee_code='NV-QLK'), '2026-07-12 16:05:00.000')
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), quantity_before = VALUES(quantity_before), quantity_after = VALUES(quantity_after), note = VALUES(note);

DELETE FROM notifications WHERE title IN ('Cảnh báo tồn kho thấp', 'Có phiếu kiểm kê được giao', 'Có phiếu điều chỉnh chờ duyệt');
DELETE FROM alerts WHERE title IN ('Sữa Friso số 3 sắp hết hàng', 'Ti giả Chicco đã hết hàng', 'Bột ăn dặm Heinz gần hạn');
-- 7) Kiem ke, dieu chinh, canh bao
INSERT INTO stock_counts (count_code, warehouse_id, scope_type, scope_reference_id, status, snapshot_at, assigned_to, created_by, submitted_by, submitted_at, approved_by, approved_at, note)
VALUES
('KK-202607-001', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), 'ZONE', (SELECT z.id FROM warehouse_zones z JOIN warehouses w ON w.id=z.warehouse_id WHERE w.code='KHO-HCM-01' AND z.code='A'), 'APPROVED', '2026-07-12 08:00:00.000', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), (SELECT id FROM users WHERE employee_code='NV-QLK'), (SELECT id FROM users WHERE employee_code='NV-KHO-01'), '2026-07-12 15:00:00.000', (SELECT id FROM users WHERE employee_code='NV-QLK'), '2026-07-12 16:00:00.000', 'Kiểm kê khu sữa'),
('KK-202607-002', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), 'WAREHOUSE', NULL, 'IN_PROGRESS', '2026-07-18 08:00:00.000', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), (SELECT id FROM users WHERE employee_code='NV-QLK'), NULL, NULL, NULL, NULL, 'Kiểm kê toàn kho đang thực hiện')
ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), approved_at = VALUES(approved_at);

INSERT INTO stock_count_items (stock_count_id, product_variant_id, batch_id, location_id, system_quantity, actual_quantity, reason_code, note, counted_by, counted_at)
SELECT sc.id, v.id, b.id, l.id, x.system_quantity, x.actual_quantity, x.reason_code, x.note, u.id, x.counted_at
FROM (
    SELECT 'KK-202607-001' count_code, 'SUA-FRISO-3' sku, 'LOT-FRISO3-202605' lot_number, 'HCM01-A-A01-01' location_code, 8.000 system_quantity, 7.000 actual_quantity, 'LECH_THIEU' reason_code, 'Thiếu 1 hộp khi kiểm kê' note, '2026-07-12 14:00:00.000' counted_at
    UNION ALL SELECT 'KK-202607-001', 'SUA-FRISO-4', 'LOT-FRISO4-202605', 'HCM01-A-A02-01', 64.000, 64.000, NULL, 'Đúng tồn hệ thống', '2026-07-12 14:10:00.000'
    UNION ALL SELECT 'KK-202607-002', 'BIM-HUG-M', 'LOT-HUG-M-202607', 'HCM01-B-B01-01', 150.000, NULL, NULL, 'Chưa kiểm đếm', NULL
) x
JOIN stock_counts sc ON sc.count_code=x.count_code
JOIN product_variants v ON v.sku=x.sku
JOIN product_batches b ON b.product_variant_id=v.id AND b.lot_number=x.lot_number
JOIN warehouse_locations l ON l.code=x.location_code
LEFT JOIN users u ON u.employee_code='NV-KHO-01'
WHERE NOT EXISTS (
    SELECT 1 FROM stock_count_items ci
    WHERE ci.stock_count_id=sc.id AND ci.product_variant_id=v.id AND ci.batch_id=b.id AND ci.location_id=l.id
);

INSERT INTO stock_adjustments (adjustment_code, warehouse_id, stock_count_id, adjustment_type, status, reason_code, note, created_by, submitted_by, submitted_at, approved_by, approved_at)
VALUES
('DC-202607-001', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), (SELECT id FROM stock_counts WHERE count_code='KK-202607-001'), 'COUNT', 'APPROVED', 'KIEM_KE_LECH_THIEU', 'Điều chỉnh theo kiểm kê khu A', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), (SELECT id FROM users WHERE employee_code='NV-KHO-01'), '2026-07-12 15:05:00.000', (SELECT id FROM users WHERE employee_code='NV-QLK'), '2026-07-12 16:05:00.000'),
('DC-202607-002', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), NULL, 'MANUAL', 'PENDING', 'HANG_HONG', 'Chờ duyệt điều chỉnh hàng hỏng', (SELECT id FROM users WHERE employee_code='NV-KHO-01'), (SELECT id FROM users WHERE employee_code='NV-KHO-01'), '2026-07-19 09:00:00.000', NULL, NULL)
ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), approved_at = VALUES(approved_at);

INSERT INTO stock_adjustment_items (stock_adjustment_id, product_variant_id, batch_id, location_id, adjustment_direction, quantity, quantity_before, quantity_after, reason_code, note)
SELECT sa.id, v.id, b.id, l.id, x.direction, x.quantity, x.quantity_before, x.quantity_after, x.reason_code, x.note
FROM (
    SELECT 'DC-202607-001' adjustment_code, 'SUA-FRISO-3' sku, 'LOT-FRISO3-202605' lot_number, 'HCM01-A-A01-01' location_code, 'OUT' direction, 1.000 quantity, 8.000 quantity_before, 7.000 quantity_after, 'KIEM_KE_LECH_THIEU' reason_code, 'Giảm tồn theo kiểm kê' note
    UNION ALL SELECT 'DC-202607-002', 'BOT-HEINZ-GC', 'LOT-HEINZ-202601', 'HCM01-A-A01-02', 'OUT', 2.000, 24.000, 22.000, 'HANG_HONG', 'Hộp móp méo cần loại khỏi tồn bán'
) x
JOIN stock_adjustments sa ON sa.adjustment_code=x.adjustment_code
JOIN product_variants v ON v.sku=x.sku
JOIN product_batches b ON b.product_variant_id=v.id AND b.lot_number=x.lot_number
JOIN warehouse_locations l ON l.code=x.location_code
WHERE NOT EXISTS (
    SELECT 1 FROM stock_adjustment_items ai
    WHERE ai.stock_adjustment_id=sa.id AND ai.product_variant_id=v.id AND ai.batch_id=b.id AND ai.location_id=l.id
);

INSERT INTO alerts (alert_type, severity, warehouse_id, product_variant_id, batch_id, location_id, title, message, status, assigned_to)
VALUES
('LOW_STOCK', 'WARNING', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), (SELECT id FROM product_variants WHERE sku='SUA-FRISO-3'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='SUA-FRISO-3' AND b.lot_number='LOT-FRISO3-202605'), (SELECT id FROM warehouse_locations WHERE code='HCM01-A-A01-01'), 'Sữa Friso số 3 sắp hết hàng', 'Tồn kho hiện tại thấp hơn mức tối thiểu, cần lập kế hoạch nhập bổ sung.', 'OPEN', (SELECT id FROM users WHERE employee_code='NV-QLK')),
('OUT_OF_STOCK', 'CRITICAL', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), (SELECT id FROM product_variants WHERE sku='TI-GIAM-CHICCO'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='TI-GIAM-CHICCO' AND b.lot_number='LOT-CHICCO-202606'), (SELECT id FROM warehouse_locations WHERE code='HCM01-C-C01-01'), 'Ti giả Chicco đã hết hàng', 'SKU TI-GIAM-CHICCO không còn tồn khả dụng.', 'OPEN', (SELECT id FROM users WHERE employee_code='NV-QLK')),
('NEAR_EXPIRY', 'WARNING', (SELECT id FROM warehouses WHERE code='KHO-HCM-01'), (SELECT id FROM product_variants WHERE sku='BOT-HEINZ-GC'), (SELECT b.id FROM product_batches b JOIN product_variants v ON v.id=b.product_variant_id WHERE v.sku='BOT-HEINZ-GC' AND b.lot_number='LOT-HEINZ-202601'), (SELECT id FROM warehouse_locations WHERE code='HCM01-A-A01-02'), 'Bột ăn dặm Heinz gần hạn', 'Lô LOT-HEINZ-202601 cần ưu tiên xuất trước.', 'OPEN', (SELECT id FROM users WHERE employee_code='NV-KHO-01'));

INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id, is_read)
VALUES
((SELECT id FROM users WHERE employee_code='NV-QLK'), 'LOW_STOCK', 'Cảnh báo tồn kho thấp', 'Sữa Friso số 3 đang thấp hơn mức tối thiểu.', 'ALERT', (SELECT MAX(id) FROM alerts WHERE alert_type='LOW_STOCK'), FALSE),
((SELECT id FROM users WHERE employee_code='NV-KHO-01'), 'STOCK_COUNT', 'Có phiếu kiểm kê được giao', 'Bạn được phân công kiểm kê toàn kho KK-202607-002.', 'STOCK_COUNT', (SELECT id FROM stock_counts WHERE count_code='KK-202607-002'), FALSE),
((SELECT id FROM users WHERE employee_code='NV-QLK'), 'ADJUSTMENT_PENDING', 'Có phiếu điều chỉnh chờ duyệt', 'Phiếu DC-202607-002 đang chờ phê duyệt.', 'STOCK_ADJUSTMENT', (SELECT id FROM stock_adjustments WHERE adjustment_code='DC-202607-002'), FALSE);

SET FOREIGN_KEY_CHECKS = 1;