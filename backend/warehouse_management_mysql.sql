-- ============================================================
-- WAREHOUSE MANAGEMENT SYSTEM - MYSQL 8+
-- Mother & Baby Products Warehouse
-- Charset: utf8mb4
-- Engine: InnoDB
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS warehouse_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE warehouse_management;

-- ============================================================
-- 1. AUTHORIZATION
-- ============================================================

CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

CREATE TABLE permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    module VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    employee_code VARCHAR(50) NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    phone VARCHAR(30) NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('ACTIVE','LOCKED','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    last_login_at DATETIME(3) NULL,
    failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0,
    locked_until DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,
    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(id),
    INDEX idx_users_status (status),
    INDEX idx_users_deleted_at (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE user_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    user_agent VARCHAR(500) NULL,
    ip_address VARCHAR(45) NULL,
    expires_at DATETIME(3) NOT NULL,
    revoked_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_user_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_sessions_user (user_id),
    INDEX idx_user_sessions_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE password_reset_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(191) NOT NULL UNIQUE,
    expires_at DATETIME(3) NOT NULL,
    used_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_password_reset_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_password_reset_tokens_user (user_id),
    INDEX idx_password_reset_tokens_expires (expires_at)
) ENGINE=InnoDB;

-- ============================================================
-- 2. WAREHOUSE MAPPING
-- ============================================================

CREATE TABLE warehouses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    address_line VARCHAR(255) NULL,
    ward VARCHAR(100) NULL,
    district VARCHAR(100) NULL,
    province VARCHAR(100) NULL,
    manager_user_id BIGINT UNSIGNED NULL,
    status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    description TEXT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,
    CONSTRAINT fk_warehouses_manager
        FOREIGN KEY (manager_user_id) REFERENCES users(id),
    INDEX idx_warehouses_status (status)
) ENGINE=InnoDB;

CREATE TABLE user_warehouses (
    user_id BIGINT UNSIGNED NOT NULL,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (user_id, warehouse_id),
    CONSTRAINT fk_user_warehouses_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_warehouses_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
) ENGINE=InnoDB;

CREATE TABLE warehouse_zones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    status ENUM('ACTIVE','INACTIVE','MAINTENANCE') NOT NULL DEFAULT 'ACTIVE',
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    -- Vị trí khu trên mặt bằng tổng thể của kho. NULL = chưa đặt lên mặt bằng.
    grid_row INT NULL,
    grid_col INT NULL,
    grid_size INT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,
    CONSTRAINT uq_zone_code UNIQUE (warehouse_id, code),
    CONSTRAINT fk_zones_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    INDEX idx_zones_warehouse_status (warehouse_id, status)
) ENGINE=InnoDB;

CREATE TABLE warehouse_shelves (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    zone_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    status ENUM('ACTIVE','INACTIVE','MAINTENANCE') NOT NULL DEFAULT 'ACTIVE',
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,
    CONSTRAINT uq_shelf_code UNIQUE (zone_id, code),
    CONSTRAINT fk_shelves_zone
        FOREIGN KEY (zone_id) REFERENCES warehouse_zones(id),
    INDEX idx_shelves_zone_status (zone_id, status)
) ENGINE=InnoDB;

CREATE TABLE warehouse_locations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shelf_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    layer_no INT UNSIGNED NOT NULL,
    name VARCHAR(120) NULL,
    location_type ENUM('STANDARD','COLD','BULKY','SECURE','DAMAGED','RETURN') NOT NULL DEFAULT 'STANDARD',
    capacity_control_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    max_capacity DECIMAL(18,3) NULL,
    current_capacity DECIMAL(18,3) NOT NULL DEFAULT 0,
    status ENUM('ACTIVE','INACTIVE','LOCKED','MAINTENANCE','FULL') NOT NULL DEFAULT 'ACTIVE',
    qr_code_value VARCHAR(191) NULL UNIQUE,
    notes VARCHAR(500) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,
    CONSTRAINT uq_location_layer UNIQUE (shelf_id, layer_no),
    CONSTRAINT fk_locations_shelf
        FOREIGN KEY (shelf_id) REFERENCES warehouse_shelves(id),
    CONSTRAINT chk_locations_capacity
        CHECK (
            max_capacity IS NULL
            OR max_capacity >= 0
        ),
    CONSTRAINT chk_locations_current_capacity
        CHECK (current_capacity >= 0),
    INDEX idx_locations_shelf_status (shelf_id, status),
    INDEX idx_locations_type_status (location_type, status)
) ENGINE=InnoDB;

-- ============================================================
-- 3. MASTER DATA
-- ============================================================

CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parent_id BIGINT UNSIGNED NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500) NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,
    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id) REFERENCES categories(id),
    INDEX idx_categories_parent_status (parent_id, status)
) ENGINE=InnoDB;

CREATE TABLE brands (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL UNIQUE,
    status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

CREATE TABLE units (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    precision_scale TINYINT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    brand_id BIGINT UNSIGNED NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    status ENUM('ACTIVE','INACTIVE','DISCONTINUED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_products_brand
        FOREIGN KEY (brand_id) REFERENCES brands(id),
    FULLTEXT INDEX ftx_products_name_description (name, description),
    INDEX idx_products_category_status (category_id, status),
    INDEX idx_products_brand_status (brand_id, status)
) ENGINE=InnoDB;

CREATE TABLE product_variants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    unit_id BIGINT UNSIGNED NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    barcode VARCHAR(100) NULL UNIQUE,
    variant_name VARCHAR(200) NOT NULL,
    attributes_json JSON NULL,
    min_stock_level DECIMAL(18,3) NOT NULL DEFAULT 0,
    max_stock_level DECIMAL(18,3) NULL,
    weight DECIMAL(18,3) NULL,
    length DECIMAL(18,3) NULL,
    width DECIMAL(18,3) NULL,
    height DECIMAL(18,3) NULL,
    requires_lot_tracking BOOLEAN NOT NULL DEFAULT FALSE,
    requires_expiry_tracking BOOLEAN NOT NULL DEFAULT FALSE,
    purchase_price DECIMAL(18,2) NULL,
    status ENUM('ACTIVE','INACTIVE','DISCONTINUED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,
    CONSTRAINT fk_variants_product
        FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_variants_unit
        FOREIGN KEY (unit_id) REFERENCES units(id),
    CONSTRAINT chk_variant_min_stock
        CHECK (min_stock_level >= 0),
    CONSTRAINT chk_variant_max_stock
        CHECK (max_stock_level IS NULL OR max_stock_level >= min_stock_level),
    INDEX idx_variants_product_status (product_id, status),
    INDEX idx_variants_sku (sku),
    INDEX idx_variants_barcode (barcode)
) ENGINE=InnoDB;

CREATE TABLE product_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    url VARCHAR(500) NOT NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_product_images_product (product_id)
) ENGINE=InnoDB;

CREATE TABLE suppliers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    tax_code VARCHAR(50) NULL,
    contact_name VARCHAR(150) NULL,
    phone VARCHAR(30) NULL,
    email VARCHAR(191) NULL,
    address VARCHAR(500) NULL,
    status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,
    INDEX idx_suppliers_status (status)
) ENGINE=InnoDB;

CREATE TABLE supplier_products (
    supplier_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED NOT NULL,
    supplier_sku VARCHAR(100) NULL,
    last_purchase_price DECIMAL(18,2) NULL,
    lead_time_days INT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (supplier_id, product_variant_id),
    CONSTRAINT fk_supplier_products_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT fk_supplier_products_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
) ENGINE=InnoDB;

-- ============================================================
-- 4. BATCH / LOT
-- ============================================================

CREATE TABLE product_batches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_variant_id BIGINT UNSIGNED NOT NULL,
    supplier_id BIGINT UNSIGNED NULL,
    lot_number VARCHAR(100) NOT NULL,
    manufacture_date DATE NULL,
    expiry_date DATE NULL,
    received_date DATE NULL,
    status ENUM('ACTIVE','NEAR_EXPIRY','EXPIRED','BLOCKED','DEPLETED') NOT NULL DEFAULT 'ACTIVE',
    notes VARCHAR(500) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT uq_batch_lot UNIQUE (product_variant_id, lot_number),
    CONSTRAINT fk_batches_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    CONSTRAINT fk_batches_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT chk_batch_dates
        CHECK (
            expiry_date IS NULL
            OR manufacture_date IS NULL
            OR expiry_date > manufacture_date
        ),
    INDEX idx_batches_expiry_status (expiry_date, status),
    INDEX idx_batches_variant_status (product_variant_id, status)
) ENGINE=InnoDB;

-- ============================================================
-- 5. INVENTORY CORE
-- ============================================================

