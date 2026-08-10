-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Aug 10, 2026 at 04:53 PM
-- Server version: 9.1.0
-- PHP Version: 8.2.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `warehouse_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `alerts`
--

DROP TABLE IF EXISTS `alerts`;
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `alert_type` enum('LOW_STOCK','OUT_OF_STOCK','OVER_MAX_STOCK','NEAR_EXPIRY','EXPIRED','LOCATION_NEAR_FULL','COUNT_VARIANCE','ABNORMAL_ADJUSTMENT','SECURITY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` enum('INFO','WARNING','CRITICAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_id` bigint UNSIGNED DEFAULT NULL,
  `product_variant_id` bigint UNSIGNED DEFAULT NULL,
  `batch_id` bigint UNSIGNED DEFAULT NULL,
  `location_id` bigint UNSIGNED DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('OPEN','READ','RESOLVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `assigned_to` bigint UNSIGNED DEFAULT NULL,
  `resolved_by` bigint UNSIGNED DEFAULT NULL,
  `resolved_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `fk_alerts_warehouse` (`warehouse_id`),
  KEY `fk_alerts_variant` (`product_variant_id`),
  KEY `fk_alerts_batch` (`batch_id`),
  KEY `fk_alerts_location` (`location_id`),
  KEY `fk_alerts_assigned_to` (`assigned_to`),
  KEY `fk_alerts_resolved_by` (`resolved_by`),
  KEY `idx_alerts_status_severity` (`status`,`severity`),
  KEY `idx_alerts_type_created` (`alert_type`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `alerts`
--

INSERT INTO `alerts` (`id`, `alert_type`, `severity`, `warehouse_id`, `product_variant_id`, `batch_id`, `location_id`, `title`, `message`, `status`, `assigned_to`, `resolved_by`, `resolved_at`, `created_at`) VALUES
(4, 'LOW_STOCK', 'WARNING', 1, 3, NULL, NULL, 'Low stock: SUA-FRISO-3', 'Sữa Frisolac Gold / Số 3 - hộp 850g available 8.000, minimum 20.000', 'RESOLVED', NULL, 1, '2026-07-24 15:13:10.802', '2026-07-24 15:13:08.891'),
(5, 'OUT_OF_STOCK', 'CRITICAL', 1, 5, NULL, NULL, 'Out of stock: TI-GIAM-CHICCO', 'Ti giả Chicco silicone / Silicone 0-6 tháng available 0.000, minimum 5.000', 'RESOLVED', NULL, 1, '2026-07-24 15:13:12.843', '2026-07-24 15:13:08.891'),
(7, 'NEAR_EXPIRY', 'WARNING', 1, 6, 6, NULL, 'Near expiry: BOT-HEINZ-GC lot LOT-HEINZ-202601', 'Bột ăn dặm Heinz lot LOT-HEINZ-202601 expires in 53 days at HCM01-A-A01-02', 'RESOLVED', NULL, 1, '2026-07-24 15:13:11.567', '2026-07-24 15:13:08.900'),
(11, 'LOW_STOCK', 'WARNING', 1, 3, 3, 1, 'Sữa Friso số 3 sắp hết hàng', 'Tồn kho hiện tại thấp hơn mức tối thiểu, cần lập kế hoạch nhập bổ sung.', 'OPEN', 2, NULL, NULL, '2026-08-05 14:31:02.867'),
(12, 'OUT_OF_STOCK', 'CRITICAL', 1, 5, 5, 5, 'Ti giả Chicco đã hết hàng', 'SKU TI-GIAM-CHICCO không còn tồn khả dụng.', 'OPEN', 2, NULL, NULL, '2026-08-05 14:31:02.867'),
(13, 'NEAR_EXPIRY', 'WARNING', 1, 6, 6, 2, 'Bột ăn dặm Heinz gần hạn', 'Lô LOT-HEINZ-202601 cần ưu tiên xuất trước.', 'OPEN', 3, NULL, NULL, '2026-08-05 14:31:02.867');

-- --------------------------------------------------------

--
-- Table structure for table `app_settings`
--

DROP TABLE IF EXISTS `app_settings`;
CREATE TABLE IF NOT EXISTS `app_settings` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` json NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` bigint UNSIGNED DEFAULT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `fk_app_settings_updated_by` (`updated_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attachments`
--

DROP TABLE IF EXISTS `attachments`;
CREATE TABLE IF NOT EXISTS `attachments` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` bigint UNSIGNED NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` bigint UNSIGNED DEFAULT NULL,
  `uploaded_by` bigint UNSIGNED NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `fk_attachments_uploaded_by` (`uploaded_by`),
  KEY `idx_attachments_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `request_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` bigint UNSIGNED DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_user_date` (`user_id`,`created_at`),
  KEY `idx_audit_logs_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_logs_module_action` (`module`,`action`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `request_id`, `user_id`, `action`, `module`, `entity_type`, `entity_id`, `old_values`, `new_values`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, NULL, 1, 'CREATE', 'stock_counts', 'STOCK_COUNT', 4, NULL, '{\"status\": \"DRAFT\", \"itemCount\": 9, \"scopeType\": \"ZONE\"}', NULL, NULL, '2026-08-05 00:11:17.519'),
(2, NULL, 3, 'CREATE', 'stock_transfers', 'STOCK_TRANSFER', 8, NULL, '{\"itemCount\": 1, \"transferCode\": \"TRF-1785932024447-55F8EA3688964C1C\"}', NULL, NULL, '2026-08-05 19:13:44.468'),
(3, NULL, 1, 'CONFIRM', 'goods_receipts', 'GOODS_RECEIPT', 3, '{\"status\": \"PENDING\"}', '{\"status\": \"CONFIRMED\", \"transactionCount\": 1}', NULL, NULL, '2026-08-05 19:43:59.484'),
(4, NULL, 1, 'APPROVE', 'stock_adjustments', 'STOCK_ADJUSTMENT', 2, '{\"status\": \"PENDING\"}', '{\"status\": \"APPROVED\", \"transactionCount\": 1}', NULL, NULL, '2026-08-05 19:44:04.296'),
(5, NULL, 1, 'CREATE', 'stock_counts', 'STOCK_COUNT', 9, NULL, '{\"status\": \"DRAFT\", \"itemCount\": 1, \"scopeType\": \"WAREHOUSE\"}', NULL, NULL, '2026-08-06 21:37:35.337'),
(6, NULL, 1, 'START', 'stock_counts', 'STOCK_COUNT', 9, '{\"status\": \"DRAFT\"}', '{\"status\": \"IN_PROGRESS\"}', NULL, NULL, '2026-08-06 21:37:42.225'),
(7, NULL, 1, 'CREATE', 'stock_counts', 'STOCK_COUNT', 10, NULL, '{\"status\": \"DRAFT\", \"itemCount\": 1, \"scopeType\": \"CATEGORY\"}', NULL, NULL, '2026-08-06 23:09:43.965'),
(8, NULL, 1, 'START', 'stock_counts', 'STOCK_COUNT', 10, '{\"status\": \"DRAFT\"}', '{\"status\": \"IN_PROGRESS\"}', NULL, NULL, '2026-08-06 23:09:48.128'),
(9, NULL, 1, 'SUBMIT', 'stock_counts', 'STOCK_COUNT', 10, '{\"status\": \"IN_PROGRESS\"}', '{\"status\": \"SUBMITTED\"}', NULL, NULL, '2026-08-06 23:11:15.966'),
(10, NULL, 1, 'APPROVE', 'stock_counts', 'STOCK_COUNT', 10, '{\"status\": \"SUBMITTED\"}', '{\"status\": \"APPROVED\", \"adjustmentId\": 8, \"adjustmentItemCount\": 1}', NULL, NULL, '2026-08-06 23:19:09.543'),
(11, NULL, 1, 'SUBMIT', 'stock_counts', 'STOCK_COUNT', 9, '{\"status\": \"IN_PROGRESS\"}', '{\"status\": \"SUBMITTED\"}', NULL, NULL, '2026-08-06 23:19:25.910'),
(12, NULL, 1, 'APPROVE', 'stock_counts', 'STOCK_COUNT', 9, '{\"status\": \"SUBMITTED\"}', '{\"status\": \"APPROVED\", \"adjustmentId\": 9, \"adjustmentItemCount\": 1}', NULL, NULL, '2026-08-06 23:19:33.453'),
(13, NULL, 1, 'START', 'stock_counts', 'STOCK_COUNT', 4, '{\"status\": \"DRAFT\"}', '{\"status\": \"IN_PROGRESS\"}', NULL, NULL, '2026-08-07 01:16:29.310'),
(14, NULL, 1, 'SUBMIT', 'stock_counts', 'STOCK_COUNT', 4, '{\"status\": \"IN_PROGRESS\"}', '{\"status\": \"SUBMITTED\"}', NULL, NULL, '2026-08-07 01:26:47.189'),
(15, NULL, 1, 'APPROVE', 'stock_counts', 'STOCK_COUNT', 4, '{\"status\": \"SUBMITTED\"}', '{\"status\": \"APPROVED\", \"adjustmentId\": 10, \"adjustmentItemCount\": 1}', NULL, NULL, '2026-08-07 01:27:03.975'),
(16, NULL, 1, 'APPROVE', 'stock_adjustments', 'STOCK_ADJUSTMENT', 10, '{\"status\": \"PENDING\"}', '{\"status\": \"APPROVED\", \"transactionCount\": 1}', NULL, NULL, '2026-08-08 15:37:55.253');

-- --------------------------------------------------------

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
CREATE TABLE IF NOT EXISTS `brands` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `brands`
--

INSERT INTO `brands` (`id`, `code`, `name`, `status`, `created_at`, `updated_at`) VALUES
(1, 'HUGGIES', 'Huggies', 'ACTIVE', '2026-07-20 17:18:01.931', '2026-07-20 17:18:01.931'),
(2, 'FRISO', 'Friso', 'ACTIVE', '2026-07-20 17:18:01.931', '2026-07-20 17:18:01.931'),
(3, 'CHICCO', 'Chicco', 'ACTIVE', '2026-07-20 17:18:01.931', '2026-07-20 17:18:01.931'),
(4, 'HEINZ', 'Heinz', 'ACTIVE', '2026-07-20 17:18:01.931', '2026-07-20 17:18:01.931'),
(5, 'PIGEON', 'Pigeon', 'ACTIVE', '2026-07-20 17:18:01.931', '2026-07-20 17:18:01.931'),
(6, 'MOONY', 'Moony', 'ACTIVE', '2026-07-20 17:18:01.931', '2026-07-20 17:18:01.931');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
CREATE TABLE IF NOT EXISTS `categories` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_id` bigint UNSIGNED DEFAULT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int UNSIGNED NOT NULL DEFAULT '0',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_categories_parent_status` (`parent_id`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `parent_id`, `code`, `name`, `description`, `sort_order`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, NULL, 'ME-VA-BE', 'Mẹ và Bé', 'Nhóm hàng mẹ và bé', 1, 'ACTIVE', '2026-07-20 17:18:01.928', '2026-07-20 17:18:01.928', NULL),
(2, 1, 'SUA-CONG-THUC', 'Sữa công thức', 'Sữa bột và sữa dinh dưỡng cho bé', 10, 'ACTIVE', '2026-07-20 17:18:01.930', '2026-07-20 17:18:01.930', NULL),
(3, 1, 'BIM-TA', 'Bỉm tã', 'Tã quần, tã dán và khăn ướt', 20, 'ACTIVE', '2026-07-20 17:18:01.930', '2026-07-20 17:18:01.930', NULL),
(4, 1, 'DO-SO-SINH', 'Đồ sơ sinh', 'Đồ dùng chăm sóc trẻ sơ sinh', 30, 'ACTIVE', '2026-07-20 17:18:01.930', '2026-07-20 17:18:01.930', NULL),
(5, 1, 'AN-DAM', 'Ăn dặm', 'Bột ăn dặm, bánh ăn dặm và cháo dinh dưỡng', 40, 'ACTIVE', '2026-07-20 17:18:01.930', '2026-07-20 17:18:01.930', NULL),
(8, NULL, 'DM-DU-LIEU-TEST', 'Du lieu test', NULL, 0, 'ACTIVE', '2026-07-25 23:08:47.533', '2026-07-25 23:08:47.533', NULL),
(9, NULL, 'DM-DU-LIEU-TEST-QR', 'Du lieu test QR', NULL, 0, 'ACTIVE', '2026-07-25 23:29:19.186', '2026-07-25 23:29:19.186', NULL),
(17, NULL, 'DM-SUA', 'Sua', NULL, 0, 'ACTIVE', '2026-08-09 11:27:18.040', '2026-08-09 11:27:18.040', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `goods_issues`
--

DROP TABLE IF EXISTS `goods_issues`;
CREATE TABLE IF NOT EXISTS `goods_issues` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `issue_code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_id` bigint UNSIGNED NOT NULL,
  `status` enum('DRAFT','PENDING','CONFIRMED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `reference_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issued_at` datetime(3) DEFAULT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint UNSIGNED NOT NULL,
  `confirmed_by` bigint UNSIGNED DEFAULT NULL,
  `confirmed_at` datetime(3) DEFAULT NULL,
  `cancelled_by` bigint UNSIGNED DEFAULT NULL,
  `cancelled_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `issue_code` (`issue_code`),
  KEY `fk_goods_issues_created_by` (`created_by`),
  KEY `fk_goods_issues_confirmed_by` (`confirmed_by`),
  KEY `fk_goods_issues_cancelled_by` (`cancelled_by`),
  KEY `idx_goods_issues_warehouse_status` (`warehouse_id`,`status`),
  KEY `idx_goods_issues_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `goods_issues`
--

INSERT INTO `goods_issues` (`id`, `issue_code`, `warehouse_id`, `status`, `reference_no`, `issued_at`, `note`, `created_by`, `confirmed_by`, `confirmed_at`, `cancelled_by`, `cancelled_at`, `created_at`, `updated_at`) VALUES
(1, 'PX-202607-001', 1, 'CONFIRMED', 'SO-0706-001', '2026-07-06 15:00:00.000', 'Xuất bán cho cửa hàng mẹ và bé', 3, 2, '2026-07-06 15:20:00.000', NULL, NULL, '2026-07-20 17:18:01.964', '2026-07-20 17:18:01.964'),
(2, 'PX-202607-002', 1, 'PENDING', 'SO-0710-002', NULL, 'Chờ duyệt xuất hàng', 3, NULL, NULL, NULL, NULL, '2026-07-20 17:18:01.964', '2026-07-20 17:18:01.964');

-- --------------------------------------------------------

--
-- Table structure for table `goods_issue_items`
--

DROP TABLE IF EXISTS `goods_issue_items`;
CREATE TABLE IF NOT EXISTS `goods_issue_items` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `goods_issue_id` bigint UNSIGNED NOT NULL,
  `product_variant_id` bigint UNSIGNED NOT NULL,
  `batch_id` bigint UNSIGNED DEFAULT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `quantity` decimal(18,3) NOT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `fk_goods_issue_items_variant` (`product_variant_id`),
  KEY `fk_goods_issue_items_batch` (`batch_id`),
  KEY `fk_goods_issue_items_location` (`location_id`),
  KEY `idx_goods_issue_items_issue` (`goods_issue_id`)
) ;

--
-- Dumping data for table `goods_issue_items`
--

INSERT INTO `goods_issue_items` (`id`, `goods_issue_id`, `product_variant_id`, `batch_id`, `location_id`, `quantity`, `note`, `created_at`) VALUES
(1, 1, 3, 3, 1, 12.000, 'Xuất bán', '2026-07-20 17:18:01.966'),
(2, 1, 1, 1, 4, 20.000, 'Xuất bán', '2026-07-20 17:18:01.966'),
(3, 2, 6, 6, 2, 6.000, 'Chờ duyệt', '2026-07-20 17:18:01.966');

-- --------------------------------------------------------

--
-- Table structure for table `goods_receipts`
--

DROP TABLE IF EXISTS `goods_receipts`;
CREATE TABLE IF NOT EXISTS `goods_receipts` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `receipt_code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_id` bigint UNSIGNED NOT NULL,
  `supplier_id` bigint UNSIGNED DEFAULT NULL,
  `status` enum('DRAFT','PENDING','CONFIRMED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `reference_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `received_at` datetime(3) DEFAULT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint UNSIGNED NOT NULL,
  `confirmed_by` bigint UNSIGNED DEFAULT NULL,
  `confirmed_at` datetime(3) DEFAULT NULL,
  `cancelled_by` bigint UNSIGNED DEFAULT NULL,
  `cancelled_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_code` (`receipt_code`),
  KEY `fk_goods_receipts_supplier` (`supplier_id`),
  KEY `fk_goods_receipts_created_by` (`created_by`),
  KEY `fk_goods_receipts_confirmed_by` (`confirmed_by`),
  KEY `fk_goods_receipts_cancelled_by` (`cancelled_by`),
  KEY `idx_goods_receipts_warehouse_status` (`warehouse_id`,`status`),
  KEY `idx_goods_receipts_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `goods_receipts`
--

INSERT INTO `goods_receipts` (`id`, `receipt_code`, `warehouse_id`, `supplier_id`, `status`, `reference_no`, `received_at`, `note`, `created_by`, `confirmed_by`, `confirmed_at`, `cancelled_by`, `cancelled_at`, `created_at`, `updated_at`) VALUES
(1, 'PN-202607-001', 1, 1, 'CONFIRMED', 'HD-FRISO-0701', '2026-07-02 09:30:00.000', 'Nhập sữa Friso đầu tháng 7', 3, 2, '2026-07-02 10:00:00.000', NULL, NULL, '2026-07-20 17:18:01.954', '2026-07-20 17:18:01.954'),
(2, 'PN-202607-002', 1, 2, 'CONFIRMED', 'HD-HUG-0701', '2026-07-01 14:00:00.000', 'Nhập tã Huggies', 3, 2, '2026-07-01 14:30:00.000', NULL, NULL, '2026-07-20 17:18:01.954', '2026-07-20 17:18:01.954'),
(3, 'PN-202607-003', 2, 3, 'CONFIRMED', 'HD-BABY-0705', '2026-08-05 19:43:59.486', 'Phiếu nháp chờ xác nhận', 3, 1, '2026-08-05 19:43:59.486', NULL, NULL, '2026-07-20 17:18:01.954', '2026-08-05 19:43:59.486');

-- --------------------------------------------------------

--
-- Table structure for table `goods_receipt_items`
--

DROP TABLE IF EXISTS `goods_receipt_items`;
CREATE TABLE IF NOT EXISTS `goods_receipt_items` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `goods_receipt_id` bigint UNSIGNED NOT NULL,
  `product_variant_id` bigint UNSIGNED NOT NULL,
  `batch_id` bigint UNSIGNED DEFAULT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `quantity` decimal(18,3) NOT NULL,
  `unit_cost` decimal(18,2) DEFAULT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `fk_goods_receipt_items_variant` (`product_variant_id`),
  KEY `fk_goods_receipt_items_batch` (`batch_id`),
  KEY `fk_goods_receipt_items_location` (`location_id`),
  KEY `idx_goods_receipt_items_receipt` (`goods_receipt_id`)
) ;

--
-- Dumping data for table `goods_receipt_items`
--

INSERT INTO `goods_receipt_items` (`id`, `goods_receipt_id`, `product_variant_id`, `batch_id`, `location_id`, `quantity`, `unit_cost`, `note`, `created_at`) VALUES
(1, 1, 3, 3, 1, 80.000, 498000.00, 'Nhập mới', '2026-07-20 17:18:01.960'),
(2, 1, 4, 4, 3, 64.000, 510000.00, 'Nhập mới', '2026-07-20 17:18:01.960'),
(3, 2, 1, 1, 4, 150.000, 205000.00, 'Nhập mới', '2026-07-20 17:18:01.960'),
(4, 2, 2, 2, 4, 95.000, 219000.00, 'Nhập mới', '2026-07-20 17:18:01.960'),
(5, 3, 8, 8, 6, 42.000, 350000.00, 'Nhập bổ sung chi nhánh', '2026-08-05 09:45:44.359');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `transaction_code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_type` enum('RECEIPT','ISSUE','TRANSFER_OUT','TRANSFER_IN','COUNT_ADJUSTMENT_IN','COUNT_ADJUSTMENT_OUT','MANUAL_ADJUSTMENT_IN','MANUAL_ADJUSTMENT_OUT','RETURN_IN','RETURN_OUT','INITIAL_STOCK','REVERSAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_id` bigint UNSIGNED NOT NULL,
  `product_variant_id` bigint UNSIGNED NOT NULL,
  `batch_id` bigint UNSIGNED DEFAULT NULL,
  `source_location_id` bigint UNSIGNED DEFAULT NULL,
  `destination_location_id` bigint UNSIGNED DEFAULT NULL,
  `quantity` decimal(18,3) NOT NULL,
  `quantity_before` decimal(18,3) DEFAULT NULL,
  `quantity_after` decimal(18,3) DEFAULT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint UNSIGNED DEFAULT NULL,
  `reversal_of_transaction_id` bigint UNSIGNED DEFAULT NULL,
  `reason_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `performed_by` bigint UNSIGNED NOT NULL,
  `approved_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_code` (`transaction_code`),
  KEY `fk_inventory_transactions_batch` (`batch_id`),
  KEY `fk_inventory_transactions_source_location` (`source_location_id`),
  KEY `fk_inventory_transactions_destination_location` (`destination_location_id`),
  KEY `fk_inventory_transactions_performed_by` (`performed_by`),
  KEY `fk_inventory_transactions_approved_by` (`approved_by`),
  KEY `fk_inventory_transactions_reversal` (`reversal_of_transaction_id`),
  KEY `idx_inventory_transactions_variant_date` (`product_variant_id`,`created_at`),
  KEY `idx_inventory_transactions_warehouse_date` (`warehouse_id`,`created_at`),
  KEY `idx_inventory_transactions_reference` (`reference_type`,`reference_id`),
  KEY `idx_inventory_transactions_type_date` (`transaction_type`,`created_at`)
) ;

--
-- Dumping data for table `inventory_transactions`
--

INSERT INTO `inventory_transactions` (`id`, `transaction_code`, `transaction_type`, `warehouse_id`, `product_variant_id`, `batch_id`, `source_location_id`, `destination_location_id`, `quantity`, `quantity_before`, `quantity_after`, `reference_type`, `reference_id`, `reversal_of_transaction_id`, `reason_code`, `note`, `performed_by`, `approved_by`, `created_at`) VALUES
(1, 'GD-202607-001', 'RECEIPT', 1, 3, 3, NULL, 1, 80.000, 0.000, 80.000, 'GOODS_RECEIPT', 1, NULL, 'NHAP_HANG', 'Nhập sữa Friso số 3', 3, 2, '2026-07-02 10:00:00.000'),
(2, 'GD-202607-002', 'RECEIPT', 1, 1, 1, NULL, 4, 150.000, 0.000, 150.000, 'GOODS_RECEIPT', 2, NULL, 'NHAP_HANG', 'Nhập tã Huggies size M', 3, 2, '2026-07-01 14:30:00.000'),
(3, 'GD-202607-003', 'ISSUE', 1, 3, 3, 1, NULL, 12.000, 80.000, 68.000, 'GOODS_ISSUE', 1, NULL, 'XUAT_BAN', 'Xuất bán sữa Friso số 3', 3, 2, '2026-07-06 15:20:00.000'),
(4, 'GD-202607-004', 'ISSUE', 1, 1, 1, 4, NULL, 20.000, 150.000, 130.000, 'GOODS_ISSUE', 1, NULL, 'XUAT_BAN', 'Xuất bán tã Huggies size M', 3, 2, '2026-07-06 15:20:00.000'),
(5, 'GD-202607-005', 'TRANSFER_OUT', 1, 1, 1, 4, 6, 30.000, 130.000, 100.000, 'STOCK_TRANSFER', 1, NULL, 'CHUYEN_KHO', 'Chuyển tã Huggies sang chi nhánh Quận 7', 3, 2, '2026-07-08 11:00:00.000'),
(6, 'GD-202607-006', 'TRANSFER_IN', 2, 1, 1, 4, 6, 30.000, 0.000, 30.000, 'STOCK_TRANSFER', 1, NULL, 'CHUYEN_KHO', 'Nhận tã Huggies tại chi nhánh Quận 7', 3, 2, '2026-07-08 11:00:00.000'),
(7, 'GD-202607-007', 'COUNT_ADJUSTMENT_OUT', 1, 3, 3, 1, NULL, 1.000, 8.000, 7.000, 'STOCK_ADJUSTMENT', 1, NULL, 'KIEM_KE_LECH_THIEU', 'Điều chỉnh giảm theo kiểm kê', 3, 2, '2026-07-12 16:05:00.000'),
(9, 'QRN-1784996738193-T77SGR', 'RECEIPT', 1, 4, NULL, NULL, 3, 1.000, 64.000, 65.000, 'QUICK_RECEIVE', NULL, NULL, 'QR_RECEIVE', 'Test quick receive from Codex', 1, NULL, '2026-07-25 23:25:38.194'),
(10, 'QRN-1784996758179-8M41WY', 'RECEIPT', 1, 4, NULL, NULL, 3, 2.000, 65.000, 67.000, 'QUICK_RECEIVE', NULL, NULL, 'QR_RECEIVE', NULL, 1, NULL, '2026-07-25 23:25:58.180'),
(11, 'QRN-1784996960791-WXZF59', 'RECEIPT', 1, 14, NULL, NULL, 3, 3.000, 0.000, 3.000, 'QUICK_RECEIVE', NULL, NULL, 'QR_RECEIVE', NULL, 1, NULL, '2026-07-25 23:29:20.792'),
(26, 'RECEIPT-PN-202607-003-A010503254D24180', 'RECEIPT', 2, 8, 8, NULL, 6, 42.000, 42.000, 84.000, 'GOODS_RECEIPT', 3, NULL, NULL, 'Confirmed goods receipt PN-202607-003', 1, 1, '2026-08-05 19:43:59.479'),
(27, 'ADJUST-DC-202607-002-5F5007A3454E41A1', 'MANUAL_ADJUSTMENT_OUT', 1, 6, 6, 2, NULL, 2.000, 24.000, 22.000, 'STOCK_ADJUSTMENT', 2, NULL, 'HANG_HONG', 'Hộp móp méo cần loại khỏi tồn bán', 1, 1, '2026-08-05 19:44:04.292'),
(28, 'ADJUST-ADJ-COUNT-COUNT-1-F985317C285347FA-BB34CC189F1447A6-E5228DB7942E4AF8', 'COUNT_ADJUSTMENT_OUT', 1, 4, 4, 3, NULL, 4.000, 64.000, 60.000, 'STOCK_ADJUSTMENT', 10, NULL, 'Lon sữa rơi', NULL, 1, 1, '2026-08-08 15:37:55.248');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint UNSIGNED DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_read` (`user_id`,`is_read`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `reference_type`, `reference_id`, `is_read`, `read_at`, `created_at`) VALUES
(7, 2, 'LOW_STOCK', 'Cảnh báo tồn kho thấp', 'Sữa Friso số 3 đang thấp hơn mức tối thiểu.', 'ALERT', 11, 0, NULL, '2026-08-05 14:31:02.871'),
(8, 3, 'STOCK_COUNT', 'Có phiếu kiểm kê được giao', 'Bạn được phân công kiểm kê toàn kho KK-202607-002.', 'STOCK_COUNT', 2, 0, NULL, '2026-08-05 14:31:02.871'),
(9, 2, 'ADJUSTMENT_PENDING', 'Có phiếu điều chỉnh chờ duyệt', 'Phiếu DC-202607-002 đang chờ phê duyệt.', 'STOCK_ADJUSTMENT', 2, 0, NULL, '2026-08-05 14:31:02.871');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `used_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_password_reset_tokens_user` (`user_id`),
  KEY `idx_password_reset_tokens_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `code`, `name`, `module`, `description`, `created_at`) VALUES
(1, 'goods_receipts:confirm', 'Xác nhận phiếu nhập', 'goods_receipts', 'Xác nhận phiếu nhập và cộng tồn kho', '2026-07-20 17:11:23.584'),
(2, 'goods_receipts:reverse', 'Đảo phiếu nhập', 'goods_receipts', 'Đảo phiếu nhập đã xác nhận, trừ lại tồn kho', '2026-07-20 17:11:23.584'),
(3, 'goods_issues:confirm', 'Xác nhận phiếu xuất', 'goods_issues', 'Xác nhận phiếu xuất và trừ tồn kho', '2026-07-20 17:11:23.584'),
(4, 'goods_issues:reverse', 'Đảo phiếu xuất', 'goods_issues', 'Đảo phiếu xuất đã xác nhận, hoàn lại tồn kho', '2026-07-20 17:11:23.584'),
(5, 'stock_transfers:confirm', 'Xác nhận phiếu chuyển kho', 'stock_transfers', 'Xác nhận chuyển hàng giữa hai vị trí', '2026-07-20 17:11:23.584'),
(6, 'stock_transfers:reverse', 'Đảo phiếu chuyển kho', 'stock_transfers', 'Đảo phiếu chuyển kho đã xác nhận', '2026-07-20 17:11:23.584'),
(7, 'stock_adjustments:approve', 'Duyệt phiếu điều chỉnh', 'stock_adjustments', 'Duyệt phiếu điều chỉnh và cập nhật tồn kho', '2026-07-20 17:11:23.584'),
(8, 'stock_adjustments:reject', 'Từ chối phiếu điều chỉnh', 'stock_adjustments', 'Từ chối phiếu điều chỉnh trước khi tồn kho thay đổi', '2026-07-20 17:11:23.584'),
(9, 'stock_adjustments:cancel', 'Hủy phiếu điều chỉnh', 'stock_adjustments', 'Hủy phiếu điều chỉnh còn ở trạng thái nháp hoặc chờ duyệt', '2026-07-20 17:11:23.584'),
(10, 'stock_counts:create', 'Tạo phiếu kiểm kê', 'stock_counts', 'Tạo phiếu kiểm kê và chốt số liệu tồn tại thời điểm đó', '2026-07-20 17:11:23.584'),
(11, 'stock_counts:start', 'Bắt đầu kiểm kê', 'stock_counts', 'Chuyển phiếu kiểm kê sang trạng thái đang kiểm kê', '2026-07-20 17:11:23.584'),
(12, 'stock_counts:count', 'Ghi số đếm kiểm kê', 'stock_counts', 'Nhập số lượng đếm thực tế cho từng dòng', '2026-07-20 17:11:23.584'),
(13, 'stock_counts:submit', 'Gửi duyệt kiểm kê', 'stock_counts', 'Nộp kết quả đếm để chờ duyệt', '2026-07-20 17:11:23.584'),
(14, 'stock_counts:approve', 'Duyệt phiếu kiểm kê', 'stock_counts', 'Duyệt kết quả kiểm kê và sinh phiếu điều chỉnh cho phần lệch', '2026-07-20 17:11:23.584'),
(15, 'alerts:generate', 'Sinh cảnh báo tồn kho', 'alerts', 'Quét dữ liệu tồn để sinh cảnh báo tồn thấp và hàng cận hạn', '2026-07-20 17:11:23.584'),
(16, 'notifications:generate', 'Sinh thông báo', 'notifications', 'Sinh thông báo từ các cảnh báo đang mở', '2026-07-20 17:11:23.584'),
(17, 'users:read', 'Xem nhân viên', 'auth', 'Xem danh sách tài khoản nhân viên', '2026-07-24 14:18:32.796'),
(18, 'users:create', 'Thêm nhân viên', 'auth', 'Tạo tài khoản nhân viên mới', '2026-07-24 14:18:32.796'),
(19, 'users:update', 'Sửa nhân viên', 'auth', 'Cập nhật thông tin và vai trò của nhân viên', '2026-07-24 14:18:32.796'),
(20, 'users:delete', 'Vô hiệu hóa nhân viên', 'auth', 'Ngừng hoạt động tài khoản nhân viên', '2026-07-24 14:18:32.796'),
(21, 'warehouses:create', 'Thêm kho', 'warehouses', 'Tạo kho mới', '2026-07-24 14:18:32.796'),
(22, 'warehouses:update', 'Sửa kho', 'warehouses', 'Cập nhật thông tin kho', '2026-07-24 14:18:32.796'),
(23, 'warehouses:delete', 'Xóa kho', 'warehouses', 'Ngừng hoạt động một kho', '2026-07-24 14:18:32.796'),
(24, 'settings:update', 'Sửa tham số hệ thống', 'settings', 'Thay đổi cấu hình chung của hệ thống', '2026-07-24 14:18:32.796'),
(25, 'alerts:read', 'Đánh dấu đã đọc cảnh báo', 'alerts', 'Đánh dấu một cảnh báo là đã đọc', '2026-07-24 14:18:32.796'),
(26, 'alerts:resolve', 'Xử lý cảnh báo', 'alerts', 'Đóng cảnh báo tồn kho sau khi đã xử lý', '2026-07-24 14:18:32.796'),
(27, 'notifications:read', 'Đánh dấu đã đọc thông báo', 'notifications', 'Đánh dấu một thông báo là đã đọc', '2026-07-24 14:18:32.796'),
(28, 'authorization:read', 'Xem phân quyền', 'authorization', 'Xem danh sách vai trò và quyền', '2026-08-05 14:31:02.306'),
(29, 'authorization:update', 'Sửa phân quyền', 'authorization', 'Gán hoặc gỡ quyền của một vai trò', '2026-08-05 14:31:02.306');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` bigint UNSIGNED NOT NULL,
  `brand_id` bigint UNSIGNED DEFAULT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','DISCONTINUED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_products_category_status` (`category_id`,`status`),
  KEY `idx_products_brand_status` (`brand_id`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `category_id`, `brand_id`, `code`, `name`, `description`, `image_url`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 3, 1, 'SP-BIM-HUG', 'Tã quần Huggies', 'Tã quần cho bé, thấm hút tốt', NULL, 'ACTIVE', '2026-07-20 17:18:01.935', '2026-07-20 17:18:01.935', NULL),
(2, 2, 2, 'SP-SUA-FRISO', 'Sữa Frisolac Gold', 'Sữa công thức cho trẻ nhỏ', NULL, 'ACTIVE', '2026-07-20 17:18:01.935', '2026-07-20 17:18:01.935', NULL),
(3, 4, 3, 'SP-TI-GIAM-CHICCO', 'Ti giả Chicco silicone', 'Ti giả silicone mềm cho bé', NULL, 'ACTIVE', '2026-07-20 17:18:01.935', '2026-07-20 17:18:01.935', NULL),
(4, 5, 4, 'SP-BOT-HEINZ', 'Bột ăn dặm Heinz', 'Bột ăn dặm vị ngũ cốc', NULL, 'ACTIVE', '2026-07-20 17:18:01.935', '2026-07-20 17:18:01.935', NULL),
(5, 4, 5, 'SP-BINH-SUA-PIGEON', 'Bình sữa Pigeon', 'Bình sữa cổ rộng PPSU', NULL, 'ACTIVE', '2026-07-20 17:18:01.935', '2026-07-20 17:18:01.935', NULL),
(6, 3, 6, 'SP-BIM-MOONY', 'Tã quần Moony', 'Tã quần cao cấp cho bé', NULL, 'ACTIVE', '2026-07-20 17:18:01.935', '2026-07-20 17:18:01.935', NULL),
(8, 3, NULL, 'SP-123', '123', NULL, NULL, 'ACTIVE', '2026-07-25 22:07:49.214', '2026-07-25 22:07:49.214', NULL),
(9, 8, NULL, 'SP-TEST-MILK-0725230847', 'Test sua bot 0725230847', NULL, NULL, 'ACTIVE', '2026-07-25 23:08:47.539', '2026-07-25 23:08:47.539', NULL),
(10, 8, NULL, 'SP-TEST-DIAPER-0725230847', 'Test bim ta 0725230847', NULL, NULL, 'ACTIVE', '2026-07-25 23:08:47.555', '2026-07-25 23:08:47.555', NULL),
(11, 8, NULL, 'SP-TEST-SNACK-0725230847', 'Test an dam 0725230847', NULL, NULL, 'ACTIVE', '2026-07-25 23:08:47.565', '2026-07-25 23:08:47.565', NULL),
(12, 9, NULL, 'SP-QR-NEW-945968', 'San pham quet moi', NULL, NULL, 'ACTIVE', '2026-07-25 23:29:19.212', '2026-07-25 23:29:19.212', NULL),
(20, 17, NULL, 'SP-AUDIT-MILK-1786249637', 'Sua kiem thu', NULL, NULL, 'ACTIVE', '2026-08-09 11:27:18.046', '2026-08-09 11:27:18.046', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `product_batches`
--

DROP TABLE IF EXISTS `product_batches`;
CREATE TABLE IF NOT EXISTS `product_batches` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_variant_id` bigint UNSIGNED NOT NULL,
  `supplier_id` bigint UNSIGNED DEFAULT NULL,
  `lot_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `manufacture_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `received_date` date DEFAULT NULL,
  `status` enum('ACTIVE','NEAR_EXPIRY','EXPIRED','BLOCKED','DEPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_batch_lot` (`product_variant_id`,`lot_number`),
  KEY `fk_batches_supplier` (`supplier_id`),
  KEY `idx_batches_expiry_status` (`expiry_date`,`status`),
  KEY `idx_batches_variant_status` (`product_variant_id`,`status`)
) ;

--
-- Dumping data for table `product_batches`
--

INSERT INTO `product_batches` (`id`, `product_variant_id`, `supplier_id`, `lot_number`, `manufacture_date`, `expiry_date`, `received_date`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 'LOT-HUG-M-202607', '2026-06-01', NULL, '2026-07-01', 'ACTIVE', 'Lô tã Huggies size M', '2026-07-20 17:18:01.948', '2026-07-20 17:18:01.948'),
(2, 2, 2, 'LOT-HUG-L-202607', '2026-06-01', NULL, '2026-07-01', 'ACTIVE', 'Lô tã Huggies size L', '2026-07-20 17:18:01.948', '2026-07-20 17:18:01.948'),
(3, 3, 1, 'LOT-FRISO3-202605', '2026-05-01', '2027-11-30', '2026-07-02', 'ACTIVE', 'Sữa Friso số 3', '2026-07-20 17:18:01.948', '2026-07-20 17:18:01.948'),
(4, 4, 1, 'LOT-FRISO4-202605', '2026-05-01', '2027-12-31', '2026-07-02', 'ACTIVE', 'Sữa Friso số 4', '2026-07-20 17:18:01.948', '2026-07-20 17:18:01.948'),
(5, 5, 3, 'LOT-CHICCO-202606', '2026-06-10', NULL, '2026-07-03', 'ACTIVE', 'Ti giả Chicco', '2026-07-20 17:18:01.948', '2026-07-20 17:18:01.948'),
(6, 6, 3, 'LOT-HEINZ-202601', '2026-01-10', '2026-09-15', '2026-07-04', 'NEAR_EXPIRY', 'Bột ăn dặm gần hạn', '2026-07-20 17:18:01.948', '2026-07-21 00:08:11.968'),
(7, 7, 3, 'LOT-PIGEON-202606', '2026-06-15', NULL, '2026-07-04', 'ACTIVE', 'Bình sữa Pigeon', '2026-07-20 17:18:01.948', '2026-07-20 17:18:01.948'),
(8, 8, 3, 'LOT-MOONY-M-202607', '2026-07-01', NULL, '2026-07-05', 'ACTIVE', 'Tã Moony size M', '2026-07-20 17:18:01.948', '2026-07-20 17:18:01.948');

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
CREATE TABLE IF NOT EXISTS `product_images` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint UNSIGNED NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int UNSIGNED NOT NULL DEFAULT '0',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_product_images_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint UNSIGNED NOT NULL,
  `unit_id` bigint UNSIGNED NOT NULL,
  `sku` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `variant_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attributes_json` json DEFAULT NULL,
  `min_stock_level` decimal(18,3) NOT NULL DEFAULT '0.000',
  `max_stock_level` decimal(18,3) DEFAULT NULL,
  `weight` decimal(18,3) DEFAULT NULL,
  `length` decimal(18,3) DEFAULT NULL,
  `width` decimal(18,3) DEFAULT NULL,
  `height` decimal(18,3) DEFAULT NULL,
  `requires_lot_tracking` tinyint(1) NOT NULL DEFAULT '0',
  `requires_expiry_tracking` tinyint(1) NOT NULL DEFAULT '0',
  `purchase_price` decimal(18,2) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','DISCONTINUED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `fk_variants_unit` (`unit_id`),
  KEY `idx_variants_product_status` (`product_id`,`status`),
  KEY `idx_variants_sku` (`sku`),
  KEY `idx_variants_barcode` (`barcode`)
) ;

--
-- Dumping data for table `product_variants`
--

INSERT INTO `product_variants` (`id`, `product_id`, `unit_id`, `sku`, `barcode`, `variant_name`, `attributes_json`, `min_stock_level`, `max_stock_level`, `weight`, `length`, `width`, `height`, `requires_lot_tracking`, `requires_expiry_tracking`, `purchase_price`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 3, 'BIM-HUG-M', '8930001000011', 'Size M - gói 68 miếng', '{\"size\": \"M\", \"pieces\": 68}', 10.000, 300.000, 2.100, NULL, NULL, NULL, 1, 0, 205000.00, 'ACTIVE', '2026-07-20 17:18:01.943', '2026-07-20 17:18:01.943', NULL),
(2, 1, 3, 'BIM-HUG-L', '8930001000012', 'Size L - gói 62 miếng', '{\"size\": \"L\", \"pieces\": 62}', 12.000, 320.000, 2.300, NULL, NULL, NULL, 1, 0, 219000.00, 'ACTIVE', '2026-07-20 17:18:01.943', '2026-07-20 17:18:01.943', NULL),
(3, 2, 2, 'SUA-FRISO-3', '8930002000011', 'Số 3 - hộp 850g', '{\"stage\": \"3\", \"weight\": \"850g\"}', 20.000, 240.000, 0.950, NULL, NULL, NULL, 1, 1, 498000.00, 'ACTIVE', '2026-07-20 17:18:01.943', '2026-07-20 17:18:01.943', NULL),
(4, 2, 2, 'SUA-FRISO-4', '8930002000012', 'Số 4 - hộp 850g', '{\"stage\": \"4\", \"weight\": \"850g\"}', 15.000, 220.000, 0.950, NULL, NULL, NULL, 1, 1, 510000.00, 'ACTIVE', '2026-07-20 17:18:01.943', '2026-07-20 17:18:01.943', NULL),
(5, 3, 1, 'TI-GIAM-CHICCO', '8930003000011', 'Silicone 0-6 tháng', '{\"age\": \"0-6 tháng\"}', 5.000, 120.000, 0.050, NULL, NULL, NULL, 1, 0, 89000.00, 'ACTIVE', '2026-07-20 17:18:01.943', '2026-07-20 17:18:01.943', NULL),
(6, 4, 2, 'BOT-HEINZ-GC', '8930004000011', 'Ngũ cốc 200g', '{\"flavor\": \"Ngũ cốc\", \"weight\": \"200g\"}', 8.000, 180.000, 0.250, NULL, NULL, NULL, 1, 1, 79000.00, 'ACTIVE', '2026-07-20 17:18:01.943', '2026-07-20 17:18:01.943', NULL),
(7, 5, 1, 'BINH-PIGEON-240', '8930005000011', 'PPSU cổ rộng 240ml', '{\"capacity\": \"240ml\"}', 6.000, 150.000, 0.160, NULL, NULL, NULL, 1, 0, 265000.00, 'ACTIVE', '2026-07-20 17:18:01.943', '2026-07-20 17:18:01.943', NULL),
(8, 6, 3, 'BIM-MOONY-M', '8930006000011', 'Size M - gói 58 miếng', '{\"size\": \"M\", \"pieces\": 58}', 10.000, 280.000, 2.000, NULL, NULL, NULL, 1, 0, 245000.00, 'ACTIVE', '2026-07-20 17:18:01.943', '2026-07-20 17:18:01.943', NULL),
(10, 8, 1, '123', NULL, '123', NULL, 30.000, NULL, NULL, NULL, NULL, NULL, 1, 0, NULL, 'ACTIVE', '2026-07-25 22:07:49.229', '2026-07-25 22:07:49.229', NULL),
(11, 9, 1, 'TEST-MILK-0725230847', NULL, 'Test sua bot 0725230847', NULL, 2.000, NULL, NULL, NULL, NULL, NULL, 1, 0, NULL, 'ACTIVE', '2026-07-25 23:08:47.541', '2026-07-25 23:08:47.541', NULL),
(12, 10, 1, 'TEST-DIAPER-0725230847', NULL, 'Test bim ta 0725230847', NULL, 2.000, NULL, NULL, NULL, NULL, NULL, 1, 0, NULL, 'ACTIVE', '2026-07-25 23:08:47.556', '2026-07-25 23:08:47.556', NULL),
(13, 11, 1, 'TEST-SNACK-0725230847', NULL, 'Test an dam 0725230847', NULL, 1.000, NULL, NULL, NULL, NULL, NULL, 1, 0, NULL, 'ACTIVE', '2026-07-25 23:08:47.566', '2026-07-25 23:08:47.566', NULL),
(14, 12, 1, 'QR-NEW-945968', NULL, 'San pham quet moi', NULL, 1.000, NULL, NULL, NULL, NULL, NULL, 1, 0, NULL, 'ACTIVE', '2026-07-25 23:29:19.214', '2026-07-25 23:29:19.214', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `code`, `name`, `description`, `is_system`, `created_at`, `updated_at`) VALUES
(1, 'ADMIN', 'Administrator', 'Toàn quyền hệ thống', 1, '2026-07-20 17:11:23.581', '2026-07-20 17:11:23.581'),
(2, 'WAREHOUSE_MANAGER', 'Warehouse Manager', 'Quản lý nghiệp vụ kho', 1, '2026-07-20 17:11:23.581', '2026-07-20 17:11:23.581'),
(3, 'STAFF', 'Warehouse Staff', 'Nhân viên vận hành kho', 1, '2026-07-20 17:11:23.581', '2026-07-20 17:11:23.581'),
(4, 'AUDITOR', 'Auditor', 'Chỉ đọc và kiểm toán', 1, '2026-07-20 17:11:23.581', '2026-07-20 17:11:23.581');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` bigint UNSIGNED NOT NULL,
  `permission_id` bigint UNSIGNED NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `fk_role_permissions_permission` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`, `created_at`) VALUES
