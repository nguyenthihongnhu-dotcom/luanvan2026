-- ============================================================
-- Migration: Quên mật khẩu chờ quản trị viên duyệt
-- Ngày: 2026-08-16
--
-- Chạy file này trên CSDL ĐANG CÓ DỮ LIỆU. Nếu tạo mới database từ
-- warehouse_management_mysql.sql thì bỏ qua — nội dung dưới đây đã nằm sẵn
-- trong file schema đó.
--
--   mysql -u root -p warehouse_management < backend/migrations/2026-08-16_password-reset-requests.sql
-- ============================================================

USE warehouse_management;

-- 1) Hàng đợi yêu cầu quên mật khẩu do nhân viên tự gửi từ màn hình đăng nhập.
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    requested_email VARCHAR(191) NOT NULL,
    status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    note VARCHAR(500) NULL,
    approved_by BIGINT UNSIGNED NULL,
    approved_at DATETIME(3) NULL,
    rejected_by BIGINT UNSIGNED NULL,
    rejected_at DATETIME(3) NULL,
    rejection_reason VARCHAR(500) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_password_reset_requests_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_password_reset_requests_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id),
    CONSTRAINT fk_password_reset_requests_rejected_by
        FOREIGN KEY (rejected_by) REFERENCES users(id),
    INDEX idx_password_reset_requests_status (status, created_at),
    INDEX idx_password_reset_requests_user (user_id, status)
) ENGINE=InnoDB;

-- 2) Quyền duyệt yêu cầu.
INSERT INTO permissions (code, name, module, description)
VALUES
    ('users:reset_password', 'Duyệt yêu cầu quên mật khẩu', 'auth', 'Duyệt hoặc từ chối yêu cầu quên mật khẩu và đặt lại mật khẩu mặc định')
ON DUPLICATE KEY UPDATE name = VALUES(name), module = VALUES(module), description = VALUES(description);

-- 3) Gán quyền cho ADMIN và WAREHOUSE_MANAGER.
--    (Tài khoản ADMIN vốn đã bỏ qua kiểm tra quyền trong requirePermission,
--     nhưng vẫn gán để bảng phân quyền phản ánh đúng thực tế.)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'users:reset_password'
WHERE r.code IN ('ADMIN', 'WAREHOUSE_MANAGER')
ON DUPLICATE KEY UPDATE permission_id = VALUES(permission_id);