CREATE TABLE stock_locations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_variant_id BIGINT UNSIGNED NOT NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    batch_id BIGINT UNSIGNED NULL,
    quantity DECIMAL(18,3) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,
    version BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    batch_key BIGINT UNSIGNED GENERATED ALWAYS AS (IFNULL(batch_id, 0)) STORED,
    available_quantity DECIMAL(18,3)
        GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    CONSTRAINT uq_stock_location
        UNIQUE (product_variant_id, location_id, batch_key),
    CONSTRAINT fk_stock_locations_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    CONSTRAINT fk_stock_locations_location
        FOREIGN KEY (location_id) REFERENCES warehouse_locations(id),
    CONSTRAINT fk_stock_locations_batch
        FOREIGN KEY (batch_id) REFERENCES product_batches(id),
    CONSTRAINT chk_stock_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_stock_reserved CHECK (reserved_quantity >= 0),
    CONSTRAINT chk_stock_available CHECK (reserved_quantity <= quantity),
    INDEX idx_stock_variant (product_variant_id),
    INDEX idx_stock_location (location_id),
    INDEX idx_stock_batch (batch_id),
    INDEX idx_stock_available (available_quantity)
) ENGINE=InnoDB;

CREATE TABLE inventory_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transaction_code VARCHAR(80) NOT NULL UNIQUE,
    transaction_type ENUM(
        'RECEIPT',
        'ISSUE',
        'TRANSFER_OUT',
        'TRANSFER_IN',
        'COUNT_ADJUSTMENT_IN',
        'COUNT_ADJUSTMENT_OUT',
        'MANUAL_ADJUSTMENT_IN',
        'MANUAL_ADJUSTMENT_OUT',
        'RETURN_IN',
        'RETURN_OUT',
        'INITIAL_STOCK',
        'REVERSAL'
    ) NOT NULL,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED NOT NULL,
    batch_id BIGINT UNSIGNED NULL,
    source_location_id BIGINT UNSIGNED NULL,
    destination_location_id BIGINT UNSIGNED NULL,
    quantity DECIMAL(18,3) NOT NULL,
    quantity_before DECIMAL(18,3) NULL,
    quantity_after DECIMAL(18,3) NULL,
    reference_type VARCHAR(50) NULL,
    reference_id BIGINT UNSIGNED NULL,
    reversal_of_transaction_id BIGINT UNSIGNED NULL,
    reason_code VARCHAR(100) NULL,
    note VARCHAR(500) NULL,
    performed_by BIGINT UNSIGNED NOT NULL,
    approved_by BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_inventory_transactions_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_inventory_transactions_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    CONSTRAINT fk_inventory_transactions_batch
        FOREIGN KEY (batch_id) REFERENCES product_batches(id),
    CONSTRAINT fk_inventory_transactions_source_location
        FOREIGN KEY (source_location_id) REFERENCES warehouse_locations(id),
    CONSTRAINT fk_inventory_transactions_destination_location
        FOREIGN KEY (destination_location_id) REFERENCES warehouse_locations(id),
    CONSTRAINT fk_inventory_transactions_performed_by
        FOREIGN KEY (performed_by) REFERENCES users(id),
    CONSTRAINT fk_inventory_transactions_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id),
    CONSTRAINT fk_inventory_transactions_reversal
        FOREIGN KEY (reversal_of_transaction_id) REFERENCES inventory_transactions(id),
    CONSTRAINT chk_inventory_transaction_quantity CHECK (quantity > 0),
    INDEX idx_inventory_transactions_variant_date (product_variant_id, created_at),
    INDEX idx_inventory_transactions_warehouse_date (warehouse_id, created_at),
    INDEX idx_inventory_transactions_reference (reference_type, reference_id),
    INDEX idx_inventory_transactions_type_date (transaction_type, created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 6. GOODS RECEIPTS
-- ============================================================

CREATE TABLE goods_receipts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    receipt_code VARCHAR(80) NOT NULL UNIQUE,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    supplier_id BIGINT UNSIGNED NULL,
    status ENUM('DRAFT','PENDING','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
    reference_no VARCHAR(100) NULL,
    received_at DATETIME(3) NULL,
    note VARCHAR(500) NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    confirmed_by BIGINT UNSIGNED NULL,
    confirmed_at DATETIME(3) NULL,
    cancelled_by BIGINT UNSIGNED NULL,
    cancelled_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_goods_receipts_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_goods_receipts_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT fk_goods_receipts_created_by
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_goods_receipts_confirmed_by
        FOREIGN KEY (confirmed_by) REFERENCES users(id),
    CONSTRAINT fk_goods_receipts_cancelled_by
        FOREIGN KEY (cancelled_by) REFERENCES users(id),
    INDEX idx_goods_receipts_warehouse_status (warehouse_id, status),
    INDEX idx_goods_receipts_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE goods_receipt_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    goods_receipt_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED NOT NULL,
    batch_id BIGINT UNSIGNED NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    unit_cost DECIMAL(18,2) NULL,
    note VARCHAR(500) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_goods_receipt_items_receipt
        FOREIGN KEY (goods_receipt_id) REFERENCES goods_receipts(id),
    CONSTRAINT fk_goods_receipt_items_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    CONSTRAINT fk_goods_receipt_items_batch
        FOREIGN KEY (batch_id) REFERENCES product_batches(id),
    CONSTRAINT fk_goods_receipt_items_location
        FOREIGN KEY (location_id) REFERENCES warehouse_locations(id),
    CONSTRAINT chk_goods_receipt_items_quantity CHECK (quantity > 0),
    INDEX idx_goods_receipt_items_receipt (goods_receipt_id)
) ENGINE=InnoDB;

-- ============================================================
-- 7. GOODS ISSUES
-- ============================================================

CREATE TABLE goods_issues (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    issue_code VARCHAR(80) NOT NULL UNIQUE,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    status ENUM('DRAFT','PENDING','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
    reference_no VARCHAR(100) NULL,
    issued_at DATETIME(3) NULL,
    note VARCHAR(500) NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    confirmed_by BIGINT UNSIGNED NULL,
    confirmed_at DATETIME(3) NULL,
    cancelled_by BIGINT UNSIGNED NULL,
    cancelled_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_goods_issues_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_goods_issues_created_by
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_goods_issues_confirmed_by
        FOREIGN KEY (confirmed_by) REFERENCES users(id),
    CONSTRAINT fk_goods_issues_cancelled_by
        FOREIGN KEY (cancelled_by) REFERENCES users(id),
    INDEX idx_goods_issues_warehouse_status (warehouse_id, status),
    INDEX idx_goods_issues_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE goods_issue_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    goods_issue_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED NOT NULL,
    batch_id BIGINT UNSIGNED NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    note VARCHAR(500) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_goods_issue_items_issue
        FOREIGN KEY (goods_issue_id) REFERENCES goods_issues(id),
    CONSTRAINT fk_goods_issue_items_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    CONSTRAINT fk_goods_issue_items_batch
        FOREIGN KEY (batch_id) REFERENCES product_batches(id),
    CONSTRAINT fk_goods_issue_items_location
        FOREIGN KEY (location_id) REFERENCES warehouse_locations(id),
    CONSTRAINT chk_goods_issue_items_quantity CHECK (quantity > 0),
    INDEX idx_goods_issue_items_issue (goods_issue_id)
) ENGINE=InnoDB;

-- ============================================================
-- 8. STOCK TRANSFERS
-- ============================================================

CREATE TABLE stock_transfers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transfer_code VARCHAR(80) NOT NULL UNIQUE,
    source_warehouse_id BIGINT UNSIGNED NOT NULL,
    destination_warehouse_id BIGINT UNSIGNED NOT NULL,
    status ENUM('DRAFT','PENDING','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
    note VARCHAR(500) NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    confirmed_by BIGINT UNSIGNED NULL,
    confirmed_at DATETIME(3) NULL,
    cancelled_by BIGINT UNSIGNED NULL,
    cancelled_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_stock_transfers_source_warehouse
        FOREIGN KEY (source_warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_stock_transfers_destination_warehouse
        FOREIGN KEY (destination_warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_stock_transfers_created_by
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_stock_transfers_confirmed_by
        FOREIGN KEY (confirmed_by) REFERENCES users(id),
    CONSTRAINT fk_stock_transfers_cancelled_by
        FOREIGN KEY (cancelled_by) REFERENCES users(id),
    INDEX idx_stock_transfers_status (status),
    INDEX idx_stock_transfers_source_destination (source_warehouse_id, destination_warehouse_id)
) ENGINE=InnoDB;

CREATE TABLE stock_transfer_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    stock_transfer_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED NOT NULL,
    batch_id BIGINT UNSIGNED NULL,
    source_location_id BIGINT UNSIGNED NOT NULL,
    destination_location_id BIGINT UNSIGNED NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    note VARCHAR(500) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_stock_transfer_items_transfer
        FOREIGN KEY (stock_transfer_id) REFERENCES stock_transfers(id),
    CONSTRAINT fk_stock_transfer_items_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    CONSTRAINT fk_stock_transfer_items_batch
        FOREIGN KEY (batch_id) REFERENCES product_batches(id),
    CONSTRAINT fk_stock_transfer_items_source_location
        FOREIGN KEY (source_location_id) REFERENCES warehouse_locations(id),
    CONSTRAINT fk_stock_transfer_items_destination_location
        FOREIGN KEY (destination_location_id) REFERENCES warehouse_locations(id),
    CONSTRAINT chk_stock_transfer_items_quantity CHECK (quantity > 0),
    CONSTRAINT chk_stock_transfer_different_locations
        CHECK (source_location_id <> destination_location_id),
    INDEX idx_stock_transfer_items_transfer (stock_transfer_id)
) ENGINE=InnoDB;

-- ============================================================
-- 9. STOCK COUNTS
-- ============================================================

CREATE TABLE stock_counts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    count_code VARCHAR(80) NOT NULL UNIQUE,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    scope_type ENUM('WAREHOUSE','ZONE','SHELF','LOCATION','SKU','CATEGORY') NOT NULL,
    scope_reference_id BIGINT UNSIGNED NULL,
    status ENUM(
        'DRAFT',
        'IN_PROGRESS',
        'SUBMITTED',
        'APPROVED',
        'REJECTED',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'DRAFT',
    snapshot_at DATETIME(3) NULL,
    assigned_to BIGINT UNSIGNED NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    submitted_by BIGINT UNSIGNED NULL,
    submitted_at DATETIME(3) NULL,
    approved_by BIGINT UNSIGNED NULL,
    approved_at DATETIME(3) NULL,
    note VARCHAR(500) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_stock_counts_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_stock_counts_assigned_to
        FOREIGN KEY (assigned_to) REFERENCES users(id),
    CONSTRAINT fk_stock_counts_created_by
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_stock_counts_submitted_by
        FOREIGN KEY (submitted_by) REFERENCES users(id),
    CONSTRAINT fk_stock_counts_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_stock_counts_warehouse_status (warehouse_id, status)
) ENGINE=InnoDB;

CREATE TABLE stock_count_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    stock_count_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED NOT NULL,
    batch_id BIGINT UNSIGNED NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    system_quantity DECIMAL(18,3) NOT NULL,
    actual_quantity DECIMAL(18,3) NULL,
    difference_quantity DECIMAL(18,3)
        GENERATED ALWAYS AS (
            CASE
                WHEN actual_quantity IS NULL THEN NULL
                ELSE actual_quantity - system_quantity
            END
        ) STORED,
    reason_code VARCHAR(100) NULL,
    note VARCHAR(500) NULL,
    counted_by BIGINT UNSIGNED NULL,
    counted_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT uq_stock_count_item
        UNIQUE (stock_count_id, product_variant_id, location_id, batch_id),
    CONSTRAINT fk_stock_count_items_count
        FOREIGN KEY (stock_count_id) REFERENCES stock_counts(id),
    CONSTRAINT fk_stock_count_items_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    CONSTRAINT fk_stock_count_items_batch
        FOREIGN KEY (batch_id) REFERENCES product_batches(id),
    CONSTRAINT fk_stock_count_items_location
        FOREIGN KEY (location_id) REFERENCES warehouse_locations(id),
    CONSTRAINT fk_stock_count_items_counted_by
        FOREIGN KEY (counted_by) REFERENCES users(id),
    CONSTRAINT chk_stock_count_actual_quantity
        CHECK (actual_quantity IS NULL OR actual_quantity >= 0),
    INDEX idx_stock_count_items_count (stock_count_id),
    INDEX idx_stock_count_items_difference (difference_quantity)
) ENGINE=InnoDB;

-- ============================================================
-- 10. STOCK ADJUSTMENTS
-- ============================================================

CREATE TABLE stock_adjustments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    adjustment_code VARCHAR(80) NOT NULL UNIQUE,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    stock_count_id BIGINT UNSIGNED NULL,
    adjustment_type ENUM('COUNT','MANUAL') NOT NULL,
    status ENUM('DRAFT','PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
    reason_code VARCHAR(100) NOT NULL,
    note VARCHAR(500) NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    submitted_by BIGINT UNSIGNED NULL,
    submitted_at DATETIME(3) NULL,
    approved_by BIGINT UNSIGNED NULL,
    approved_at DATETIME(3) NULL,
    rejected_by BIGINT UNSIGNED NULL,
    rejected_at DATETIME(3) NULL,
    rejection_reason VARCHAR(500) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_stock_adjustments_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_stock_adjustments_stock_count
        FOREIGN KEY (stock_count_id) REFERENCES stock_counts(id),
    CONSTRAINT fk_stock_adjustments_created_by
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_stock_adjustments_submitted_by
        FOREIGN KEY (submitted_by) REFERENCES users(id),
    CONSTRAINT fk_stock_adjustments_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id),
    CONSTRAINT fk_stock_adjustments_rejected_by
        FOREIGN KEY (rejected_by) REFERENCES users(id),
    INDEX idx_stock_adjustments_status (status),
    INDEX idx_stock_adjustments_stock_count (stock_count_id)
) ENGINE=InnoDB;

CREATE TABLE stock_adjustment_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    stock_adjustment_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED NOT NULL,
    batch_id BIGINT UNSIGNED NULL,
    location_id BIGINT UNSIGNED NOT NULL,
    adjustment_direction ENUM('IN','OUT') NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    quantity_before DECIMAL(18,3) NULL,
    quantity_after DECIMAL(18,3) NULL,
    reason_code VARCHAR(100) NOT NULL,
    note VARCHAR(500) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_stock_adjustment_items_adjustment
        FOREIGN KEY (stock_adjustment_id) REFERENCES stock_adjustments(id),
    CONSTRAINT fk_stock_adjustment_items_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    CONSTRAINT fk_stock_adjustment_items_batch
        FOREIGN KEY (batch_id) REFERENCES product_batches(id),
    CONSTRAINT fk_stock_adjustment_items_location
        FOREIGN KEY (location_id) REFERENCES warehouse_locations(id),
    CONSTRAINT chk_stock_adjustment_items_quantity CHECK (quantity > 0),
    INDEX idx_stock_adjustment_items_adjustment (stock_adjustment_id)
) ENGINE=InnoDB;