(1, 1, '2026-07-20 17:11:23.586'),
(1, 2, '2026-07-20 17:11:23.586'),
(1, 3, '2026-07-20 17:11:23.586'),
(1, 4, '2026-07-20 17:11:23.586'),
(1, 5, '2026-07-20 17:11:23.586'),
(1, 6, '2026-07-20 17:11:23.586'),
(1, 7, '2026-07-20 17:11:23.586'),
(1, 8, '2026-07-20 17:11:23.586'),
(1, 9, '2026-07-20 17:11:23.586'),
(1, 10, '2026-07-20 17:11:23.586'),
(1, 11, '2026-07-20 17:11:23.586'),
(1, 12, '2026-07-20 17:11:23.586'),
(1, 13, '2026-07-20 17:11:23.586'),
(1, 14, '2026-07-20 17:11:23.586'),
(1, 15, '2026-07-20 17:11:23.586'),
(1, 16, '2026-07-20 17:11:23.586'),
(1, 17, '2026-07-24 14:18:32.818'),
(1, 18, '2026-07-24 14:18:32.818'),
(1, 19, '2026-07-24 14:18:32.818'),
(1, 20, '2026-07-24 14:18:32.818'),
(1, 21, '2026-07-24 14:18:32.818'),
(1, 22, '2026-07-24 14:18:32.818'),
(1, 23, '2026-07-24 14:18:32.818'),
(1, 24, '2026-07-24 14:18:32.818'),
(1, 25, '2026-07-24 14:18:32.818'),
(1, 26, '2026-07-24 14:18:32.818'),
(1, 27, '2026-07-24 14:18:32.818'),
(1, 28, '2026-08-05 14:31:02.318'),
(1, 29, '2026-08-05 14:31:02.318'),
(2, 1, '2026-07-20 17:11:23.586'),
(2, 2, '2026-07-20 17:11:23.586'),
(2, 3, '2026-07-20 17:11:23.586'),
(2, 4, '2026-07-20 17:11:23.586'),
(2, 5, '2026-07-20 17:11:23.586'),
(2, 6, '2026-07-20 17:11:23.586'),
(2, 7, '2026-07-20 17:11:23.586'),
(2, 8, '2026-07-20 17:11:23.586'),
(2, 9, '2026-07-20 17:11:23.586'),
(2, 10, '2026-07-20 17:11:23.586'),
(2, 11, '2026-07-20 17:11:23.586'),
(2, 12, '2026-07-20 17:11:23.586'),
(2, 13, '2026-07-20 17:11:23.586'),
(2, 14, '2026-07-20 17:11:23.586'),
(2, 15, '2026-07-20 17:11:23.586'),
(2, 16, '2026-07-20 17:11:23.586'),
(2, 17, '2026-07-24 14:18:32.818'),
(2, 18, '2026-07-24 14:18:32.818'),
(2, 19, '2026-07-24 14:18:32.818'),
(2, 20, '2026-07-24 14:18:32.818'),
(2, 21, '2026-07-24 14:18:32.818'),
(2, 22, '2026-07-24 14:18:32.818'),
(2, 23, '2026-07-24 14:18:32.818'),
(2, 24, '2026-07-24 14:18:32.818'),
(2, 25, '2026-07-24 14:18:32.818'),
(2, 26, '2026-07-24 14:18:32.818'),
(2, 27, '2026-07-24 14:18:32.818'),
(2, 28, '2026-08-05 14:31:02.318'),
(2, 29, '2026-08-05 14:31:02.318'),
(3, 12, '2026-07-20 17:11:23.589'),
(3, 13, '2026-07-20 17:11:23.589'),
(4, 17, '2026-08-05 14:36:00.653'),
(4, 25, '2026-08-05 14:36:00.653'),
(4, 27, '2026-08-05 14:36:00.653'),
(4, 28, '2026-08-05 14:36:00.653');

