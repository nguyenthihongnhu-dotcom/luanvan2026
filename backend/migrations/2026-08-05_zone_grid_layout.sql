-- Lưu vị trí của khu vực trên mặt bằng tổng thể của kho.
-- Trước đây vị trí khu chỉ nằm trong state React nên kéo thả xong, reload là mất.
--
-- Chạy trên CSDL đang có (không mất dữ liệu):
--   mysql -u root -p warehouse_management < backend/migrations/2026-08-05_zone_grid_layout.sql
--
-- grid_row / grid_col : tọa độ ô trên lưới mặt bằng, NULL = khu chưa được đặt lên mặt bằng
-- grid_size           : số ô khu chiếm trên lưới (mặc định lấy theo số kệ)

ALTER TABLE warehouse_zones
    ADD COLUMN grid_row INT NULL AFTER sort_order,
    ADD COLUMN grid_col INT NULL AFTER grid_row,
    ADD COLUMN grid_size INT UNSIGNED NULL AFTER grid_col;