-- ============================================================
-- 11. ALERTS & NOTIFICATIONS
-- ============================================================

CREATE TABLE alerts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    alert_type ENUM(
        'LOW_STOCK',
        'OUT_OF_STOCK',
        'OVER_MAX_STOCK',
        'NEAR_EXPIRY',
        'EXPIRED',
        'LOCATION_NEAR_FULL',
        'COUNT_VARIANCE',
        'ABNORMAL_ADJUSTMENT',
        'SECURITY'
    ) NOT NULL,
    severity ENUM('INFO','WARNING','CRITICAL') NOT NULL,
    warehouse_id BIGINT UNSIGNED NULL,
    product_variant_id BIGINT UNSIGNED NULL,
    batch_id BIGINT UNSIGNED NULL,
    location_id BIGINT UNSIGNED NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('OPEN','READ','RESOLVED') NOT NULL DEFAULT 'OPEN',
    assigned_to BIGINT UNSIGNED NULL,
    resolved_by BIGINT UNSIGNED NULL,
    resolved_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_alerts_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_alerts_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    CONSTRAINT fk_alerts_batch
        FOREIGN KEY (batch_id) REFERENCES product_batches(id),
    CONSTRAINT fk_alerts_location
        FOREIGN KEY (location_id) REFERENCES warehouse_locations(id),
    CONSTRAINT fk_alerts_assigned_to
        FOREIGN KEY (assigned_to) REFERENCES users(id),
    CONSTRAINT fk_alerts_resolved_by
        FOREIGN KEY (resolved_by) REFERENCES users(id),
    INDEX idx_alerts_status_severity (status, severity),
    INDEX idx_alerts_type_created (alert_type, created_at)
) ENGINE=InnoDB;

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id BIGINT UNSIGNED NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_notifications_user_read (user_id, is_read, created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 12. AUDIT LOG
-- ============================================================

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id CHAR(36) NULL,
    user_id BIGINT UNSIGNED NULL,
    action VARCHAR(50) NOT NULL,
    module VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NULL,
    entity_id BIGINT UNSIGNED NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_audit_logs_user_date (user_id, created_at),
    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_module_action (module, action)
) ENGINE=InnoDB;