-- --------------------------------------------------------

--
-- Table structure for table `stock_adjustments`
--

DROP TABLE IF EXISTS `stock_adjustments`;
CREATE TABLE IF NOT EXISTS `stock_adjustments` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `adjustment_code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_id` bigint UNSIGNED NOT NULL,
  `stock_count_id` bigint UNSIGNED DEFAULT NULL,
  `adjustment_type` enum('COUNT','MANUAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DRAFT','PENDING','APPROVED','REJECTED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `reason_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint UNSIGNED NOT NULL,
  `submitted_by` bigint UNSIGNED DEFAULT NULL,
  `submitted_at` datetime(3) DEFAULT NULL,
  `approved_by` bigint UNSIGNED DEFAULT NULL,
  `approved_at` datetime(3) DEFAULT NULL,
  `rejected_by` bigint UNSIGNED DEFAULT NULL,
  `rejected_at` datetime(3) DEFAULT NULL,
  `rejection_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `adjustment_code` (`adjustment_code`),
  KEY `fk_stock_adjustments_warehouse` (`warehouse_id`),
  KEY `fk_stock_adjustments_created_by` (`created_by`),
  KEY `fk_stock_adjustments_submitted_by` (`submitted_by`),
  KEY `fk_stock_adjustments_approved_by` (`approved_by`),
  KEY `fk_stock_adjustments_rejected_by` (`rejected_by`),
  KEY `idx_stock_adjustments_status` (`status`),
  KEY `idx_stock_adjustments_stock_count` (`stock_count_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_adjustments`
--

INSERT INTO `stock_adjustments` (`id`, `adjustment_code`, `warehouse_id`, `stock_count_id`, `adjustment_type`, `status`, `reason_code`, `note`, `created_by`, `submitted_by`, `submitted_at`, `approved_by`, `approved_at`, `rejected_by`, `rejected_at`, `rejection_reason`, `created_at`, `updated_at`) VALUES
(1, 'DC-202607-001', 1, 1, 'COUNT', 'APPROVED', 'KIEM_KE_LECH_THIEU', 'Điều chỉnh theo kiểm kê khu A', 3, 3, '2026-07-12 15:05:00.000', 2, '2026-07-12 16:05:00.000', NULL, NULL, NULL, '2026-07-20 17:18:22.659', '2026-07-20 17:18:22.659'),
(2, 'DC-202607-002', 1, NULL, 'MANUAL', 'APPROVED', 'HANG_HONG', 'Chờ duyệt điều chỉnh hàng hỏng', 3, 3, '2026-07-19 09:00:00.000', 1, '2026-08-05 19:44:04.298', NULL, NULL, NULL, '2026-07-20 17:18:22.659', '2026-08-05 19:44:04.298'),
(7, 'DC-202608-001', 2, NULL, 'MANUAL', 'DRAFT', 'DIEU_CHINH_THU_CONG', NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-06 22:09:25.325', '2026-08-06 22:09:25.325'),
(8, 'ADJ-COUNT-COUNT-2-A784DCBBC8494CE1-D9EE94DF6E21474A', 2, 10, 'COUNT', 'PENDING', 'COUNT_VARIANCE', 'Generated from stock count COUNT-2-A784DCBBC8494CE1', 1, 1, '2026-08-06 23:19:09.536', NULL, NULL, NULL, NULL, NULL, '2026-08-06 23:19:09.536', '2026-08-06 23:19:09.536'),
(9, 'ADJ-COUNT-COUNT-2-9C521850275841B6-52EE6F25DF494440', 2, 9, 'COUNT', 'PENDING', 'COUNT_VARIANCE', 'Generated from stock count COUNT-2-9C521850275841B6', 1, 1, '2026-08-06 23:19:33.448', NULL, NULL, NULL, NULL, NULL, '2026-08-06 23:19:33.448', '2026-08-06 23:19:33.448'),
(10, 'ADJ-COUNT-COUNT-1-F985317C285347FA-BB34CC189F1447A6', 1, 4, 'COUNT', 'APPROVED', 'COUNT_VARIANCE', 'Generated from stock count COUNT-1-F985317C285347FA', 1, 1, '2026-08-07 01:27:03.957', 1, '2026-08-08 15:37:55.259', NULL, NULL, NULL, '2026-08-07 01:27:03.957', '2026-08-08 15:37:55.259');

-- --------------------------------------------------------

--
-- Table structure for table `stock_adjustment_items`
--

DROP TABLE IF EXISTS `stock_adjustment_items`;
CREATE TABLE IF NOT EXISTS `stock_adjustment_items` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `stock_adjustment_id` bigint UNSIGNED NOT NULL,
  `product_variant_id` bigint UNSIGNED NOT NULL,
  `batch_id` bigint UNSIGNED DEFAULT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `adjustment_direction` enum('IN','OUT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(18,3) NOT NULL,
  `quantity_before` decimal(18,3) DEFAULT NULL,
  `quantity_after` decimal(18,3) DEFAULT NULL,
  `reason_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `fk_stock_adjustment_items_variant` (`product_variant_id`),
  KEY `fk_stock_adjustment_items_batch` (`batch_id`),
  KEY `fk_stock_adjustment_items_location` (`location_id`),
  KEY `idx_stock_adjustment_items_adjustment` (`stock_adjustment_id`)
) ;

