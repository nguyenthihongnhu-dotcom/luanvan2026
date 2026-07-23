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
    token_hash VARCHAR(255) NOT NULL UNIQUE,
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
    qr_code_value VARCHAR(255) NULL UNIQUE,
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
INSERT INTO units (code, name, precision_scale)
VALUES
    ('PCS', 'Cái', 0),
    ('BOX', 'Hộp', 0),
    ('PACK', 'Gói', 0),
    ('BOTTLE', 'Chai', 0),
    ('KG', 'Kilogram', 3),
    ('L', 'Lít', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- END OF SCHEMA
-- ============================================================