CREATE TABLE attachments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NULL,
    file_size BIGINT UNSIGNED NULL,
    uploaded_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_attachments_uploaded_by
        FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_attachments_entity (entity_type, entity_id)
) ENGINE=InnoDB;

-- ============================================================
-- 13. APP SETTINGS
-- ============================================================

CREATE TABLE app_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(150) NOT NULL UNIQUE,
    setting_value JSON NOT NULL,
    description VARCHAR(255) NULL,
    updated_by BIGINT UNSIGNED NULL,
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_app_settings_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- 14. REPORTING VIEWS
-- ============================================================

CREATE OR REPLACE VIEW vw_current_stock AS
SELECT
    sl.id AS stock_location_id,
    w.id AS warehouse_id,
    w.code AS warehouse_code,
    w.name AS warehouse_name,
    wz.code AS zone_code,
    ws.code AS shelf_code,
    wl.id AS location_id,
    wl.code AS location_code,
    p.id AS product_id,
    p.name AS product_name,
    pv.id AS product_variant_id,
    pv.sku,
    pv.barcode,
    pv.variant_name,
    pb.id AS batch_id,
    pb.lot_number,
    pb.expiry_date,
    sl.quantity,
    sl.reserved_quantity,
    sl.available_quantity,
    sl.updated_at