--
-- Dumping data for table `stock_adjustment_items`
--

INSERT INTO `stock_adjustment_items` (`id`, `stock_adjustment_id`, `product_variant_id`, `batch_id`, `location_id`, `adjustment_direction`, `quantity`, `quantity_before`, `quantity_after`, `reason_code`, `note`, `created_at`) VALUES
(1, 1, 3, 3, 1, 'OUT', 1.000, 8.000, 7.000, 'KIEM_KE_LECH_THIEU', 'Giảm tồn theo kiểm kê', '2026-07-20 17:18:22.661'),
(2, 2, 6, 6, 2, 'OUT', 2.000, 24.000, 22.000, 'HANG_HONG', 'Hộp móp méo cần loại khỏi tồn bán', '2026-07-20 17:18:22.661'),
(3, 7, 12, NULL, 6, 'OUT', 10.000, NULL, NULL, 'DIEU_CHINH_THU_CONG', '-10', '2026-08-06 22:09:25.329'),
(4, 8, 8, 8, 6, 'OUT', 4.000, NULL, NULL, 'lỗi 4 sản phẩm', NULL, '2026-08-06 23:19:09.538'),
(5, 9, 8, 8, 6, 'OUT', 4.000, NULL, NULL, 'Trả lỗi 4 item', NULL, '2026-08-06 23:19:33.449'),
(6, 10, 4, 4, 3, 'OUT', 4.000, 64.000, 60.000, 'Lon sữa rơi', NULL, '2026-08-07 01:27:03.966');

-- --------------------------------------------------------

--
-- Table structure for table `stock_counts`
--