FROM stock_locations sl
JOIN product_variants pv ON pv.id = sl.product_variant_id
JOIN products p ON p.id = pv.product_id
JOIN warehouse_locations wl ON wl.id = sl.location_id
JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
JOIN warehouse_zones wz ON wz.id = ws.zone_id
JOIN warehouses w ON w.id = wz.warehouse_id
LEFT JOIN product_batches pb ON pb.id = sl.batch_id;

CREATE OR REPLACE VIEW vw_product_total_stock AS
SELECT
    w.id AS warehouse_id,
    w.code AS warehouse_code,
    pv.id AS product_variant_id,
    pv.sku,
    p.name AS product_name,
    pv.variant_name,
    SUM(sl.quantity) AS total_quantity,
    SUM(sl.reserved_quantity) AS total_reserved_quantity,
    SUM(sl.available_quantity) AS total_available_quantity,
    pv.min_stock_level,
    pv.max_stock_level
FROM stock_locations sl
JOIN product_variants pv ON pv.id = sl.product_variant_id
JOIN products p ON p.id = pv.product_id
JOIN warehouse_locations wl ON wl.id = sl.location_id
JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
JOIN warehouse_zones wz ON wz.id = ws.zone_id
JOIN warehouses w ON w.id = wz.warehouse_id
GROUP BY
    w.id,
    w.code,
    pv.id,
    pv.sku,
    p.name,
    pv.variant_name,
    pv.min_stock_level,
    pv.max_stock_level;

CREATE OR REPLACE VIEW vw_near_expiry_stock AS
SELECT
    w.id AS warehouse_id,
    w.code AS warehouse_code,
    pv.id AS product_variant_id,
    pv.sku,
    p.name AS product_name,
    pb.id AS batch_id,
    pb.lot_number,
    pb.expiry_date,
    DATEDIFF(pb.expiry_date, CURRENT_DATE) AS days_until_expiry,
    wl.code AS location_code,
    sl.quantity,
    sl.available_quantity
FROM stock_locations sl
JOIN product_variants pv ON pv.id = sl.product_variant_id
JOIN products p ON p.id = pv.product_id
JOIN product_batches pb ON pb.id = sl.batch_id
JOIN warehouse_locations wl ON wl.id = sl.location_id
JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
JOIN warehouse_zones wz ON wz.id = ws.zone_id
JOIN warehouses w ON w.id = wz.warehouse_id
WHERE
    sl.quantity > 0
    AND pb.expiry_date IS NOT NULL
    AND pb.expiry_date >= CURRENT_DATE
    AND pb.expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY);

-- ============================================================
-- 15. SEED ROLES
-- ============================================================

INSERT INTO roles (code, name, description, is_system)
VALUES
    ('ADMIN', 'Administrator', 'Toàn quyền hệ thống', TRUE),
    ('WAREHOUSE_MANAGER', 'Warehouse Manager', 'Quản lý nghiệp vụ kho', TRUE),
    ('STAFF', 'Warehouse Staff', 'Nhân viên vận hành kho', TRUE),
    ('AUDITOR', 'Auditor', 'Chỉ đọc và kiểm toán', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO permissions (code, name, module, description)
VALUES
    ('goods_receipts:confirm', 'Confirm goods receipts', 'goods_receipts', 'Confirm receipt and increase stock'),
    ('goods_receipts:reverse', 'Reverse goods receipts', 'goods_receipts', 'Reverse confirmed receipt with reversal transactions'),
    ('goods_issues:confirm', 'Confirm goods issues', 'goods_issues', 'Confirm issue and decrease stock'),
    ('goods_issues:reverse', 'Reverse goods issues', 'goods_issues', 'Reverse confirmed issue with reversal transactions'),
    ('stock_transfers:confirm', 'Confirm stock transfers', 'stock_transfers', 'Confirm transfer between locations'),
    ('stock_transfers:reverse', 'Reverse stock transfers', 'stock_transfers', 'Reverse confirmed transfer with reversal transactions'),
    ('stock_adjustments:approve', 'Approve stock adjustments', 'stock_adjustments', 'Approve adjustment and update stock'),
    ('stock_adjustments:reject', 'Reject stock adjustments', 'stock_adjustments', 'Reject pending adjustment before stock update'),
    ('stock_adjustments:cancel', 'Cancel stock adjustments', 'stock_adjustments', 'Cancel draft or pending adjustment'),
    ('stock_counts:create', 'Create stock counts', 'stock_counts', 'Create stock count snapshot'),
    ('stock_counts:start', 'Start stock counts', 'stock_counts', 'Start stock counting'),
    ('stock_counts:count', 'Record stock counts', 'stock_counts', 'Record actual counted quantity'),
    ('stock_counts:submit', 'Submit stock counts', 'stock_counts', 'Submit counted result'),
    ('stock_counts:approve', 'Approve stock counts', 'stock_counts', 'Approve stock count and create adjustment'),
    ('users:read', 'Read users', 'auth', 'View users'),
    ('users:create', 'Create users', 'auth', 'Create users from admin UI'),
    ('users:update', 'Update users', 'auth', 'Update users'),
    ('users:delete', 'Delete users', 'auth', 'Soft delete users'),
    ('authorization:read', 'Read authorization', 'authorization', 'View roles and permissions'),
    ('authorization:update', 'Update authorization', 'authorization', 'Update role permission mapping'),
    ('warehouses:create', 'Create warehouses', 'warehouses', 'Create warehouse master data'),
    ('warehouses:update', 'Update warehouses', 'warehouses', 'Update warehouse master data'),
    ('warehouses:delete', 'Delete warehouses', 'warehouses', 'Soft delete warehouse master data'),
    ('settings:update', 'Update settings', 'settings', 'Update application settings'),
    ('alerts:generate', 'Generate alerts', 'alerts', 'Generate inventory alerts from stock views'),
    ('alerts:read', 'Read alerts', 'alerts', 'Mark alert as read'),
    ('alerts:resolve', 'Resolve alerts', 'alerts', 'Resolve inventory alerts'),
    ('notifications:generate', 'Generate notifications', 'notifications', 'Generate notifications from open alerts'),
    ('notifications:read', 'Read notifications', 'notifications', 'Mark notification as read')
ON DUPLICATE KEY UPDATE name = VALUES(name), module = VALUES(module), description = VALUES(description);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'goods_receipts:confirm',
    'goods_receipts:reverse',
    'goods_issues:confirm',
    'goods_issues:reverse',
    'stock_transfers:confirm',
    'stock_transfers:reverse',
    'stock_adjustments:approve',
    'stock_adjustments:reject',
    'stock_adjustments:cancel',
    'stock_counts:create',
    'stock_counts:start',
    'stock_counts:count',
    'stock_counts:submit',
    'stock_counts:approve',
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'authorization:read',
    'authorization:update',
    'warehouses:create',
    'warehouses:update',
    'warehouses:delete',
    'settings:update',
    'alerts:generate',
    'alerts:read',
    'alerts:resolve',
    'notifications:generate',
    'notifications:read'
)
WHERE r.code IN ('ADMIN', 'WAREHOUSE_MANAGER')
ON DUPLICATE KEY UPDATE permission_id = VALUES(permission_id);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'stock_counts:count',
    'stock_counts:submit'
)
WHERE r.code = 'STAFF'
ON DUPLICATE KEY UPDATE permission_id = VALUES(permission_id);