DROP TABLE IF EXISTS `stock_counts`;
CREATE TABLE IF NOT EXISTS `stock_counts` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `count_code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_id` bigint UNSIGNED NOT NULL,
  `scope_type` enum('WAREHOUSE','ZONE','SHELF','LOCATION','SKU','CATEGORY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_reference_id` bigint UNSIGNED DEFAULT NULL,
  `status` enum('DRAFT','IN_PROGRESS','SUBMITTED','APPROVED','REJECTED','COMPLETED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `snapshot_at` datetime(3) DEFAULT NULL,
  `assigned_to` bigint UNSIGNED DEFAULT NULL,
  `created_by` bigint UNSIGNED NOT NULL,
  `submitted_by` bigint UNSIGNED DEFAULT NULL,
  `submitted_at` datetime(3) DEFAULT NULL,
  `approved_by` bigint UNSIGNED DEFAULT NULL,
  `approved_at` datetime(3) DEFAULT NULL,
  `rejected_by` bigint UNSIGNED DEFAULT NULL,
  `rejected_at` datetime(3) DEFAULT NULL,
  `rejection_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `count_code` (`count_code`),
  KEY `fk_stock_counts_assigned_to` (`assigned_to`),
  KEY `fk_stock_counts_created_by` (`created_by`),
  KEY `fk_stock_counts_submitted_by` (`submitted_by`),
  KEY `fk_stock_counts_approved_by` (`approved_by`),
  KEY `idx_stock_counts_warehouse_status` (`warehouse_id`,`status`),
  KEY `fk_stock_counts_rejected_by` (`rejected_by`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_counts`
--

INSERT INTO `stock_counts` (`id`, `count_code`, `warehouse_id`, `scope_type`, `scope_reference_id`, `status`, `snapshot_at`, `assigned_to`, `created_by`, `submitted_by`, `submitted_at`, `approved_by`, `approved_at`, `rejected_by`, `rejected_at`, `rejection_reason`, `note`, `created_at`, `updated_at`) VALUES
(1, 'KK-202607-001', 1, 'ZONE', 1, 'APPROVED', '2026-07-12 08:00:00.000', 3, 2, 3, '2026-07-12 15:00:00.000', 2, '2026-07-12 16:00:00.000', NULL, NULL, NULL, 'Kiểm kê khu sữa', '2026-07-20 17:18:01.986', '2026-07-20 17:18:01.986'),
(2, 'KK-202607-002', 1, 'WAREHOUSE', NULL, 'IN_PROGRESS', '2026-07-18 08:00:00.000', 3, 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Kiểm kê toàn kho đang thực hiện', '2026-07-20 17:18:01.986', '2026-07-20 17:18:01.986'),
(4, 'COUNT-1-F985317C285347FA', 1, 'ZONE', 1, 'APPROVED', '2026-08-07 01:16:29.307', NULL, 1, 1, '2026-08-07 01:26:47.185', 1, '2026-08-07 01:27:03.971', NULL, NULL, NULL, 'Automated Live Test Count', '2026-08-05 00:11:17.509', '2026-08-07 01:27:03.971'),
(9, 'COUNT-2-9C521850275841B6', 2, 'WAREHOUSE', NULL, 'APPROVED', '2026-08-06 21:37:42.222', NULL, 1, 1, '2026-08-06 23:19:25.908', 1, '2026-08-06 23:19:33.451', NULL, NULL, NULL, '12', '2026-08-06 21:37:35.327', '2026-08-06 23:19:33.451'),
(10, 'COUNT-2-A784DCBBC8494CE1', 2, 'CATEGORY', 3, 'APPROVED', '2026-08-06 23:09:48.126', NULL, 1, 1, '2026-08-06 23:11:15.964', 1, '2026-08-06 23:19:09.541', NULL, NULL, NULL, '0', '2026-08-06 23:09:43.958', '2026-08-06 23:19:09.541');

-- --------------------------------------------------------

--
-- Table structure for table `stock_count_items`
--

DROP TABLE IF EXISTS `stock_count_items`;
CREATE TABLE IF NOT EXISTS `stock_count_items` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `stock_count_id` bigint UNSIGNED NOT NULL,
  `product_variant_id` bigint UNSIGNED NOT NULL,
  `batch_id` bigint UNSIGNED DEFAULT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `system_quantity` decimal(18,3) NOT NULL,
  `actual_quantity` decimal(18,3) DEFAULT NULL,
  `difference_quantity` decimal(18,3) GENERATED ALWAYS AS ((case when (`actual_quantity` is null) then NULL else (`actual_quantity` - `system_quantity`) end)) STORED,
  `reason_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `counted_by` bigint UNSIGNED DEFAULT NULL,
  `counted_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_stock_count_item` (`stock_count_id`,`product_variant_id`,`location_id`,`batch_id`),
  KEY `fk_stock_count_items_variant` (`product_variant_id`),
  KEY `fk_stock_count_items_batch` (`batch_id`),
  KEY `fk_stock_count_items_location` (`location_id`),
  KEY `fk_stock_count_items_counted_by` (`counted_by`),
  KEY `idx_stock_count_items_count` (`stock_count_id`),
  KEY `idx_stock_count_items_difference` (`difference_quantity`)
) ;

--
-- Dumping data for table `stock_count_items`
--

INSERT INTO `stock_count_items` (`id`, `stock_count_id`, `product_variant_id`, `batch_id`, `location_id`, `system_quantity`, `actual_quantity`, `reason_code`, `note`, `counted_by`, `counted_at`, `created_at`) VALUES
(1, 1, 3, 3, 1, 8.000, 7.000, 'LECH_THIEU', 'Thiếu 1 hộp khi kiểm kê', 3, '2026-07-12 14:00:00.000', '2026-07-20 17:18:22.657'),
(2, 1, 4, 4, 3, 64.000, 64.000, NULL, 'Đúng tồn hệ thống', 3, '2026-07-12 14:10:00.000', '2026-07-20 17:18:22.657'),
(3, 2, 1, 1, 4, 150.000, 122.000, '3', 'Chưa kiểm đếm', 1, '2026-08-07 01:04:27.674', '2026-07-20 17:18:22.657'),
(4, 4, 3, 3, 1, 8.000, 8.000, NULL, NULL, 1, '2026-08-07 01:22:14.777', '2026-08-05 00:11:17.512'),
(5, 4, 10, NULL, 1, 123.000, 123.000, NULL, NULL, 1, '2026-08-07 01:22:50.390', '2026-08-05 00:11:17.515'),
(6, 4, 6, 6, 2, 24.000, 24.000, NULL, NULL, 1, '2026-08-07 01:22:46.814', '2026-08-05 00:11:17.516'),
(7, 4, 4, NULL, 3, 3.000, 3.000, NULL, NULL, 1, '2026-08-07 01:22:41.114', '2026-08-05 00:11:17.516'),
(8, 4, 4, 4, 3, 64.000, 60.000, 'Lon sữa rơi', NULL, 1, '2026-08-07 01:26:40.341', '2026-08-05 00:11:17.517'),
(9, 4, 11, NULL, 3, 11.000, 11.000, NULL, NULL, 1, '2026-08-07 01:26:41.450', '2026-08-05 00:11:17.517'),
(10, 4, 12, NULL, 3, 7.000, 7.000, NULL, NULL, 1, '2026-08-07 01:26:42.005', '2026-08-05 00:11:17.517'),
(11, 4, 13, NULL, 3, 5.000, 5.000, NULL, NULL, 1, '2026-08-07 01:26:44.019', '2026-08-05 00:11:17.518'),
(12, 4, 14, NULL, 3, 3.000, 3.000, NULL, NULL, 1, '2026-08-07 01:26:43.431', '2026-08-05 00:11:17.518'),
(13, 9, 8, 8, 6, 84.000, 80.000, 'Trả lỗi 4 item', NULL, 1, '2026-08-06 21:38:13.716', '2026-08-06 21:37:35.330'),
(14, 10, 8, 8, 6, 84.000, 80.000, 'lỗi 4 sản phẩm', NULL, 1, '2026-08-06 23:11:08.381', '2026-08-06 23:09:43.962');

-- --------------------------------------------------------

--
-- Table structure for table `stock_locations`
--

DROP TABLE IF EXISTS `stock_locations`;
CREATE TABLE IF NOT EXISTS `stock_locations` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_variant_id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `batch_id` bigint UNSIGNED DEFAULT NULL,
  `quantity` decimal(18,3) NOT NULL DEFAULT '0.000',
  `reserved_quantity` decimal(18,3) NOT NULL DEFAULT '0.000',
  `version` bigint UNSIGNED NOT NULL DEFAULT '0',
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `batch_key` bigint UNSIGNED GENERATED ALWAYS AS (ifnull(`batch_id`,0)) STORED,
  `available_quantity` decimal(18,3) GENERATED ALWAYS AS ((`quantity` - `reserved_quantity`)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_stock_location` (`product_variant_id`,`location_id`,`batch_key`),
  KEY `idx_stock_variant` (`product_variant_id`),
  KEY `idx_stock_location` (`location_id`),
  KEY `idx_stock_batch` (`batch_id`),
  KEY `idx_stock_available` (`available_quantity`)
) ;

--
-- Dumping data for table `stock_locations`
--

INSERT INTO `stock_locations` (`id`, `product_variant_id`, `location_id`, `batch_id`, `quantity`, `reserved_quantity`, `version`, `updated_at`) VALUES
(1, 1, 4, 1, 150.000, 12.000, 4, '2026-08-05 14:31:02.823'),
(2, 2, 4, 2, 95.000, 8.000, 4, '2026-08-05 14:31:02.823'),
(3, 3, 1, 3, 8.000, 0.000, 4, '2026-08-05 14:31:02.823'),
(4, 4, 3, 4, 60.000, 4.000, 5, '2026-08-08 15:37:55.243'),
(5, 5, 5, 5, 0.000, 0.000, 4, '2026-08-05 14:31:02.823'),
(6, 6, 2, 6, 22.000, 2.000, 5, '2026-08-05 19:44:04.241'),
(7, 7, 5, 7, 37.000, 3.000, 4, '2026-08-05 14:31:02.823'),
(8, 8, 6, 8, 84.000, 5.000, 5, '2026-08-05 19:43:59.475'),
(10, 10, 1, NULL, 123.000, 0.000, 0, '2026-07-25 22:07:49.233'),
(11, 11, 3, NULL, 11.000, 0.000, 0, '2026-07-25 23:08:47.542'),
(12, 12, 3, NULL, 7.000, 0.000, 0, '2026-07-25 23:08:47.559'),
(13, 13, 3, NULL, 5.000, 0.000, 0, '2026-07-25 23:08:47.569'),
(14, 4, 3, NULL, 3.000, 0.000, 1, '2026-07-25 23:25:58.152'),
(16, 14, 3, NULL, 3.000, 0.000, 0, '2026-07-25 23:29:20.791');

-- --------------------------------------------------------

--
-- Table structure for table `stock_transfers`
--

DROP TABLE IF EXISTS `stock_transfers`;
CREATE TABLE IF NOT EXISTS `stock_transfers` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `transfer_code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_warehouse_id` bigint UNSIGNED NOT NULL,
  `destination_warehouse_id` bigint UNSIGNED NOT NULL,
  `status` enum('DRAFT','PENDING','CONFIRMED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint UNSIGNED NOT NULL,
  `confirmed_by` bigint UNSIGNED DEFAULT NULL,
  `confirmed_at` datetime(3) DEFAULT NULL,
  `cancelled_by` bigint UNSIGNED DEFAULT NULL,
  `cancelled_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transfer_code` (`transfer_code`),
  KEY `fk_stock_transfers_destination_warehouse` (`destination_warehouse_id`),
  KEY `fk_stock_transfers_created_by` (`created_by`),
  KEY `fk_stock_transfers_confirmed_by` (`confirmed_by`),
  KEY `fk_stock_transfers_cancelled_by` (`cancelled_by`),
  KEY `idx_stock_transfers_status` (`status`),
  KEY `idx_stock_transfers_source_destination` (`source_warehouse_id`,`destination_warehouse_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_transfers`
--

INSERT INTO `stock_transfers` (`id`, `transfer_code`, `source_warehouse_id`, `destination_warehouse_id`, `status`, `note`, `created_by`, `confirmed_by`, `confirmed_at`, `cancelled_by`, `cancelled_at`, `created_at`, `updated_at`) VALUES
(1, 'CK-202607-001', 1, 2, 'CONFIRMED', 'Chuyển hàng bán chạy sang chi nhánh Quận 7', 3, 2, '2026-07-08 11:00:00.000', NULL, NULL, '2026-07-20 17:18:01.969', '2026-07-20 17:18:01.969'),
(2, 'CK-202607-002', 1, 2, 'DRAFT', 'Dự kiến bổ sung sữa Friso', 3, NULL, NULL, NULL, NULL, '2026-07-20 17:18:01.969', '2026-07-20 17:18:01.969'),
(8, 'TRF-1785932024447-55F8EA3688964C1C', 1, 1, 'DRAFT', NULL, 3, NULL, NULL, NULL, NULL, '2026-08-05 19:13:44.448', '2026-08-05 19:13:44.448');

-- --------------------------------------------------------

--
-- Table structure for table `stock_transfer_items`
--

DROP TABLE IF EXISTS `stock_transfer_items`;
CREATE TABLE IF NOT EXISTS `stock_transfer_items` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `stock_transfer_id` bigint UNSIGNED NOT NULL,
  `product_variant_id` bigint UNSIGNED NOT NULL,
  `batch_id` bigint UNSIGNED DEFAULT NULL,
  `source_location_id` bigint UNSIGNED NOT NULL,
  `destination_location_id` bigint UNSIGNED NOT NULL,
  `quantity` decimal(18,3) NOT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `fk_stock_transfer_items_variant` (`product_variant_id`),
  KEY `fk_stock_transfer_items_batch` (`batch_id`),
  KEY `fk_stock_transfer_items_source_location` (`source_location_id`),
  KEY `fk_stock_transfer_items_destination_location` (`destination_location_id`),
  KEY `idx_stock_transfer_items_transfer` (`stock_transfer_id`)
) ;

--
-- Dumping data for table `stock_transfer_items`
--

INSERT INTO `stock_transfer_items` (`id`, `stock_transfer_id`, `product_variant_id`, `batch_id`, `source_location_id`, `destination_location_id`, `quantity`, `note`, `created_at`) VALUES
(1, 1, 1, 1, 4, 6, 30.000, 'Chuyển về chi nhánh', '2026-07-20 17:18:01.974'),
(2, 2, 4, 4, 3, 6, 20.000, 'Dự kiến bổ sung sữa Friso', '2026-08-05 09:47:40.347'),
(3, 8, 10, NULL, 1, 23, 23.000, NULL, '2026-08-05 19:13:44.458');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_suppliers_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `code`, `name`, `tax_code`, `contact_name`, `phone`, `email`, `address`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'NCC-FRISO', 'Công ty TNHH FrieslandCampina Việt Nam', '0310000001', 'Nguyễn Hoàng Anh', '02811112222', 'sales.friso@example.com', 'TP.HCM', 'ACTIVE', '2026-07-20 17:18:01.933', '2026-07-20 17:18:01.933', NULL),
(2, 'NCC-HUGGIES', 'Nhà phân phối Kimberly-Clark', '0310000002', 'Trần Minh Khoa', '02822223333', 'sales.huggies@example.com', 'Bình Dương', 'ACTIVE', '2026-07-20 17:18:01.933', '2026-07-20 17:18:01.933', NULL),
(3, 'NCC-BABYCARE', 'Công ty Baby Care Việt Nam', '0310000003', 'Lê Thanh Tâm', '02833334444', 'contact@babycare.example.com', 'Đồng Nai', 'ACTIVE', '2026-07-20 17:18:01.933', '2026-07-20 17:18:01.933', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `supplier_products`
--

DROP TABLE IF EXISTS `supplier_products`;
CREATE TABLE IF NOT EXISTS `supplier_products` (
  `supplier_id` bigint UNSIGNED NOT NULL,
  `product_variant_id` bigint UNSIGNED NOT NULL,
  `supplier_sku` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_purchase_price` decimal(18,2) DEFAULT NULL,
  `lead_time_days` int UNSIGNED DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`supplier_id`,`product_variant_id`),
  KEY `fk_supplier_products_variant` (`product_variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `supplier_products`
--

INSERT INTO `supplier_products` (`supplier_id`, `product_variant_id`, `supplier_sku`, `last_purchase_price`, `lead_time_days`, `created_at`) VALUES
(1, 3, 'FRISO-GOLD-3-850', 498000.00, 5, '2026-07-20 17:18:01.946'),
(1, 4, 'FRISO-GOLD-4-850', 510000.00, 5, '2026-07-20 17:18:01.946'),
(2, 1, 'HUG-M-68', 205000.00, 3, '2026-07-20 17:18:01.946'),
(2, 2, 'HUG-L-62', 219000.00, 3, '2026-07-20 17:18:01.946'),
(3, 5, 'CHICCO-PAC-06', 89000.00, 4, '2026-07-20 17:18:01.946'),
(3, 6, 'HEINZ-CEREAL-200', 79000.00, 4, '2026-07-20 17:18:01.946'),
(3, 7, 'PIGEON-PPSU-240', 265000.00, 4, '2026-07-20 17:18:01.946'),
(3, 8, 'MOONY-M-58', 245000.00, 4, '2026-07-20 17:18:01.946');

-- --------------------------------------------------------

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
CREATE TABLE IF NOT EXISTS `units` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `precision_scale` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `units`
--

INSERT INTO `units` (`id`, `code`, `name`, `precision_scale`, `created_at`) VALUES
(1, 'PCS', 'Cái', 0, '2026-07-20 17:11:23.592'),
(2, 'BOX', 'Hộp', 0, '2026-07-20 17:11:23.592'),
(3, 'PACK', 'Gói', 0, '2026-07-20 17:11:23.592'),
(4, 'BOTTLE', 'Chai', 0, '2026-07-20 17:11:23.592'),
(5, 'KG', 'Kilogram', 3, '2026-07-20 17:11:23.592'),
(6, 'L', 'Lít', 3, '2026-07-20 17:11:23.592');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id` bigint UNSIGNED NOT NULL,
  `employee_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','LOCKED','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `last_login_at` datetime(3) DEFAULT NULL,
  `failed_login_attempts` int UNSIGNED NOT NULL DEFAULT '0',
  `locked_until` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `employee_code` (`employee_code`),
  UNIQUE KEY `phone` (`phone`),
  KEY `fk_users_role` (`role_id`),
  KEY `idx_users_status` (`status`),
  KEY `idx_users_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role_id`, `employee_code`, `full_name`, `email`, `phone`, `password_hash`, `status`, `last_login_at`, `failed_login_attempts`, `locked_until`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'NV-ADMIN', 'Quản trị hệ thống', 'admin@bambi.test', '0900000001', '$2b$10$KLhvKbVc8KKE8OaYcIvYQegHfWaKu4jL7x4DHnUBQ5EtsaEi6SUbi', 'ACTIVE', '2026-08-10 00:44:40.494', 0, NULL, '2026-07-20 17:17:37.541', '2026-08-10 00:44:40.494', NULL),
(2, 2, 'NV-QLK', 'Quản lý kho Bambi', 'manager@bambi.test', '0900000002', '$2b$10$KLhvKbVc8KKE8OaYcIvYQegHfWaKu4jL7x4DHnUBQ5EtsaEi6SUbi', 'ACTIVE', NULL, 0, NULL, '2026-07-20 17:17:37.553', '2026-07-20 23:57:36.488', NULL),
(3, 3, 'NV-KHO-01', 'Nhân viên PHS', 'staff@bambi.test', '0900000003', '$2b$10$KLhvKbVc8KKE8OaYcIvYQegHfWaKu4jL7x4DHnUBQ5EtsaEi6SUbi', 'ACTIVE', NULL, 0, NULL, '2026-07-20 17:17:37.555', '2026-07-20 23:57:36.488', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `refresh_token_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime(3) NOT NULL,
  `revoked_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_user_sessions_user` (`user_id`),
  KEY `idx_user_sessions_expires` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_sessions`
--

INSERT INTO `user_sessions` (`id`, `user_id`, `refresh_token_hash`, `user_agent`, `ip_address`, `expires_at`, `revoked_at`, `created_at`) VALUES
(1, 1, '3f6826285f7e838e456434f0293f79178fe65e620d365b32217b2f3d097f0be7', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8875', '::1', '2026-08-19 23:57:43.389', NULL, '2026-07-20 23:57:43.390'),
(2, 1, '52be7ca7ab4e6cb73bd1b3e17b28b0f36bbc5f01db4bc2b691dd8e526fb3b156', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0', '::1', '2026-08-19 23:59:23.021', NULL, '2026-07-20 23:59:23.022'),
(3, 1, '47d73da3d912aac0693c6da14840a4d71af55f24c26b85fe85bb727591fad864', NULL, '::ffff:127.0.0.1', '2026-08-20 00:07:45.274', NULL, '2026-07-21 00:07:45.276'),
(4, 1, '9e0ba2f15d1b179dc6145036c44cf804aa58850de04289320abb42348b9b7b46', NULL, '::ffff:127.0.0.1', '2026-08-20 00:08:26.249', NULL, '2026-07-21 00:08:26.251'),
(5, 1, 'a490d51a2fa0bd7f0c08088c071703246b071fe15568596b5be1ce0439dd5aac', NULL, '::ffff:127.0.0.1', '2026-08-20 00:08:37.061', NULL, '2026-07-21 00:08:37.063'),
(6, 1, 'fb37445aea49e6ce330019e377ace97922a987d4c0d586c60ed0c7574011c035', NULL, '::ffff:127.0.0.1', '2026-08-20 00:09:25.000', NULL, '2026-07-21 00:09:25.001'),
(7, 1, '2f89cc03c42eb933044c53a12a258b268ccd30042a494bb40491e5547cba2e5b', NULL, '::ffff:127.0.0.1', '2026-08-20 00:23:55.243', NULL, '2026-07-21 00:23:55.245'),
(8, 1, 'b9d14789ae21cbb2fc0d92f867033345ee6f6c5dccd6e07684360ff3f49cd261', NULL, '::ffff:127.0.0.1', '2026-08-20 00:25:18.419', NULL, '2026-07-21 00:25:18.421'),
(9, 1, 'ef8ec427fcfecb30a5c77fc80a1883155f2f447d0ac9e6a46fd3241ea90a547e', NULL, '::ffff:127.0.0.1', '2026-08-20 00:27:08.098', NULL, '2026-07-21 00:27:08.099'),
(10, 1, '6fe18cf47f93f808bd083d2a62f1e96ac112d69af53dc6fe361009694806d628', NULL, '::ffff:127.0.0.1', '2026-08-20 00:42:44.651', NULL, '2026-07-21 00:42:44.654'),
(11, 1, '2cc1ebdca554421e0f16831038678071f96b5e047f7e97631cd9de71c66c5f33', NULL, '::ffff:127.0.0.1', '2026-08-20 00:49:37.450', NULL, '2026-07-21 00:49:37.453'),
(12, 1, '3486361bc29f29b810d7c25fad9131a25ea589e71bdd4dd858f4adae6966385e', NULL, '::ffff:127.0.0.1', '2026-08-22 14:42:07.571', NULL, '2026-07-23 14:42:07.575'),
(13, 1, 'df7b89a937e226d581dc218a68f036bf4d671b4aa9fe658a3ac886a558442872', NULL, '::ffff:127.0.0.1', '2026-08-22 15:01:30.449', NULL, '2026-07-23 15:01:30.458'),
(14, 1, '00fe96fcecf146a8c147f77d8b381a4d0c49cbce8e2e2063fe38d5a923e2d445', NULL, '::ffff:127.0.0.1', '2026-08-22 16:07:21.126', NULL, '2026-07-23 16:07:21.135'),
(15, 1, '4653728334c03882c5542ea84da2108cb6667b3f91c438cd07c4222c891367ee', NULL, '::ffff:127.0.0.1', '2026-08-22 16:08:27.997', NULL, '2026-07-23 16:08:28.002'),
(16, 1, 'cafa32bf70a28a4cd48f4bfec3c31a40a870ab4538add6d67f3590f9ce27d99e', NULL, '::ffff:127.0.0.1', '2026-08-22 16:22:03.731', NULL, '2026-07-23 16:22:03.736'),
(17, 1, '1afad1116f0e9fc8fc3781505018219f3d6154e23ae68f2dd0d1a91471a5d239', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0', '::1', '2026-08-23 14:06:30.087', NULL, '2026-07-24 14:06:30.089'),
(18, 1, 'b06f211aee212ffb5e53114b368058535c257f717ace6d8220b9e6cfd60b4bb3', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0', '::1', '2026-08-23 14:19:34.816', NULL, '2026-07-24 14:19:34.818'),
(19, 1, '6d77a177abc58f5c377082c66494314cf19ccbb86a8b11438aec312e2ee5ae9c', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0', '::1', '2026-08-23 15:12:59.521', NULL, '2026-07-24 15:12:59.524'),
(20, 1, 'ee3e53263b1796083590ea0bb652d3e0c1f9da3c9e6fb394593acf4a1dea4792', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0', '::1', '2026-08-25 22:36:51.122', NULL, '2026-07-26 22:36:51.123'),
(21, 1, 'f7fbce64209638220e06d22e16d3e0e8fbed6f0f59a5d6054805ddde9fd3e415', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/150.0.0.0 Safari/537.36', '::1', '2026-08-25 23:58:07.450', NULL, '2026-07-26 23:58:07.451'),
(22, 1, '783c19a5704110994b502284b827def264649baf2f95e04025919a3a9d826829', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/150.0.0.0 Safari/537.36', '::1', '2026-08-26 00:09:46.937', NULL, '2026-07-27 00:09:46.939'),
(23, 1, 'd059ca56fa757bc449c82817ae30d9e2f4630e552477c22b27ef35f68f66e07a', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/150.0.0.0 Safari/537.36', '::1', '2026-08-26 00:18:19.542', NULL, '2026-07-27 00:18:19.543'),
(24, 1, 'ee6d0d75f997ff11027b858f517ca4ad106fcaf8afa72711260d44ab0df477af', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/150.0.0.0 Safari/537.36', '::1', '2026-08-26 00:21:55.888', NULL, '2026-07-27 00:21:55.889'),
(25, 1, 'cdaa5abd8cfd264343c46f0e4eee1aa92702f35ee504fd82ff39ff9252a40dd0', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/150.0.0.0 Safari/537.36', '::1', '2026-08-26 00:27:45.760', NULL, '2026-07-27 00:27:45.761'),
(26, 1, '4fcc9bc8f89064e526b01982b05605c79f0c887ee3207aac8fe8a70b55853df3', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0', '::1', '2026-08-26 03:39:35.741', NULL, '2026-07-27 03:39:35.743'),
(27, 1, 'fc9541155382f3ba4253f93f2420f2609dec316878c9e9dc197dca786b57285e', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8875', '::1', '2026-08-26 03:43:38.226', NULL, '2026-07-27 03:43:38.227'),
(28, 1, '9e1d346863e61aefdff5a2d4dcc087bf32731f2055bf5807ac4d02a517e28084', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '::1', '2026-08-26 03:44:03.576', NULL, '2026-07-27 03:44:03.576'),
(29, 1, '695f726f8492f41dde98fa0e66148defa61d31700ea3e47440bda393a122681b', 'node', '::1', '2026-08-26 03:49:19.215', NULL, '2026-07-27 03:49:19.216'),
(30, 1, '75d66ce8653d2faf87f9c14190b37c614a24654b4bee3fe7ad19335356377fd2', 'node', '::1', '2026-08-26 03:49:43.829', NULL, '2026-07-27 03:49:43.830'),
(31, 1, '6cf6bc9a92a1b68534c921c6c7f847b00fb1dc183308285cf6de80dfd5e61a68', NULL, '::ffff:127.0.0.1', '2026-09-04 00:11:17.462', NULL, '2026-08-05 00:11:17.463'),
(32, 1, 'd64b03eabfb0cd5ef9731a9095deb1a42dfb09032ec4aa2dff907d2f9862f0e8', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '::1', '2026-09-04 15:24:22.325', NULL, '2026-08-05 15:24:22.327'),
(33, 1, 'd710bdfb39a0f4ad4864ffcc7ec1f14edf7853f2bfa9326ff5e24415c627737f', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '::1', '2026-09-04 17:06:29.789', NULL, '2026-08-05 17:06:29.790'),
(34, 1, 'b6f2e6bccf38753bd629edd480abf2860ccda3f3374ee23c6727bdf95d89c738', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '::1', '2026-09-04 19:07:46.132', NULL, '2026-08-05 19:07:46.134'),
(35, 1, '26ec6f523ad4648a042ecc1eba9ee11332107a4234a8e6432fd761e10e6ecbee', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '::1', '2026-09-04 19:43:45.296', NULL, '2026-08-05 19:43:45.326'),
(36, 1, '9a3d689fbc556ceb335fec1c6635214dfa5d9d456acf025c9541184024379bb5', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '::1', '2026-09-04 19:43:46.598', NULL, '2026-08-05 19:43:46.599'),
(37, 1, '6c6f9eafd34a362d525b34a6679aa71f6b012e9b6adde4307444dff746af1202', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '::1', '2026-09-04 20:08:28.661', NULL, '2026-08-05 20:08:28.663'),
(38, 1, '93eef130c1b6172bf7d393df99df314635266d2821e69b87fc19453a0730ff5f', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '::1', '2026-09-04 20:48:21.777', NULL, '2026-08-05 20:48:21.779'),
(39, 1, '96541e641f6df392d85d9cabbce53bda748591be55f542f897a0c29eafd6669c', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '::1', '2026-09-04 21:03:32.806', NULL, '2026-08-05 21:03:32.808'),
(40, 1, 'cb683aeae5d063bbce87a9dc67fddd89f48e30ed967c6d0d32d3d91968e4cde9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '::1', '2026-09-05 21:28:18.384', NULL, '2026-08-06 21:28:18.391'),
(41, 1, '1824ed370aeff716d68323c9fe107be851a9760b36d12435adfe741732338b5e', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '::1', '2026-09-05 21:50:37.330', NULL, '2026-08-06 21:50:37.333'),
(42, 1, '573cb0e19182f121b5f2249d2f05bfda94bad6531a7f557a6013592f2f9ea1f1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '::1', '2026-09-05 23:09:05.425', NULL, '2026-08-06 23:09:05.427'),
(43, 1, '978c646c22d66dee84ecb805409c57baa65c4bd3142e2642f45a69dec7ae0bae', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '::1', '2026-09-06 10:14:34.172', NULL, '2026-08-07 10:14:34.174'),
(44, 1, '1b0c40ad03c252e06daf1e42050ace9cdca426e713f4dd09dd444d0b46812423', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '::1', '2026-09-07 14:26:00.106', NULL, '2026-08-08 14:26:00.109'),
(45, 1, '03bcd702eb924818265e24da165760c92ec8eb8c1eb04ea3133646e7fd3d0fc5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '::1', '2026-09-07 15:36:06.797', NULL, '2026-08-08 15:36:06.798'),
(46, 1, 'a3ee7984dc7e7f381b20bbe54616a892250c537fba612f6a794db9ecc6d9e204', 'curl/8.12.1', '::1', '2026-09-08 11:27:02.763', NULL, '2026-08-09 11:27:02.764'),
(47, 1, 'efc6532a69d475df5c49c1105702701497fe26bfe20af8ba36e4b20ee38e24d9', 'curl/8.12.1', '::1', '2026-09-08 11:27:17.819', NULL, '2026-08-09 11:27:17.819'),
(48, 1, 'c584ecd6d10b94520c71dd502bf04006c51ed82eab205f1713f9325413dd3768', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '::1', '2026-09-09 00:44:40.509', NULL, '2026-08-10 00:44:40.513');

-- --------------------------------------------------------

--
-- Table structure for table `user_warehouses`
--

DROP TABLE IF EXISTS `user_warehouses`;
CREATE TABLE IF NOT EXISTS `user_warehouses` (
  `user_id` bigint UNSIGNED NOT NULL,
  `warehouse_id` bigint UNSIGNED NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`,`warehouse_id`),
  KEY `fk_user_warehouses_warehouse` (`warehouse_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_current_stock`
-- (See below for the actual view)
--
DROP VIEW IF EXISTS `vw_current_stock`;
CREATE TABLE IF NOT EXISTS `vw_current_stock` (
`available_quantity` decimal(18,3)
,`barcode` varchar(100)
,`batch_id` bigint unsigned
,`expiry_date` date
,`location_code` varchar(100)
,`location_id` bigint unsigned
,`lot_number` varchar(100)
,`product_id` bigint unsigned
,`product_name` varchar(200)
,`product_variant_id` bigint unsigned
,`quantity` decimal(18,3)
,`reserved_quantity` decimal(18,3)
,`shelf_code` varchar(30)
,`sku` varchar(100)
,`stock_location_id` bigint unsigned
,`updated_at` datetime(3)
,`variant_name` varchar(200)
,`warehouse_code` varchar(50)
,`warehouse_id` bigint unsigned
,`warehouse_name` varchar(150)
,`zone_code` varchar(30)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_near_expiry_stock`
-- (See below for the actual view)
--
DROP VIEW IF EXISTS `vw_near_expiry_stock`;
CREATE TABLE IF NOT EXISTS `vw_near_expiry_stock` (
`available_quantity` decimal(18,3)
,`batch_id` bigint unsigned
,`days_until_expiry` int
,`expiry_date` date
,`location_code` varchar(100)
,`lot_number` varchar(100)
,`product_name` varchar(200)
,`product_variant_id` bigint unsigned
,`quantity` decimal(18,3)
,`sku` varchar(100)
,`warehouse_code` varchar(50)
,`warehouse_id` bigint unsigned
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_product_total_stock`
-- (See below for the actual view)
--
DROP VIEW IF EXISTS `vw_product_total_stock`;
CREATE TABLE IF NOT EXISTS `vw_product_total_stock` (
`max_stock_level` decimal(18,3)
,`min_stock_level` decimal(18,3)
,`product_name` varchar(200)
,`product_variant_id` bigint unsigned
,`sku` varchar(100)
,`total_available_quantity` decimal(40,3)
,`total_quantity` decimal(40,3)
,`total_reserved_quantity` decimal(40,3)
,`variant_name` varchar(200)
,`warehouse_code` varchar(50)
,`warehouse_id` bigint unsigned
);

-- --------------------------------------------------------

--
-- Table structure for table `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
CREATE TABLE IF NOT EXISTS `warehouses` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ward` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_user_id` bigint UNSIGNED DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `fk_warehouses_manager` (`manager_user_id`),
  KEY `idx_warehouses_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `warehouses`
--

INSERT INTO `warehouses` (`id`, `code`, `name`, `address_line`, `ward`, `district`, `province`, `manager_user_id`, `status`, `description`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'KHO-HCM-01', 'Kho trung tâm TP.HCM', '12 Nguyễn Văn Bảo', 'Phường 4', 'Gò Vấp', 'TP.HCM', 2, 'ACTIVE', 'Kho chính lưu hàng mẹ và bé', '2026-07-20 17:17:37.558', '2026-07-20 17:17:37.558', NULL),
(2, 'KHO-HCM-02', 'Kho chi nhánh Quận 7', '88 Nguyễn Thị Thập', 'Tân Phú', 'Quận 7', 'TP.HCM', 2, 'ACTIVE', 'Kho phụ phục vụ giao hàng nội thành', '2026-07-20 17:17:37.558', '2026-07-20 17:17:37.558', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `warehouse_locations`
--

DROP TABLE IF EXISTS `warehouse_locations`;
CREATE TABLE IF NOT EXISTS `warehouse_locations` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `shelf_id` bigint UNSIGNED NOT NULL,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `layer_no` int UNSIGNED NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_type` enum('STANDARD','COLD','BULKY','SECURE','DAMAGED','RETURN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STANDARD',
  `capacity_control_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `max_capacity` decimal(18,3) DEFAULT NULL,
  `current_capacity` decimal(18,3) NOT NULL DEFAULT '0.000',
  `status` enum('ACTIVE','INACTIVE','LOCKED','MAINTENANCE','FULL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `qr_code_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `uq_location_layer` (`shelf_id`,`layer_no`),
  UNIQUE KEY `qr_code_value` (`qr_code_value`),
  KEY `idx_locations_shelf_status` (`shelf_id`,`status`),
  KEY `idx_locations_type_status` (`location_type`,`status`)
) ;

--
-- Dumping data for table `warehouse_locations`
--

INSERT INTO `warehouse_locations` (`id`, `shelf_id`, `code`, `layer_no`, `name`, `location_type`, `capacity_control_enabled`, `max_capacity`, `current_capacity`, `status`, `qr_code_value`, `notes`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'HCM01-A-A01-01', 1, 'A01 tầng 1', 'STANDARD', 1, 500.000, 320.000, 'ACTIVE', 'QR-HCM01-A-A01-01', 'Sữa công thức', '2026-07-20 17:17:37.566', '2026-07-20 17:17:37.566', NULL),
(2, 1, 'HCM01-A-A01-02', 2, 'A01 tầng 2', 'STANDARD', 1, 500.000, 180.000, 'ACTIVE', 'QR-HCM01-A-A01-02', 'Bột ăn dặm', '2026-07-20 17:17:37.566', '2026-07-20 17:17:37.566', NULL),
(3, 2, 'HCM01-A-A02-01', 1, 'A02 tầng 1', 'STANDARD', 1, 450.000, 210.000, 'ACTIVE', 'QR-HCM01-A-A02-01', 'Sữa bột', '2026-07-20 17:17:37.566', '2026-07-20 17:17:37.566', NULL),
(4, 3, 'HCM01-B-B01-01', 1, 'B01 tầng 1', 'BULKY', 1, 800.000, 620.000, 'ACTIVE', 'QR-HCM01-B-B01-01', 'Tã bỉm', '2026-07-20 17:17:37.566', '2026-07-20 17:17:37.566', NULL),
(5, 4, 'HCM01-C-C01-01', 1, 'C01 tầng 1', 'STANDARD', 1, 300.000, 95.000, 'ACTIVE', 'QR-HCM01-C-C01-01', 'Đồ sơ sinh', '2026-07-20 17:17:37.566', '2026-07-20 17:17:37.566', NULL),
(6, 5, 'HCM02-A-A01-01', 1, 'A01 tầng 1 chi nhánh', 'STANDARD', 1, 350.000, 140.000, 'ACTIVE', 'QR-HCM02-A-A01-01', 'Hàng bán chạy', '2026-07-20 17:17:37.566', '2026-07-20 17:17:37.566', NULL),
(19, 16, 'HCM01-E-01-01', 1, 'Kệ 01 tầng 01', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-21 16:25:52.807', '2026-08-06 22:49:57.571', NULL),
(20, 17, 'HCM01-E-02-01', 1, 'Kệ 02 tầng 01', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-21 16:25:53.969', '2026-08-06 22:49:57.575', NULL),
(21, 18, 'HCM01-E-03-01', 1, 'Kệ 03 tầng 01', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-21 16:25:54.686', '2026-08-06 22:49:57.578', NULL),
(22, 16, 'HCM01-E-01-02', 2, 'Tầng 02', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-21 16:25:55.357', '2026-08-06 22:49:57.573', NULL),
(23, 17, 'HCM01-E-02-02', 2, 'Tầng 02', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-21 16:25:55.367', '2026-08-06 22:49:57.576', NULL),
(24, 18, 'HCM01-E-03-02', 2, 'Tầng 02', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-21 16:25:55.374', '2026-08-06 22:49:57.580', NULL),
(25, 16, 'HCM01-E-01-03', 3, 'Tầng 03', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-21 16:25:56.878', '2026-08-06 22:49:57.574', NULL),
(26, 17, 'HCM01-E-02-03', 3, 'Tầng 03', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-21 16:25:56.885', '2026-08-06 22:49:57.577', NULL),
(27, 18, 'HCM01-E-03-03', 3, 'Tầng 03', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-21 16:25:56.893', '2026-08-06 22:49:57.583', NULL),
(28, 19, 'HCM01-D-01-01', 1, 'Kệ 01 tầng 01', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-22 09:49:54.190', '2026-08-06 22:49:57.570', NULL),
(29, 1, 'HCM01-A-A01-03', 3, 'Tầng 03', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:09:28.309', '2026-08-06 22:49:57.540', '2026-07-26 22:15:25.345'),
(30, 2, 'HCM01-A-A02-03', 3, 'Tầng 03', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:09:28.330', '2026-08-06 22:49:57.554', '2026-07-26 22:15:25.355'),
(31, 1, 'HCM01-A-A01-04', 4, 'Tầng 04', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:09:29.730', '2026-08-06 22:49:57.541', '2026-07-26 22:15:24.196'),
(32, 2, 'HCM01-A-A02-04', 4, 'Tầng 04', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:09:29.744', '2026-08-06 22:49:57.556', '2026-07-26 22:15:24.209'),
(33, 1, 'HCM01-A-A01-05', 5, 'Tầng 05', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:09:30.193', '2026-08-06 22:49:57.543', '2026-07-26 22:15:21.737'),
(34, 2, 'HCM01-A-A02-05', 5, 'Tầng 05', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:09:30.204', '2026-08-06 22:49:57.558', '2026-07-26 22:15:21.753'),
(35, 20, 'HCM01-A-01-01', 1, 'Kệ 01 tầng 01', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:09:33.862', '2026-08-06 22:49:57.458', '2026-07-26 22:15:05.458'),
(36, 20, 'HCM01-A-01-02', 2, 'Kệ 01 tầng 02', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:09:33.863', '2026-08-06 22:49:57.459', '2026-07-26 22:15:05.458'),
(37, 20, 'HCM01-A-01-03', 3, 'Kệ 01 tầng 03', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:09:33.864', '2026-08-06 22:49:57.460', '2026-07-26 22:15:05.458'),
(38, 20, 'HCM01-A-01-04', 4, 'Kệ 01 tầng 04', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:09:33.865', '2026-08-06 22:49:57.462', '2026-07-26 22:15:05.458'),
(39, 20, 'HCM01-A-01-05', 5, 'Kệ 01 tầng 05', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:09:33.867', '2026-08-06 22:49:57.465', '2026-07-26 22:15:05.458'),
(40, 21, 'HCM01-A-02-01', 1, 'Kệ 02 tầng 01', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-26 22:09:36.898', '2026-08-06 22:49:57.477', NULL),
(41, 21, 'HCM01-A-02-02', 2, 'Kệ 02 tầng 02', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-26 22:09:36.899', '2026-08-06 22:49:57.480', NULL),
(42, 21, 'HCM01-A-02-03', 3, 'Kệ 02 tầng 03', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:09:36.900', '2026-08-06 22:49:57.483', '2026-07-26 22:15:25.369'),
(43, 21, 'HCM01-A-02-04', 4, 'Kệ 02 tầng 04', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:09:36.902', '2026-08-06 22:49:57.487', '2026-07-26 22:15:24.218'),
(44, 21, 'HCM01-A-02-05', 5, 'Kệ 02 tầng 05', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:09:36.903', '2026-08-06 22:49:57.489', '2026-07-26 22:15:21.767'),
(45, 22, 'HCM01-A-03-01', 1, 'Kệ 03 tầng 01', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-26 22:10:11.280', '2026-08-06 22:49:57.516', NULL),
(46, 22, 'HCM01-A-03-02', 2, 'Kệ 03 tầng 02', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-26 22:10:11.280', '2026-08-06 22:49:57.519', NULL),
(47, 22, 'HCM01-A-03-03', 3, 'Kệ 03 tầng 03', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:10:11.281', '2026-08-06 22:49:57.522', '2026-07-26 22:15:25.383'),
(48, 22, 'HCM01-A-03-04', 4, 'Kệ 03 tầng 04', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:10:11.281', '2026-08-06 22:49:57.523', '2026-07-26 22:15:24.230'),
(49, 22, 'HCM01-A-03-05', 5, 'Kệ 03 tầng 05', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:10:11.282', '2026-08-06 22:49:57.524', '2026-07-26 22:15:21.785'),
(50, 20, 'HCM01-A-01-06', 6, 'Tầng 06', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:57.093', '2026-08-06 22:49:57.468', '2026-07-26 22:15:05.458'),
(51, 21, 'HCM01-A-02-06', 6, 'Tầng 06', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:57.104', '2026-08-06 22:49:57.491', '2026-07-26 22:15:14.122'),
(52, 22, 'HCM01-A-03-06', 6, 'Tầng 06', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:57.112', '2026-08-06 22:49:57.525', '2026-07-26 22:15:14.132'),
(53, 1, 'HCM01-A-A01-06', 6, 'Tầng 06', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:57.121', '2026-08-06 22:49:57.544', '2026-07-26 22:15:14.097'),
(54, 2, 'HCM01-A-A02-06', 6, 'Tầng 06', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:57.129', '2026-08-06 22:49:57.559', '2026-07-26 22:15:14.111'),
(55, 20, 'HCM01-A-01-07', 7, 'Tầng 07', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:57.721', '2026-08-06 22:49:57.469', '2026-07-26 22:15:05.458'),
(56, 21, 'HCM01-A-02-07', 7, 'Tầng 07', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:57.735', '2026-08-06 22:49:57.492', '2026-07-26 22:15:13.829'),
(57, 22, 'HCM01-A-03-07', 7, 'Tầng 07', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:57.741', '2026-08-06 22:49:57.527', '2026-07-26 22:15:13.847'),
(58, 1, 'HCM01-A-A01-07', 7, 'Tầng 07', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:57.747', '2026-08-06 22:49:57.545', '2026-07-26 22:15:13.795'),
(59, 2, 'HCM01-A-A02-07', 7, 'Tầng 07', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:57.753', '2026-08-06 22:49:57.561', '2026-07-26 22:15:13.814'),
(60, 20, 'HCM01-A-01-08', 8, 'Tầng 08', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.159', '2026-08-06 22:49:57.471', '2026-07-26 22:15:05.458'),
(61, 21, 'HCM01-A-02-08', 8, 'Tầng 08', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.172', '2026-08-06 22:49:57.494', '2026-07-26 22:15:12.998'),
(62, 22, 'HCM01-A-03-08', 8, 'Tầng 08', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.188', '2026-08-06 22:49:57.528', '2026-07-26 22:15:13.014'),
(63, 1, 'HCM01-A-A01-08', 8, 'Tầng 08', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.203', '2026-08-06 22:49:57.547', '2026-07-26 22:15:12.962'),
(64, 2, 'HCM01-A-A02-08', 8, 'Tầng 08', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.212', '2026-08-06 22:49:57.562', '2026-07-26 22:15:12.984'),
(65, 20, 'HCM01-A-01-09', 9, 'Tầng 09', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.473', '2026-08-06 22:49:57.472', '2026-07-26 22:15:05.458'),
(66, 21, 'HCM01-A-02-09', 9, 'Tầng 09', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.484', '2026-08-06 22:49:57.497', '2026-07-26 22:15:14.517'),
(67, 22, 'HCM01-A-03-09', 9, 'Tầng 09', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.499', '2026-08-06 22:49:57.530', '2026-07-26 22:15:14.530'),
(68, 1, 'HCM01-A-A01-09', 9, 'Tầng 09', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.514', '2026-08-06 22:49:57.549', '2026-07-26 22:15:14.496'),
(69, 2, 'HCM01-A-A02-09', 9, 'Tầng 09', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.522', '2026-08-06 22:49:57.565', '2026-07-26 22:15:14.509'),
(70, 20, 'HCM01-A-01-10', 10, 'Tầng 10', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.787', '2026-08-06 22:49:57.473', '2026-07-26 22:15:05.458'),
(71, 21, 'HCM01-A-02-10', 10, 'Tầng 10', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.794', '2026-08-06 22:49:57.507', '2026-07-26 22:15:15.492'),
(72, 22, 'HCM01-A-03-10', 10, 'Tầng 10', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.804', '2026-08-06 22:49:57.532', '2026-07-26 22:15:15.504'),
(73, 1, 'HCM01-A-A01-10', 10, 'Tầng 10', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.809', '2026-08-06 22:49:57.550', '2026-07-26 22:15:15.464'),
(74, 2, 'HCM01-A-A02-10', 10, 'Tầng 10', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.813', '2026-08-06 22:49:57.567', '2026-07-26 22:15:15.479'),
(75, 20, 'HCM01-A-01-11', 11, 'Tầng 11', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.947', '2026-08-06 22:49:57.475', '2026-07-26 22:15:05.458'),
(76, 21, 'HCM01-A-02-11', 11, 'Tầng 11', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.954', '2026-08-06 22:49:57.510', '2026-07-26 22:15:19.890'),
(77, 22, 'HCM01-A-03-11', 11, 'Tầng 11', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.962', '2026-08-06 22:49:57.534', '2026-07-26 22:15:19.904'),
(78, 1, 'HCM01-A-A01-11', 11, 'Tầng 11', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.970', '2026-08-06 22:49:57.552', '2026-07-26 22:15:19.853'),
(79, 2, 'HCM01-A-A02-11', 11, 'Tầng 11', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:58.976', '2026-08-06 22:49:57.568', '2026-07-26 22:15:19.873'),
(80, 20, 'HCM01-A-01-12', 12, 'Tầng 12', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:59.096', '2026-08-06 22:49:57.476', '2026-07-26 22:15:05.458'),
(81, 21, 'HCM01-A-02-12', 12, 'Tầng 12', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:59.116', '2026-08-06 22:49:57.514', '2026-07-26 22:15:18.717'),
(82, 22, 'HCM01-A-03-12', 12, 'Tầng 12', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:59.130', '2026-08-06 22:49:57.535', '2026-07-26 22:15:18.728'),
(83, 1, 'HCM01-A-A01-12', 12, 'Tầng 12', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:59.142', '2026-08-06 22:49:57.553', '2026-07-26 22:15:18.685'),
(84, 2, 'HCM01-A-A02-12', 12, 'Tầng 12', 'STANDARD', 0, NULL, 0.000, 'INACTIVE', NULL, NULL, '2026-07-26 22:14:59.152', '2026-08-06 22:49:57.570', '2026-07-26 22:15:18.701'),
(85, 23, 'HCM01-A-04-01', 1, 'Kệ 04 tầng 01', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-26 22:15:30.004', '2026-08-06 22:49:57.537', NULL),
(86, 23, 'HCM01-A-04-02', 2, 'Kệ 04 tầng 02', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-07-26 22:15:30.006', '2026-08-06 22:49:57.538', NULL),
(93, 29, 'HCM02-A-A02-01', 1, 'A02 tầng 1 chi nhánh', 'STANDARD', 1, 350.000, 0.000, 'ACTIVE', 'QR-HCM02-A-A02-01', 'Ô trống chi nhánh', '2026-08-05 14:31:02.792', '2026-08-05 14:31:02.792', NULL),
(94, 30, 'HCM02-B-B01-01', 1, 'B01 tầng 1 chi nhánh', 'BULKY', 1, 500.000, 0.000, 'ACTIVE', 'QR-HCM02-B-B01-01', 'Khu hàng cồng kềnh', '2026-08-05 14:31:02.792', '2026-08-05 14:31:02.792', NULL),
(106, 39, 'HCM02-C-01-01', 1, 'Kệ 01 tầng 01', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.391', '2026-08-06 22:49:57.585', NULL),
(107, 39, 'HCM02-C-01-02', 2, 'Kệ 01 tầng 02', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.396', '2026-08-06 22:49:57.587', NULL),
(108, 39, 'HCM02-C-01-03', 3, 'Kệ 01 tầng 03', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.398', '2026-08-06 22:49:57.588', NULL),
(109, 39, 'HCM02-C-01-04', 4, 'Kệ 01 tầng 04', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.401', '2026-08-06 22:49:57.588', NULL),
(110, 40, 'HCM02-C-02-01', 1, 'Kệ 02 tầng 01', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.404', '2026-08-06 22:49:57.590', NULL),
(111, 40, 'HCM02-C-02-02', 2, 'Kệ 02 tầng 02', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.406', '2026-08-06 22:49:57.591', NULL),
(112, 40, 'HCM02-C-02-03', 3, 'Kệ 02 tầng 03', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.409', '2026-08-06 22:49:57.592', NULL),
(113, 40, 'HCM02-C-02-04', 4, 'Kệ 02 tầng 04', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.412', '2026-08-06 22:49:57.592', NULL),
(114, 41, 'HCM02-C-03-01', 1, 'Kệ 03 tầng 01', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.415', '2026-08-06 22:49:57.594', NULL),
(115, 41, 'HCM02-C-03-02', 2, 'Kệ 03 tầng 02', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.418', '2026-08-06 22:49:57.595', NULL),
(116, 41, 'HCM02-C-03-03', 3, 'Kệ 03 tầng 03', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.423', '2026-08-06 22:49:57.597', NULL),
(117, 41, 'HCM02-C-03-04', 4, 'Kệ 03 tầng 04', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.426', '2026-08-06 22:49:57.599', NULL),
(118, 42, 'HCM02-C-04-01', 1, 'Kệ 04 tầng 01', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.429', '2026-08-06 22:49:57.604', NULL),
(119, 42, 'HCM02-C-04-02', 2, 'Kệ 04 tầng 02', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.432', '2026-08-06 22:49:57.605', NULL),
(120, 42, 'HCM02-C-04-03', 3, 'Kệ 04 tầng 03', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.435', '2026-08-06 22:49:57.607', NULL),
(121, 42, 'HCM02-C-04-04', 4, 'Kệ 04 tầng 04', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:10:08.438', '2026-08-06 22:49:57.608', NULL),
(122, 39, 'HCM02-C-01-05', 5, 'Kệ 01 tầng 05', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:53:19.614', '2026-08-06 22:49:57.589', NULL),
(123, 40, 'HCM02-C-02-05', 5, 'Kệ 02 tầng 05', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:53:19.646', '2026-08-06 22:49:57.593', NULL),
(124, 41, 'HCM02-C-03-05', 5, 'Kệ 03 tầng 05', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:53:19.654', '2026-08-06 22:49:57.601', NULL),
(125, 42, 'HCM02-C-04-05', 5, 'Kệ 04 tầng 05', 'STANDARD', 0, NULL, 0.000, 'ACTIVE', NULL, NULL, '2026-08-05 19:53:19.663', '2026-08-06 22:49:57.609', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `warehouse_shelves`
--

DROP TABLE IF EXISTS `warehouse_shelves`;
CREATE TABLE IF NOT EXISTS `warehouse_shelves` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `zone_id` bigint UNSIGNED NOT NULL,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE','MAINTENANCE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `sort_order` int UNSIGNED NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_shelf_code` (`zone_id`,`code`),
  KEY `idx_shelves_zone_status` (`zone_id`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `warehouse_shelves`
--

INSERT INTO `warehouse_shelves` (`id`, `zone_id`, `code`, `name`, `status`, `sort_order`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'A01', 'Kệ A01', 'ACTIVE', 1, '2026-07-20 17:17:37.563', '2026-07-20 17:17:37.563', NULL),
(2, 1, 'A02', 'Kệ A02', 'ACTIVE', 2, '2026-07-20 17:17:37.563', '2026-07-20 17:17:37.563', NULL),
(3, 2, 'B01', 'Kệ B01', 'ACTIVE', 1, '2026-07-20 17:17:37.563', '2026-07-20 17:17:37.563', NULL),
(4, 3, 'C01', 'Kệ C01', 'ACTIVE', 1, '2026-07-20 17:17:37.563', '2026-07-20 17:17:37.563', NULL),
(5, 4, 'A01', 'Kệ A01 chi nhánh', 'ACTIVE', 1, '2026-07-20 17:17:37.563', '2026-07-20 17:17:37.563', NULL),
(16, 13, '01', 'Kệ 01', 'ACTIVE', 1, '2026-07-21 16:25:52.805', '2026-07-21 16:25:52.805', NULL),
(17, 13, '02', 'Kệ 02', 'ACTIVE', 2, '2026-07-21 16:25:53.962', '2026-07-21 16:25:53.962', NULL),
(18, 13, '03', 'Kệ 03', 'ACTIVE', 3, '2026-07-21 16:25:54.681', '2026-07-21 16:25:54.681', NULL),
(19, 14, '01', 'Kệ 01', 'ACTIVE', 1, '2026-07-22 09:49:54.187', '2026-07-22 09:49:54.187', NULL),
(20, 1, '01', 'Kệ 01', 'ACTIVE', 3, '2026-07-26 22:09:33.861', '2026-07-26 22:09:33.861', NULL),
(21, 1, '02', 'Kệ 02', 'ACTIVE', 4, '2026-07-26 22:09:36.895', '2026-07-26 22:09:36.895', NULL),
(22, 1, '03', 'Kệ 03', 'ACTIVE', 5, '2026-07-26 22:10:11.277', '2026-07-26 22:10:11.277', NULL),
(23, 1, '04', 'Kệ 04', 'ACTIVE', 6, '2026-07-26 22:15:30.002', '2026-07-26 22:15:30.002', NULL),
(29, 4, 'A02', 'Kệ A02 chi nhánh', 'ACTIVE', 2, '2026-08-05 14:31:02.787', '2026-08-05 14:31:02.787', NULL),
(30, 19, 'B01', 'Kệ B01 chi nhánh', 'ACTIVE', 1, '2026-08-05 14:31:02.787', '2026-08-05 14:31:02.787', NULL),
(39, 25, '01', 'Kệ 01', 'ACTIVE', 1, '2026-08-05 19:10:08.378', '2026-08-05 19:10:08.378', NULL),
(40, 25, '02', 'Kệ 02', 'ACTIVE', 2, '2026-08-05 19:10:08.383', '2026-08-05 19:10:08.383', NULL),
(41, 25, '03', 'Kệ 03', 'ACTIVE', 3, '2026-08-05 19:10:08.384', '2026-08-05 19:10:08.384', NULL),
(42, 25, '04', 'Kệ 04', 'ACTIVE', 4, '2026-08-05 19:10:08.386', '2026-08-05 19:10:08.386', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `warehouse_zones`
--

DROP TABLE IF EXISTS `warehouse_zones`;
CREATE TABLE IF NOT EXISTS `warehouse_zones` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `warehouse_id` bigint UNSIGNED NOT NULL,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','MAINTENANCE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `sort_order` int UNSIGNED NOT NULL DEFAULT '0',
  `grid_row` int DEFAULT NULL,
  `grid_col` int DEFAULT NULL,
  `grid_size` int UNSIGNED DEFAULT NULL,
  `grid_orientation` enum('HORIZONTAL','VERTICAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HORIZONTAL',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_zone_code` (`warehouse_id`,`code`),
  KEY `idx_zones_warehouse_status` (`warehouse_id`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `warehouse_zones`
--

INSERT INTO `warehouse_zones` (`id`, `warehouse_id`, `code`, `name`, `description`, `status`, `sort_order`, `grid_row`, `grid_col`, `grid_size`, `grid_orientation`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'A', 'Khu A - Sữa và bột ăn dặm', 'Hàng khô, ưu tiên hạn sử dụng gần', 'ACTIVE', 1, NULL, NULL, NULL, 'HORIZONTAL', '2026-07-20 17:17:37.561', '2026-08-05 15:31:08.810', NULL),
(2, 1, 'B', 'Khu B - Tã và vệ sinh', 'Hàng cồng kềnh, xuất nhanh', 'ACTIVE', 2, NULL, NULL, NULL, 'HORIZONTAL', '2026-07-20 17:17:37.561', '2026-08-05 15:31:08.810', NULL),
(3, 1, 'C', 'Khu C - Đồ sơ sinh', 'Đồ dùng trẻ em và phụ kiện', 'ACTIVE', 3, NULL, NULL, NULL, 'HORIZONTAL', '2026-07-20 17:17:37.561', '2026-08-05 15:31:08.810', NULL),
(4, 2, 'A', 'Khu A - Hàng bán chạy', 'Khu picking chi nhánh', 'ACTIVE', 1, 3, 1, 2, 'HORIZONTAL', '2026-07-20 17:17:37.561', '2026-08-05 20:40:36.540', NULL),
(13, 1, 'E', 'Khu vực E', NULL, 'ACTIVE', 4, 4, 5, 3, 'HORIZONTAL', '2026-07-21 16:25:52.798', '2026-08-05 15:24:49.574', NULL),
(14, 1, 'D', 'Khu vực D', NULL, 'ACTIVE', 5, 3, 5, 1, 'HORIZONTAL', '2026-07-22 09:49:54.179', '2026-08-05 15:24:51.919', NULL),
(19, 2, 'B', 'Khu B - Dự trữ chi nhánh', 'Khu lưu trữ bổ sung chi nhánh Q.7', 'ACTIVE', 2, 3, 2, 1, 'HORIZONTAL', '2026-08-05 14:31:02.783', '2026-08-05 15:24:34.976', NULL),
(25, 2, 'C', 'Khu C', NULL, 'ACTIVE', 3, 2, 5, 4, 'VERTICAL', '2026-08-05 19:10:08.375', '2026-08-05 20:48:37.771', NULL);

-- --------------------------------------------------------

--
-- Structure for view `vw_current_stock`
--
DROP TABLE IF EXISTS `vw_current_stock`;

DROP VIEW IF EXISTS `vw_current_stock`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_current_stock`  AS SELECT `sl`.`id` AS `stock_location_id`, `w`.`id` AS `warehouse_id`, `w`.`code` AS `warehouse_code`, `w`.`name` AS `warehouse_name`, `wz`.`code` AS `zone_code`, `ws`.`code` AS `shelf_code`, `wl`.`id` AS `location_id`, `wl`.`code` AS `location_code`, `p`.`id` AS `product_id`, `p`.`name` AS `product_name`, `pv`.`id` AS `product_variant_id`, `pv`.`sku` AS `sku`, `pv`.`barcode` AS `barcode`, `pv`.`variant_name` AS `variant_name`, `pb`.`id` AS `batch_id`, `pb`.`lot_number` AS `lot_number`, `pb`.`expiry_date` AS `expiry_date`, `sl`.`quantity` AS `quantity`, `sl`.`reserved_quantity` AS `reserved_quantity`, `sl`.`available_quantity` AS `available_quantity`, `sl`.`updated_at` AS `updated_at` FROM (((((((`stock_locations` `sl` join `product_variants` `pv` on((`pv`.`id` = `sl`.`product_variant_id`))) join `products` `p` on((`p`.`id` = `pv`.`product_id`))) join `warehouse_locations` `wl` on((`wl`.`id` = `sl`.`location_id`))) join `warehouse_shelves` `ws` on((`ws`.`id` = `wl`.`shelf_id`))) join `warehouse_zones` `wz` on((`wz`.`id` = `ws`.`zone_id`))) join `warehouses` `w` on((`w`.`id` = `wz`.`warehouse_id`))) left join `product_batches` `pb` on((`pb`.`id` = `sl`.`batch_id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `vw_near_expiry_stock`
--
DROP TABLE IF EXISTS `vw_near_expiry_stock`;

DROP VIEW IF EXISTS `vw_near_expiry_stock`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_near_expiry_stock`  AS SELECT `w`.`id` AS `warehouse_id`, `w`.`code` AS `warehouse_code`, `pv`.`id` AS `product_variant_id`, `pv`.`sku` AS `sku`, `p`.`name` AS `product_name`, `pb`.`id` AS `batch_id`, `pb`.`lot_number` AS `lot_number`, `pb`.`expiry_date` AS `expiry_date`, (to_days(`pb`.`expiry_date`) - to_days(curdate())) AS `days_until_expiry`, `wl`.`code` AS `location_code`, `sl`.`quantity` AS `quantity`, `sl`.`available_quantity` AS `available_quantity` FROM (((((((`stock_locations` `sl` join `product_variants` `pv` on((`pv`.`id` = `sl`.`product_variant_id`))) join `products` `p` on((`p`.`id` = `pv`.`product_id`))) join `product_batches` `pb` on((`pb`.`id` = `sl`.`batch_id`))) join `warehouse_locations` `wl` on((`wl`.`id` = `sl`.`location_id`))) join `warehouse_shelves` `ws` on((`ws`.`id` = `wl`.`shelf_id`))) join `warehouse_zones` `wz` on((`wz`.`id` = `ws`.`zone_id`))) join `warehouses` `w` on((`w`.`id` = `wz`.`warehouse_id`))) WHERE ((`sl`.`quantity` > 0) AND (`pb`.`expiry_date` is not null) AND (`pb`.`expiry_date` >= curdate()) AND (`pb`.`expiry_date` <= (curdate() + interval 60 day))) ;

-- --------------------------------------------------------

--
-- Structure for view `vw_product_total_stock`
--
DROP TABLE IF EXISTS `vw_product_total_stock`;

DROP VIEW IF EXISTS `vw_product_total_stock`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_product_total_stock`  AS SELECT `w`.`id` AS `warehouse_id`, `w`.`code` AS `warehouse_code`, `pv`.`id` AS `product_variant_id`, `pv`.`sku` AS `sku`, `p`.`name` AS `product_name`, `pv`.`variant_name` AS `variant_name`, sum(`sl`.`quantity`) AS `total_quantity`, sum(`sl`.`reserved_quantity`) AS `total_reserved_quantity`, sum(`sl`.`available_quantity`) AS `total_available_quantity`, `pv`.`min_stock_level` AS `min_stock_level`, `pv`.`max_stock_level` AS `max_stock_level` FROM ((((((`stock_locations` `sl` join `product_variants` `pv` on((`pv`.`id` = `sl`.`product_variant_id`))) join `products` `p` on((`p`.`id` = `pv`.`product_id`))) join `warehouse_locations` `wl` on((`wl`.`id` = `sl`.`location_id`))) join `warehouse_shelves` `ws` on((`ws`.`id` = `wl`.`shelf_id`))) join `warehouse_zones` `wz` on((`wz`.`id` = `ws`.`zone_id`))) join `warehouses` `w` on((`w`.`id` = `wz`.`warehouse_id`))) GROUP BY `w`.`id`, `w`.`code`, `pv`.`id`, `pv`.`sku`, `p`.`name`, `pv`.`variant_name`, `pv`.`min_stock_level`, `pv`.`max_stock_level` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `products`
--
ALTER TABLE `products` ADD FULLTEXT KEY `ftx_products_name_description` (`name`,`description`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `alerts`
--
ALTER TABLE `alerts`
  ADD CONSTRAINT `fk_alerts_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_alerts_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`),
  ADD CONSTRAINT `fk_alerts_location` FOREIGN KEY (`location_id`) REFERENCES `warehouse_locations` (`id`),
  ADD CONSTRAINT `fk_alerts_resolved_by` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_alerts_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`),
  ADD CONSTRAINT `fk_alerts_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`);

--
-- Constraints for table `app_settings`
--
ALTER TABLE `app_settings`
  ADD CONSTRAINT `fk_app_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `attachments`
--
ALTER TABLE `attachments`
  ADD CONSTRAINT `fk_attachments_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`);

--
-- Constraints for table `goods_issues`
--
ALTER TABLE `goods_issues`
  ADD CONSTRAINT `fk_goods_issues_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_goods_issues_confirmed_by` FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_goods_issues_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_goods_issues_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`);

--
-- Constraints for table `goods_issue_items`
--
ALTER TABLE `goods_issue_items`
  ADD CONSTRAINT `fk_goods_issue_items_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`),
  ADD CONSTRAINT `fk_goods_issue_items_issue` FOREIGN KEY (`goods_issue_id`) REFERENCES `goods_issues` (`id`),
  ADD CONSTRAINT `fk_goods_issue_items_location` FOREIGN KEY (`location_id`) REFERENCES `warehouse_locations` (`id`),
  ADD CONSTRAINT `fk_goods_issue_items_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`);

--
-- Constraints for table `goods_receipts`
--
ALTER TABLE `goods_receipts`
  ADD CONSTRAINT `fk_goods_receipts_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_goods_receipts_confirmed_by` FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_goods_receipts_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_goods_receipts_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  ADD CONSTRAINT `fk_goods_receipts_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`);

--
-- Constraints for table `goods_receipt_items`
--
ALTER TABLE `goods_receipt_items`
  ADD CONSTRAINT `fk_goods_receipt_items_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`),
  ADD CONSTRAINT `fk_goods_receipt_items_location` FOREIGN KEY (`location_id`) REFERENCES `warehouse_locations` (`id`),
  ADD CONSTRAINT `fk_goods_receipt_items_receipt` FOREIGN KEY (`goods_receipt_id`) REFERENCES `goods_receipts` (`id`),
  ADD CONSTRAINT `fk_goods_receipt_items_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`);

--
-- Constraints for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD CONSTRAINT `fk_inventory_transactions_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_inventory_transactions_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`),
  ADD CONSTRAINT `fk_inventory_transactions_destination_location` FOREIGN KEY (`destination_location_id`) REFERENCES `warehouse_locations` (`id`),
  ADD CONSTRAINT `fk_inventory_transactions_performed_by` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_inventory_transactions_reversal` FOREIGN KEY (`reversal_of_transaction_id`) REFERENCES `inventory_transactions` (`id`),
  ADD CONSTRAINT `fk_inventory_transactions_source_location` FOREIGN KEY (`source_location_id`) REFERENCES `warehouse_locations` (`id`),
  ADD CONSTRAINT `fk_inventory_transactions_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`),
  ADD CONSTRAINT `fk_inventory_transactions_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `fk_password_reset_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`),
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Constraints for table `product_batches`
--
ALTER TABLE `product_batches`
  ADD CONSTRAINT `fk_batches_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  ADD CONSTRAINT `fk_batches_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`);

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `fk_variants_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`);

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`),
  ADD CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Constraints for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  ADD CONSTRAINT `fk_stock_adjustments_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_stock_adjustments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_stock_adjustments_rejected_by` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_stock_adjustments_stock_count` FOREIGN KEY (`stock_count_id`) REFERENCES `stock_counts` (`id`),
  ADD CONSTRAINT `fk_stock_adjustments_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_stock_adjustments_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`);

--
-- Constraints for table `stock_adjustment_items`
--
ALTER TABLE `stock_adjustment_items`
  ADD CONSTRAINT `fk_stock_adjustment_items_adjustment` FOREIGN KEY (`stock_adjustment_id`) REFERENCES `stock_adjustments` (`id`),
  ADD CONSTRAINT `fk_stock_adjustment_items_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`),
  ADD CONSTRAINT `fk_stock_adjustment_items_location` FOREIGN KEY (`location_id`) REFERENCES `warehouse_locations` (`id`),
  ADD CONSTRAINT `fk_stock_adjustment_items_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`);

--
-- Constraints for table `stock_counts`
--
ALTER TABLE `stock_counts`
  ADD CONSTRAINT `fk_stock_counts_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_stock_counts_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_stock_counts_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_stock_counts_rejected_by` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_stock_counts_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_stock_counts_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`);

--
-- Constraints for table `stock_count_items`
--
ALTER TABLE `stock_count_items`
  ADD CONSTRAINT `fk_stock_count_items_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`),
  ADD CONSTRAINT `fk_stock_count_items_count` FOREIGN KEY (`stock_count_id`) REFERENCES `stock_counts` (`id`),
  ADD CONSTRAINT `fk_stock_count_items_counted_by` FOREIGN KEY (`counted_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_stock_count_items_location` FOREIGN KEY (`location_id`) REFERENCES `warehouse_locations` (`id`),
  ADD CONSTRAINT `fk_stock_count_items_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`);

--
-- Constraints for table `stock_locations`
--
ALTER TABLE `stock_locations`
  ADD CONSTRAINT `fk_stock_locations_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`),
  ADD CONSTRAINT `fk_stock_locations_location` FOREIGN KEY (`location_id`) REFERENCES `warehouse_locations` (`id`),
  ADD CONSTRAINT `fk_stock_locations_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`);

--
-- Constraints for table `stock_transfers`
--
ALTER TABLE `stock_transfers`
  ADD CONSTRAINT `fk_stock_transfers_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_stock_transfers_confirmed_by` FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_stock_transfers_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_stock_transfers_destination_warehouse` FOREIGN KEY (`destination_warehouse_id`) REFERENCES `warehouses` (`id`),
  ADD CONSTRAINT `fk_stock_transfers_source_warehouse` FOREIGN KEY (`source_warehouse_id`) REFERENCES `warehouses` (`id`);

--
-- Constraints for table `stock_transfer_items`
--
ALTER TABLE `stock_transfer_items`
  ADD CONSTRAINT `fk_stock_transfer_items_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`),
  ADD CONSTRAINT `fk_stock_transfer_items_destination_location` FOREIGN KEY (`destination_location_id`) REFERENCES `warehouse_locations` (`id`),
  ADD CONSTRAINT `fk_stock_transfer_items_source_location` FOREIGN KEY (`source_location_id`) REFERENCES `warehouse_locations` (`id`),
  ADD CONSTRAINT `fk_stock_transfer_items_transfer` FOREIGN KEY (`stock_transfer_id`) REFERENCES `stock_transfers` (`id`),
  ADD CONSTRAINT `fk_stock_transfer_items_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`);

--
-- Constraints for table `supplier_products`
--
ALTER TABLE `supplier_products`
  ADD CONSTRAINT `fk_supplier_products_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  ADD CONSTRAINT `fk_supplier_products_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `user_warehouses`
--
ALTER TABLE `user_warehouses`
  ADD CONSTRAINT `fk_user_warehouses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_user_warehouses_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`);

--
-- Constraints for table `warehouses`
--
ALTER TABLE `warehouses`
  ADD CONSTRAINT `fk_warehouses_manager` FOREIGN KEY (`manager_user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `warehouse_locations`
--
ALTER TABLE `warehouse_locations`
  ADD CONSTRAINT `fk_locations_shelf` FOREIGN KEY (`shelf_id`) REFERENCES `warehouse_shelves` (`id`);

--
-- Constraints for table `warehouse_shelves`
--
ALTER TABLE `warehouse_shelves`
  ADD CONSTRAINT `fk_shelves_zone` FOREIGN KEY (`zone_id`) REFERENCES `warehouse_zones` (`id`);

--
-- Constraints for table `warehouse_zones`
--
ALTER TABLE `warehouse_zones`
  ADD CONSTRAINT `fk_zones_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