-- Vai trò AUDITOR trước đây được khai báo nhưng không được gán quyền nào,
-- nên tài khoản kiểm toán đăng nhập vào là không dùng được gì. Cấp bộ quyền chỉ đọc.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'users:read',
    'authorization:read',
    'alerts:read',
    'notifications:read'
)
WHERE r.code = 'AUDITOR'
ON DUPLICATE KEY UPDATE permission_id = VALUES(permission_id);
INSERT INTO units (code, name, precision_scale)
VALUES
    ('PCS', 'Cái', 0),
    ('BOX', 'Hộp', 0),
    ('PACK', 'Gói', 0),
    ('BOTTLE', 'Chai', 0),
    ('KG', 'Kilogram', 3),
    ('L', 'Lít', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name);


-- ============================================================
-- 16. SAMPLE DATA
-- Importing this file now creates schema, core seed data, and demo data.
-- Demo accounts: admin@bambi.test / manager@bambi.test / staff@bambi.test
-- Password for all demo accounts: 123456
-- ============================================================

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
    -- Phiếu nháp PN-202607-003 phải có dòng hàng, nếu không thì bấm "Xác nhận" luôn báo
    -- GOODS_RECEIPT_HAS_NO_ITEMS và không có API nào thêm dòng vào phiếu đã tạo.
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
    -- Phiếu nháp CK-202607-002 cũng phải có dòng hàng, cùng lý do với PN-202607-003.
    UNION ALL SELECT 'CK-202607-002', 'SUA-FRISO-4', 'LOT-FRISO4-202605', 'HCM01-A-A02-01', 'HCM02-A-A01-01', 20.000, 'Dự kiến bổ sung sữa Friso'
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

-- ============================================================
-- END OF SCHEMA AND SAMPLE DATA
-- ============================================================

