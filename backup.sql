mysqldump: [Warning] Using a password on the command line interface can be insecure.
-- MySQL dump 10.13  Distrib 8.4.10, for Linux (x86_64)
--
-- Host: localhost    Database: pos_kasir
-- ------------------------------------------------------
-- Server version	8.4.10-0ubuntu0.26.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
INSERT INTO `cache` VALUES ('laravel-cache-0685b1d679b0c1545e3bc515ff934b34922b83b2','i:1;',1784901791),('laravel-cache-0685b1d679b0c1545e3bc515ff934b34922b83b2:timer','i:1784901791;',1784901791),('laravel-cache-0e449dd14b24f6a7e2b2ea24eb07a0329a20b0e7','i:1;',1784823671),('laravel-cache-0e449dd14b24f6a7e2b2ea24eb07a0329a20b0e7:timer','i:1784823671;',1784823671),('laravel-cache-2e50ad9e1cb07d807b69b164f111e460c4837fcd','i:1;',1784819759),('laravel-cache-2e50ad9e1cb07d807b69b164f111e460c4837fcd:timer','i:1784819759;',1784819759),('laravel-cache-424f74a6a7ed4d4ed4761507ebcd209a6ef0937b','i:1;',1784641231),('laravel-cache-424f74a6a7ed4d4ed4761507ebcd209a6ef0937b:timer','i:1784641231;',1784641231),('laravel-cache-46ba36297dec283dc240a9949660214d46f571d2','i:1;',1784806186),('laravel-cache-46ba36297dec283dc240a9949660214d46f571d2:timer','i:1784806186;',1784806186),('laravel-cache-8144f9440b8fb8f94434ac2cc92622f9113e4e31','i:1;',1784620730),('laravel-cache-8144f9440b8fb8f94434ac2cc92622f9113e4e31:timer','i:1784620730;',1784620730),('laravel-cache-b93b78a5792dd7c79b86b07db55a7d48a49e1035','i:1;',1784900137),('laravel-cache-b93b78a5792dd7c79b86b07db55a7d48a49e1035:timer','i:1784900137;',1784900137),('laravel-cache-spatie.permission.cache','a:3:{s:5:\"alias\";a:4:{s:1:\"a\";s:2:\"id\";s:1:\"b\";s:4:\"name\";s:1:\"c\";s:10:\"guard_name\";s:1:\"r\";s:5:\"roles\";}s:11:\"permissions\";a:72:{i:0;a:4:{s:1:\"a\";i:1;s:1:\"b\";s:15:\"dashboard.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:1;a:4:{s:1:\"a\";i:2;s:1:\"b\";s:23:\"dashboard.revenue_chart\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:2;a:4:{s:1:\"a\";i:3;s:1:\"b\";s:22:\"dashboard.best_selling\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:3;a:4:{s:1:\"a\";i:4;s:1:\"b\";s:16:\"categories.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:4;a:4:{s:1:\"a\";i:5;s:1:\"b\";s:17:\"categories.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:5;a:4:{s:1:\"a\";i:6;s:1:\"b\";s:15:\"categories.edit\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:6;a:4:{s:1:\"a\";i:7;s:1:\"b\";s:17:\"categories.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:7;a:4:{s:1:\"a\";i:8;s:1:\"b\";s:14:\"products.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:8;a:4:{s:1:\"a\";i:9;s:1:\"b\";s:15:\"products.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:9;a:4:{s:1:\"a\";i:10;s:1:\"b\";s:13:\"products.edit\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:10;a:4:{s:1:\"a\";i:11;s:1:\"b\";s:15:\"products.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:11;a:4:{s:1:\"a\";i:12;s:1:\"b\";s:25:\"products.stock_adjustment\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:12;a:4:{s:1:\"a\";i:13;s:1:\"b\";s:15:\"suppliers.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:13;a:4:{s:1:\"a\";i:14;s:1:\"b\";s:16:\"suppliers.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:14;a:4:{s:1:\"a\";i:15;s:1:\"b\";s:14:\"suppliers.edit\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:15;a:4:{s:1:\"a\";i:16;s:1:\"b\";s:16:\"suppliers.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:16;a:4:{s:1:\"a\";i:17;s:1:\"b\";s:15:\"purchases.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:17;a:4:{s:1:\"a\";i:18;s:1:\"b\";s:16:\"purchases.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:18;a:4:{s:1:\"a\";i:19;s:1:\"b\";s:14:\"purchases.show\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:19;a:4:{s:1:\"a\";i:20;s:1:\"b\";s:22:\"supplier_returns.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:20;a:4:{s:1:\"a\";i:21;s:1:\"b\";s:23:\"supplier_returns.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:21;a:4:{s:1:\"a\";i:22;s:1:\"b\";s:21:\"supplier_returns.show\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:22;a:4:{s:1:\"a\";i:23;s:1:\"b\";s:14:\"expenses.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:23;a:4:{s:1:\"a\";i:24;s:1:\"b\";s:15:\"expenses.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:24;a:4:{s:1:\"a\";i:25;s:1:\"b\";s:13:\"expenses.edit\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:25;a:4:{s:1:\"a\";i:26;s:1:\"b\";s:15:\"expenses.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:26;a:4:{s:1:\"a\";i:27;s:1:\"b\";s:15:\"customers.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:27;a:4:{s:1:\"a\";i:28;s:1:\"b\";s:16:\"customers.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:28;a:4:{s:1:\"a\";i:29;s:1:\"b\";s:14:\"customers.edit\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:29;a:4:{s:1:\"a\";i:30;s:1:\"b\";s:16:\"customers.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:30;a:4:{s:1:\"a\";i:31;s:1:\"b\";s:18:\"transactions.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:31;a:4:{s:1:\"a\";i:32;s:1:\"b\";s:19:\"transactions.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:32;a:4:{s:1:\"a\";i:33;s:1:\"b\";s:17:\"transactions.show\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:33;a:4:{s:1:\"a\";i:34;s:1:\"b\";s:18:\"transactions.print\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:34;a:4:{s:1:\"a\";i:35;s:1:\"b\";s:17:\"transactions.void\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:35;a:4:{s:1:\"a\";i:36;s:1:\"b\";s:13:\"returns.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:36;a:4:{s:1:\"a\";i:37;s:1:\"b\";s:14:\"returns.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:37;a:4:{s:1:\"a\";i:38;s:1:\"b\";s:15:\"returns.approve\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:38;a:4:{s:1:\"a\";i:39;s:1:\"b\";s:12:\"returns.show\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:39;a:4:{s:1:\"a\";i:40;s:1:\"b\";s:21:\"stock_movements.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:40;a:4:{s:1:\"a\";i:41;s:1:\"b\";s:22:\"stock_movements.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:41;a:4:{s:1:\"a\";i:42;s:1:\"b\";s:19:\"stock_opnames.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:42;a:4:{s:1:\"a\";i:43;s:1:\"b\";s:20:\"stock_opnames.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:43;a:4:{s:1:\"a\";i:44;s:1:\"b\";s:18:\"stock_opnames.show\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:44;a:4:{s:1:\"a\";i:45;s:1:\"b\";s:20:\"cashier_shifts.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:45;a:4:{s:1:\"a\";i:46;s:1:\"b\";s:19:\"cashier_shifts.open\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:46;a:4:{s:1:\"a\";i:47;s:1:\"b\";s:20:\"cashier_shifts.close\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:47;a:4:{s:1:\"a\";i:48;s:1:\"b\";s:21:\"cashier_shifts.report\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:48;a:4:{s:1:\"a\";i:49;s:1:\"b\";s:13:\"profits.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:49;a:4:{s:1:\"a\";i:50;s:1:\"b\";s:13:\"reports.sales\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:50;a:4:{s:1:\"a\";i:51;s:1:\"b\";s:13:\"reports.stock\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:51;a:4:{s:1:\"a\";i:52;s:1:\"b\";s:14:\"reports.export\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:52;a:4:{s:1:\"a\";i:53;s:1:\"b\";s:14:\"settings.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:53;a:4:{s:1:\"a\";i:54;s:1:\"b\";s:13:\"settings.edit\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:54;a:4:{s:1:\"a\";i:55;s:1:\"b\";s:11:\"users.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:55;a:4:{s:1:\"a\";i:56;s:1:\"b\";s:12:\"users.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:56;a:4:{s:1:\"a\";i:57;s:1:\"b\";s:10:\"users.edit\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:57;a:4:{s:1:\"a\";i:58;s:1:\"b\";s:12:\"users.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:58;a:4:{s:1:\"a\";i:59;s:1:\"b\";s:11:\"roles.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:59;a:4:{s:1:\"a\";i:60;s:1:\"b\";s:12:\"roles.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:60;a:4:{s:1:\"a\";i:61;s:1:\"b\";s:10:\"roles.edit\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:61;a:4:{s:1:\"a\";i:62;s:1:\"b\";s:12:\"roles.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:62;a:4:{s:1:\"a\";i:63;s:1:\"b\";s:17:\"permissions.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:63;a:4:{s:1:\"a\";i:64;s:1:\"b\";s:11:\"units.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:64;a:4:{s:1:\"a\";i:65;s:1:\"b\";s:12:\"units.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:65;a:4:{s:1:\"a\";i:66;s:1:\"b\";s:10:\"units.edit\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:66;a:4:{s:1:\"a\";i:67;s:1:\"b\";s:12:\"units.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:67;a:4:{s:1:\"a\";i:68;s:1:\"b\";s:19:\"ppob-accounts.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:68;a:4:{s:1:\"a\";i:69;s:1:\"b\";s:20:\"ppob-accounts.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:69;a:4:{s:1:\"a\";i:70;s:1:\"b\";s:18:\"ppob-accounts.edit\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:1:{i:0;i:1;}}i:70;a:4:{s:1:\"a\";i:71;s:1:\"b\";s:23:\"ppob-balance-logs.index\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:71;a:4:{s:1:\"a\";i:72;s:1:\"b\";s:23:\"ppob-balance-logs.store\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}}s:5:\"roles\";a:2:{i:0;a:3:{s:1:\"a\";i:1;s:1:\"b\";s:5:\"admin\";s:1:\"c\";s:3:\"web\";}i:1;a:3:{s:1:\"a\";i:2;s:1:\"b\";s:7:\"cashier\";s:1:\"c\";s:3:\"web\";}}}',1784982840);
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cashier_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `unit_id` bigint unsigned DEFAULT NULL,
  `qty` int NOT NULL,
  `price` bigint NOT NULL,
  `customer_ref` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ppob_cost` bigint DEFAULT NULL,
  `admin_fee` bigint DEFAULT NULL,
  `is_held` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `carts_unit_id_foreign` (`unit_id`),
  KEY `carts_cashier_id_foreign` (`cashier_id`),
  KEY `carts_product_id_foreign` (`product_id`),
  CONSTRAINT `carts_cashier_id_foreign` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `carts_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `carts_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cashier_shifts`
--

DROP TABLE IF EXISTS `cashier_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cashier_shifts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `opened_at` timestamp NOT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `cash_in_hand` bigint NOT NULL DEFAULT '0',
  `ppob_opening_balance` bigint DEFAULT NULL,
  `ppob_closing_balance` bigint DEFAULT NULL,
  `ppob_expected_balance` bigint DEFAULT NULL,
  `expected_cash` bigint NOT NULL DEFAULT '0',
  `actual_cash` bigint NOT NULL DEFAULT '0',
  `difference` bigint NOT NULL DEFAULT '0',
  `total_transactions` int NOT NULL DEFAULT '0',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('open','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cashier_shifts_user_id_index` (`user_id`),
  KEY `cashier_shifts_status_index` (`status`),
  CONSTRAINT `cashier_shifts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cashier_shifts`
--

LOCK TABLES `cashier_shifts` WRITE;
/*!40000 ALTER TABLE `cashier_shifts` DISABLE KEYS */;
INSERT INTO `cashier_shifts` VALUES (1,1,'2026-07-21 15:58:27','2026-07-24 00:21:04',100000,0,NULL,0,100000,100000,0,0,NULL,'closed','2026-07-21 15:58:27','2026-07-24 00:21:04');
/*!40000 ALTER TABLE `cashier_shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_unique` (`name`),
  UNIQUE KEY `categories_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Alat Tulis','alat-tulis',NULL,'2026-06-26 21:54:07','2026-06-26 21:54:07'),(2,'Buku','buku',NULL,'2026-06-26 21:54:18','2026-06-26 21:54:18'),(3,'Kertas','kertas',NULL,'2026-06-27 12:33:00','2026-06-27 12:33:00');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_telp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customers_name_index` (`name`),
  KEY `customers_no_telp_index` (`no_telp`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expense_date` date NOT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` bigint unsigned NOT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `expenses_code_unique` (`code`),
  KEY `expenses_user_id_foreign` (`user_id`),
  KEY `expenses_expense_date_category_index` (`expense_date`,`category`),
  CONSTRAINT `expenses_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_05_16_110929_create_permission_tables',1),(5,'2026_05_16_134148_create_customers_table',1),(6,'2026_05_16_134421_create_suppliers_table',1),(7,'2026_05_16_134430_create_categories_table',1),(8,'2026_05_16_134442_create_products_table',1),(9,'2026_05_16_134501_create_carts_table',1),(10,'2026_05_16_134525_create_transactions_table',1),(11,'2026_05_16_134615_create_transaction_details_table',1),(12,'2026_05_16_134718_create_profits_table',1),(13,'2026_05_16_134741_create_purchases_table',1),(14,'2026_05_16_134804_create_purchase_details_table',1),(15,'2026_05_16_134840_create_stock_movements_table',1),(16,'2026_05_16_134916_create_stock_opnames_table',1),(17,'2026_05_16_134940_create_stock_opname_details_table',1),(18,'2026_05_16_135002_create_return_transactions_table',1),(19,'2026_05_16_135021_create_return_details_table',1),(20,'2026_05_16_135039_create_supplier_returns_table',1),(21,'2026_05_16_135106_create_supplier_return_details_table',1),(22,'2026_05_16_135128_create_cashier_shifts_table',1),(23,'2026_05_16_135150_create_expenses_table',1),(24,'2026_05_16_135223_create_settings_table',1),(25,'2026_06_18_091347_create_units_table',1),(26,'2026_06_18_091348_create_product_units_table',1),(27,'2026_06_18_091349_add_multi_uom_fields_to_carts_table',1),(28,'2026_06_18_091349_add_multi_uom_fields_to_products_table',1),(29,'2026_06_18_091349_add_multi_uom_fields_to_transaction_details_table',1),(30,'2026_06_18_091350_add_multi_uom_fields_to_purchase_details_table',1),(31,'2026_06_18_091350_add_multi_uom_fields_to_return_details_table',1),(32,'2026_06_18_091351_add_ppob_fields_to_cashier_shifts_table',1),(33,'2026_06_18_091351_create_ppob_accounts_table',1),(34,'2026_06_18_091351_create_ppob_balance_logs_table',1),(35,'2026_06_26_205716_add_service_product_type_to_products_table',2),(36,'2026_06_26_205717_create_product_components_table',2),(37,'2026_06_27_103344_add_username_to_users_table',3),(38,'2026_07_20_000001_add_discount_fields_to_transaction_details',4),(39,'2026_07_20_000002_add_is_held_to_carts',4),(40,'2026_07_21_081540_add_telegram_fields_to_users_table',4);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_permissions`
--

DROP TABLE IF EXISTS `model_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `model_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `model_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_permissions`
--

LOCK TABLES `model_has_permissions` WRITE;
/*!40000 ALTER TABLE `model_has_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `model_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_roles`
--

DROP TABLE IF EXISTS `model_has_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `model_has_roles` (
  `role_id` bigint unsigned NOT NULL,
  `model_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_roles`
--

LOCK TABLES `model_has_roles` WRITE;
/*!40000 ALTER TABLE `model_has_roles` DISABLE KEYS */;
INSERT INTO `model_has_roles` VALUES (1,'App\\Models\\User',1),(2,'App\\Models\\User',2),(1,'App\\Models\\User',3),(2,'App\\Models\\User',4),(2,'App\\Models\\User',5),(2,'App\\Models\\User',6);
/*!40000 ALTER TABLE `model_has_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'dashboard.index','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(2,'dashboard.revenue_chart','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(3,'dashboard.best_selling','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(4,'categories.index','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(5,'categories.create','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(6,'categories.edit','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(7,'categories.delete','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(8,'products.index','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(9,'products.create','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(10,'products.edit','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(11,'products.delete','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(12,'products.stock_adjustment','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(13,'suppliers.index','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(14,'suppliers.create','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(15,'suppliers.edit','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(16,'suppliers.delete','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(17,'purchases.index','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(18,'purchases.create','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(19,'purchases.show','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(20,'supplier_returns.index','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(21,'supplier_returns.create','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(22,'supplier_returns.show','web','2026-06-26 18:58:38','2026-06-26 18:58:38'),(23,'expenses.index','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(24,'expenses.create','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(25,'expenses.edit','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(26,'expenses.delete','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(27,'customers.index','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(28,'customers.create','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(29,'customers.edit','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(30,'customers.delete','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(31,'transactions.index','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(32,'transactions.create','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(33,'transactions.show','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(34,'transactions.print','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(35,'transactions.void','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(36,'returns.index','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(37,'returns.create','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(38,'returns.approve','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(39,'returns.show','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(40,'stock_movements.index','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(41,'stock_movements.create','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(42,'stock_opnames.index','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(43,'stock_opnames.create','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(44,'stock_opnames.show','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(45,'cashier_shifts.index','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(46,'cashier_shifts.open','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(47,'cashier_shifts.close','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(48,'cashier_shifts.report','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(49,'profits.index','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(50,'reports.sales','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(51,'reports.stock','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(52,'reports.export','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(53,'settings.index','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(54,'settings.edit','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(55,'users.index','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(56,'users.create','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(57,'users.edit','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(58,'users.delete','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(59,'roles.index','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(60,'roles.create','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(61,'roles.edit','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(62,'roles.delete','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(63,'permissions.index','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(64,'units.index','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(65,'units.create','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(66,'units.edit','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(67,'units.delete','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(68,'ppob-accounts.index','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(69,'ppob-accounts.create','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(70,'ppob-accounts.edit','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(71,'ppob-balance-logs.index','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(72,'ppob-balance-logs.store','web','2026-06-26 18:58:39','2026-06-26 18:58:39');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ppob_accounts`
--

DROP TABLE IF EXISTS `ppob_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ppob_accounts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_balance` bigint NOT NULL DEFAULT '0',
  `min_balance_alert` bigint NOT NULL DEFAULT '100000',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ppob_accounts`
--

LOCK TABLES `ppob_accounts` WRITE;
/*!40000 ALTER TABLE `ppob_accounts` DISABLE KEYS */;
INSERT INTO `ppob_accounts` VALUES (1,'KIOSK',0,1000000,1,NULL,'2026-06-26 21:50:11','2026-06-26 21:50:11');
/*!40000 ALTER TABLE `ppob_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ppob_balance_logs`
--

DROP TABLE IF EXISTS `ppob_balance_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ppob_balance_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ppob_account_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `cashier_shift_id` bigint unsigned DEFAULT NULL,
  `type` enum('opening_balance','top_up','sale','adjustment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` bigint NOT NULL,
  `balance_before` bigint NOT NULL,
  `balance_after` bigint NOT NULL,
  `reference_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint unsigned DEFAULT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ppob_balance_logs_user_id_foreign` (`user_id`),
  KEY `ppob_balance_logs_cashier_shift_id_foreign` (`cashier_shift_id`),
  KEY `ppob_balance_logs_reference_type_reference_id_index` (`reference_type`,`reference_id`),
  KEY `ppob_balance_logs_ppob_account_id_created_at_index` (`ppob_account_id`,`created_at`),
  KEY `ppob_balance_logs_type_index` (`type`),
  CONSTRAINT `ppob_balance_logs_cashier_shift_id_foreign` FOREIGN KEY (`cashier_shift_id`) REFERENCES `cashier_shifts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ppob_balance_logs_ppob_account_id_foreign` FOREIGN KEY (`ppob_account_id`) REFERENCES `ppob_accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ppob_balance_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ppob_balance_logs`
--

LOCK TABLES `ppob_balance_logs` WRITE;
/*!40000 ALTER TABLE `ppob_balance_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `ppob_balance_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_components`
--

DROP TABLE IF EXISTS `product_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_components` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `service_product_id` bigint unsigned NOT NULL,
  `component_product_id` bigint unsigned NOT NULL,
  `qty_per_unit` decimal(10,4) NOT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_components_service_component_unique` (`service_product_id`,`component_product_id`),
  KEY `product_components_component_product_id_foreign` (`component_product_id`),
  CONSTRAINT `product_components_component_product_id_foreign` FOREIGN KEY (`component_product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `product_components_service_product_id_foreign` FOREIGN KEY (`service_product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_components`
--

LOCK TABLES `product_components` WRITE;
/*!40000 ALTER TABLE `product_components` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_components` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_units`
--

DROP TABLE IF EXISTS `product_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_units` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `unit_id` bigint unsigned NOT NULL,
  `conversion_factor` decimal(10,4) NOT NULL DEFAULT '1.0000',
  `sell_price` bigint NOT NULL,
  `is_base_unit` tinyint(1) NOT NULL DEFAULT '0',
  `is_default_sell` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_units_product_id_unit_id_unique` (`product_id`,`unit_id`),
  KEY `product_units_unit_id_foreign` (`unit_id`),
  CONSTRAINT `product_units_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_units_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_units`
--

LOCK TABLES `product_units` WRITE;
/*!40000 ALTER TABLE `product_units` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint unsigned NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `barcode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `product_type` enum('physical','ppob','service') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'physical',
  `buy_price` bigint NOT NULL,
  `avg_cost` bigint NOT NULL DEFAULT '0',
  `sell_price` bigint NOT NULL,
  `unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pcs',
  `stock` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_barcode_unique` (`barcode`),
  UNIQUE KEY `products_slug_unique` (`slug`),
  KEY `products_category_id_foreign` (`category_id`),
  KEY `products_title_index` (`title`),
  CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profits`
--

DROP TABLE IF EXISTS `profits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profits` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` bigint unsigned NOT NULL,
  `total_revenue` bigint NOT NULL DEFAULT '0',
  `total_cost` bigint NOT NULL DEFAULT '0',
  `profit_amount` bigint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profits_transaction_id_unique` (`transaction_id`),
  CONSTRAINT `profits_transaction_id_foreign` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profits`
--

LOCK TABLES `profits` WRITE;
/*!40000 ALTER TABLE `profits` DISABLE KEYS */;
/*!40000 ALTER TABLE `profits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_details`
--

DROP TABLE IF EXISTS `purchase_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_details` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `purchase_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `unit_id` bigint unsigned DEFAULT NULL,
  `conversion_factor` decimal(10,4) NOT NULL DEFAULT '1.0000',
  `qty` int NOT NULL,
  `buy_price` bigint NOT NULL DEFAULT '0',
  `subtotal` bigint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `purchase_details_purchase_id_foreign` (`purchase_id`),
  KEY `purchase_details_product_id_foreign` (`product_id`),
  KEY `purchase_details_unit_id_foreign` (`unit_id`),
  CONSTRAINT `purchase_details_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `purchase_details_purchase_id_foreign` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_details_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_details`
--

LOCK TABLES `purchase_details` WRITE;
/*!40000 ALTER TABLE `purchase_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchases`
--

DROP TABLE IF EXISTS `purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchases` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `supplier_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `invoice` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchase_date` date NOT NULL,
  `total_items` int NOT NULL DEFAULT '0',
  `total_qty` int NOT NULL DEFAULT '0',
  `total_amount` bigint NOT NULL DEFAULT '0',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchases_invoice_unique` (`invoice`),
  KEY `purchases_supplier_id_foreign` (`supplier_id`),
  KEY `purchases_user_id_foreign` (`user_id`),
  KEY `purchases_purchase_date_index` (`purchase_date`),
  CONSTRAINT `purchases_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `purchases_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases`
--

LOCK TABLES `purchases` WRITE;
/*!40000 ALTER TABLE `purchases` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `return_details`
--

DROP TABLE IF EXISTS `return_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `return_details` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `return_transaction_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `unit_id` bigint unsigned DEFAULT NULL,
  `conversion_factor` decimal(10,4) NOT NULL DEFAULT '1.0000',
  `qty` int NOT NULL,
  `price` bigint NOT NULL,
  `subtotal` bigint NOT NULL DEFAULT '0',
  `restock` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `return_details_return_transaction_id_foreign` (`return_transaction_id`),
  KEY `return_details_product_id_foreign` (`product_id`),
  KEY `return_details_unit_id_foreign` (`unit_id`),
  CONSTRAINT `return_details_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `return_details_return_transaction_id_foreign` FOREIGN KEY (`return_transaction_id`) REFERENCES `return_transactions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `return_details_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `return_details`
--

LOCK TABLES `return_details` WRITE;
/*!40000 ALTER TABLE `return_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `return_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `return_transactions`
--

DROP TABLE IF EXISTS `return_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `return_transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` bigint unsigned NOT NULL,
  `cashier_id` bigint unsigned NOT NULL,
  `invoice` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` enum('defect','wrong_item','customer_request','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `total_refund` bigint NOT NULL DEFAULT '0',
  `refund_method` enum('cash','original') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `return_transactions_invoice_unique` (`invoice`),
  KEY `return_transactions_transaction_id_foreign` (`transaction_id`),
  KEY `return_transactions_cashier_id_foreign` (`cashier_id`),
  CONSTRAINT `return_transactions_cashier_id_foreign` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `return_transactions_transaction_id_foreign` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `return_transactions`
--

LOCK TABLES `return_transactions` WRITE;
/*!40000 ALTER TABLE `return_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `return_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_has_permissions`
--

DROP TABLE IF EXISTS `role_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `role_has_permissions_role_id_foreign` (`role_id`),
  CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_has_permissions`
--

LOCK TABLES `role_has_permissions` WRITE;
/*!40000 ALTER TABLE `role_has_permissions` DISABLE KEYS */;
INSERT INTO `role_has_permissions` VALUES (1,1),(2,1),(3,1),(4,1),(5,1),(6,1),(7,1),(8,1),(9,1),(10,1),(11,1),(12,1),(13,1),(14,1),(15,1),(16,1),(17,1),(18,1),(19,1),(20,1),(21,1),(22,1),(23,1),(24,1),(25,1),(26,1),(27,1),(28,1),(29,1),(30,1),(31,1),(32,1),(33,1),(34,1),(35,1),(36,1),(37,1),(38,1),(39,1),(40,1),(41,1),(42,1),(43,1),(44,1),(45,1),(46,1),(47,1),(48,1),(49,1),(50,1),(51,1),(52,1),(53,1),(54,1),(55,1),(56,1),(57,1),(58,1),(59,1),(60,1),(61,1),(62,1),(63,1),(64,1),(65,1),(66,1),(67,1),(68,1),(69,1),(70,1),(71,1),(72,1),(1,2),(4,2),(8,2),(27,2),(28,2),(29,2),(31,2),(32,2),(33,2),(34,2),(36,2),(37,2),(39,2),(45,2),(46,2),(47,2),(50,2),(71,2),(72,2);
/*!40000 ALTER TABLE `role_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'admin','web','2026-06-26 18:58:39','2026-06-26 18:58:39'),(2,'cashier','web','2026-06-26 18:58:39','2026-06-26 18:58:39');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('0MqlV1ir6U2oQggwoG8GkzwH1XW1yFXokWRKL3hw',NULL,'15.228.85.10','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiT3lpWlZNb09pN1RJcjJ3b3JGczFwSm90SjJ6ZTRGUzk5VU82VEs2dyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzY6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784937598),('198voZvR7pE6vTh2SQfJjViOqdduhJDHSu5dhABS',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiSW9pQzJBMEFPNWdvOERPVThaWlNLVjRPVVFzaUI3dmlFYjlkV01mYiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784899242),('1gqBFnx74xekDIgxyAhmOLGwFqklKFQlENOSGsR9',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiZFpaU0o0emExOVFBaTgwZHJpNWlEOWQ4dUg5TWI3Q05leGp2clF0ayI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784898774),('1ikAUuFpAM5AfoSChwOA9ufr1PbOHLQ3lbnD7H2Z',NULL,'100.55.11.56','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoid2p6TGhiMXJudGlMZGl0TnIyQmxpWnU0VWNkS000QWQwZldHNkJFSSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784850359),('3OHmfoFiFhISgYOj723qMBBiJgAUnOrgtUkiToh6',NULL,'::1','curl/8.18.0','YTo0OntzOjY6Il90b2tlbiI7czo0MDoiTFA1NzJlUTFteGVKVzRiQjJFbGNwRkhYanhFUnRCNVJjN2JkODlYQyI7czozOiJ1cmwiO2E6MTp7czo4OiJpbnRlbmRlZCI7czozNDoiaHR0cDovL2xvY2FsaG9zdC9hY2NvdW50L2Rhc2hib2FyZCI7fXM6OToiX3ByZXZpb3VzIjthOjI6e3M6MzoidXJsIjtzOjM0OiJodHRwOi8vbG9jYWxob3N0L2FjY291bnQvZGFzaGJvYXJkIjtzOjU6InJvdXRlIjtzOjE3OiJhY2NvdW50LmRhc2hib2FyZCI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784800113),('3PlQmaSYdFXdSs6wTIC42txlrFreOCl7jMvBePgK',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiSmJJS1NGb2UzbTRTd1U4TktqMFFkdkM4OEJ6WUw5NDZXbGpEdWdUNyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784899564),('4pGL7m9dEz2kCPxJocd9bxto3QNBWtUIYRICG7Po',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiMlFMYVI4UWxPaEtacG41VEdGcFhDOGlEd09yT3ZQOVZWMW9hZHpDSCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784898181),('4ULOjqSchqpqFLB3mL7YDlVHUwxQreB91w9dMdEL',NULL,'32.197.233.173','Mozilla/5.0 (Linux; Android 16; SM-S921U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiRWFpc1JRRmowY2xBcHZsMkZ3VjJrRFpJV080blNEaUR4R3oxTVphNyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784966198),('57IilpAJ6PA8JBifiRPrUlzYJUCmZDRjGRa3HNsM',NULL,'127.0.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.7827.55 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiUE5vZUVLNFZYS29FZ0F3VlY1ZkFTMmlrZnZOaU9oMmZXWU9wQXY1diI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMS9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784802311),('5YcOJFZYkek7qYTByZfKr3liap8HFcibOv7Hs6xa',NULL,'::1','curl/8.18.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiWmJxNnhobjUxcnRaS0llOVY5RW5UTXZMVDFZQkpmQjJhazlSS0VLNyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9sb2NhbGhvc3QvbG9naW4iO3M6NToicm91dGUiO3M6NToibG9naW4iO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1784805831),('7gvO2WGyaVabwRMmIwxEKEXDUC4H4nCPrBIDUlcS',NULL,'2404:c0:8110::598:7f2e','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36','YToyOntzOjY6Il90b2tlbiI7czo0MDoiUmoxVHlMbXJCRzZTbXVCUlNmMUZIM25hZE1vbThrRWRJeURlcmhkMCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784900192),('7YxxfSEECTuqcdKrwjruGRKK5HJQXw7vwvdZzx9H',NULL,'::1','curl/8.18.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiMm1KUW5oekpXUElVNXI3cUNkY3BKOVVOSjRDR1dKaWhLY0R1aHRieSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9sb2NhbGhvc3QvbG9naW4iO3M6NToicm91dGUiO3M6NToibG9naW4iO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1784805837),('83Bdhpa6wpefwH2rGbUT8w5OFP1911HHXfwPyc9k',NULL,'35.174.8.151','Mozilla/5.0 (Linux; Android 16; SM-S921U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiTjBSWmplVVFoVnZENjRDZ0J1b05mRnlGSlgxZm11YjJaRFBOUFlxaCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784908343),('9EYcYo5dFZleCrf44rKjDwGmbOyj3Ro3Wgruc4gX',NULL,'45.92.84.56','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiWFpJME1JT3plTUhnV214M1hjZkl5bGpTSWVwYzBHY1hBaGVBTXc3diI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzY6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784838508),('9k6UK1MtwGPo52tQHCatizDjI8yVqElZJPvINq12',NULL,'98.92.190.74','Mozilla/5.0 (Linux; Android 16; SM-S921U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoibFN2MGJFMjBkQXYzVk9ONThHTnNnOHlGb09JQTdWQ29MQ3Z0M09mbSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784821339),('9ViZGfoZA5Msv9qNKeGODTqjg1JV3ImG7HY9H9TG',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiNTE5YWU4UEpmdnljQ2NqQTE4QkY5dk5lMkxJV3lyUVhMSFVsOVhhOSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784899094),('ACybzMwNFW3mDjn9r6bbhrfutLYr5VGylx9DhU9g',NULL,'44.215.125.218','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoic2hHT212WjBFcnZ6VTFlbE1oOWp4WUk1VnhXV1QxWDg4OEdVcktwQSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784966196),('ao4aNnFo3tl6wAGHEKbXSqkjDCuz4gC19AtQonRH',NULL,'54.237.156.113','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiSUhHUFNSVzlWTko1ZHp3MnNTSkFvUmthVUdMY3hodWtob3VDblFlbyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784806841),('bfwaqecF94RcDsIX1h5Ll0O0B1ci1AE9XQ2rKGxp',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoickFETnZ1UXNCUjBJZGdYazZtalkxUnRtdUVSZk40VUhiT2NVZFNXViI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784900141),('bgduYWn1RE0U2tZwxSPMPKd2Cblug3rmiJPb1pYG',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiNldhRlhWSGJWMnVBYlc4cndzaWIwQ08ydEZqT2hmMGR5dFJkclp3MyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784900374),('BhgSpQhXOr3E4s3XQC7GOB0ReCi0KzBs8en4rC8x',NULL,'182.8.161.167','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36','YToyOntzOjY6Il90b2tlbiI7czo0MDoiMWZmSGloWWJNZU9WMVJ1SjV3VWVTTHlPUUlib005RFRHNWFiWnc2eiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784823690),('bjE6Sh9o9LhI7w09tMgL291hG0ErwtAlJtU1hbvq',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiMEJZREx3TVF2ZzRBdzhXeWpVSVdZd3lDU054bWlDZGw4VFczTzVXWiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784900537),('bjZo55M5eqONZiyei8ilatN3wKEtqxVmP1xCC36B',NULL,'100.127.24.46','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiNTdYWmpoYnJZbUJzNlU3OXVseHNZSGJXT1ExdUl2YWxaTTh1dEE4RiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fX0=',1784806310),('BUQUdaXgg8kftNNvPPOTOLPx7PKDtwlAVJGtd1WI',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiQWFVc0RRMVZHemtEZWg4QllrdlRMem44VGFDd3VZRkF3Q3NVcnlXYyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784899979),('CDACYtJEnqsRXYF6LrGpke6dYGAj2En0ixpldFZp',NULL,'23.20.145.162','Mozilla/5.0 (Linux; Android 16; SM-S921U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiV2RNeTl6aWJTcjdiamRscWRiWlJRWjE1NHRyZWZSUWdiMHZVYVFFSiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784806845),('cIRCU2guX8Tk7PGkp4AU6D1nigb4WfFDoOoumWeu',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiUlhiOTlsTHFwY25rUUJ6bDh2Q1JLY3pzTGhkODgzb3ZSUGNNeXFBZyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784899173),('DO7mdMd9zec8ivIbeTCkUVTIkX3VOTazr5elE3Jh',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiTlNkWU5PNkgwTkowZ092MnN5Q3ZnaU5BUkZ4MnlpNHlMVGZFb1FWaiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784901206),('DtkIujtTCyneNVowQng1zoT30LrvTnbEkVvmVw62',NULL,'3.87.195.162','Mozilla/5.0 (Linux; Android 16; SM-S921U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoicWFvN2V1Q3Z1WGNic2tyeUlKY0g0T2RiS0ZDekw0TEFzNGpCY1ZWVSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784850351),('dXcHdSxpXyNW5ABWbMq1Ar3plQ1G7ruUkdbI2dHc',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiVUE2dXFaa1ZRSjFvUHd4OHpkYUpmTlBEV2kxRFduOUxVMkJnbkdiVCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784898168),('E3JXWiha4my176uFxfEbXK7MmEafONqXRnO6qt2D',NULL,'98.81.208.38','Mozilla/5.0 (Linux; Android 16; SM-S921U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoialI1M1N3WEhUYU92Sm9vM1VmRkF0R21udE5XQ3ViUzQ0TVd3YmJkNiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784937258),('EEpZXqNramUE8zD4BRfvX07Hi6Vh11VG4wPktETK',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoicFJlZHZydkpVb2h3Szl1dWFqY2Nmb0ZaQVl0MEZ0djdFcWdUeHN5ZSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784901295),('ePkuSaivIZOIsNNgKgaflqa7p2TmIUicugRqDVTy',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoibG5jUnZhNG1xZXdxTEtNdjdHWmVRQXlsczNIN2JZSm9UWUNPajREcSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784901105),('eRk4NtQsWz2Guo078ZL0YLFfBlbkMTlP3jK3eyRS',NULL,'164.92.77.172','Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiNGVZM1pJdG1WSHRBc1d3dXNHTm5ZdkdHQmFHSjJhMVdxcnN3ZE11dyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784860734),('exbT8iQKpnoiWn0dBu1uyuDYA8OMa9fllCTQo8ZQ',NULL,'::1','curl/8.18.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoibmlpb0todEFtT2g2QWhCOVlFbGZmUmxaUjlKa1Zobkd0MEROUmNKcyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9sb2NhbGhvc3QvbG9naW4iO3M6NToicm91dGUiO3M6NToibG9naW4iO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1784805831),('fCJxi8ZoUdGFELupqmZVz2Tss6TAg0HBXkSefIab',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiUkd0dGIyWHRzR25vZzl4V1BTM1FzTjBKZ2Jid0NzYmp5N016YnB4cyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784899639),('fl5HHvqKxGJOGfUgMGzu1lITLm6oIjtpC0bxLMHZ',NULL,'157.143.3.35','Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiZko0bFVRM0k1WmNzRDRvTHlXWEFqMWVCRm1OUTF4WlhuYXh3T01DWiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzY6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784963636),('fScFmS2nKsWXLxUfVp3WWESt8DT3rdr5pkXVgM2l',NULL,'::1','curl/8.18.0','YToyOntzOjY6Il90b2tlbiI7czo0MDoicE10SXlvUVdka1BZVGsyYzhyc0Ridzl2djA2dXN6REZsazM5TUVpUiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784804760),('HJB81ZP82pij2Uu98o1Ckgu7pcKvtYgRiAoseWkP',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiRHJwSEswM1BtZEoybEdMbEh5R01XcXRWZEl2U2w5b2VSZGdDaVhwRSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784900640),('I9tasUJztjNIfF6WlCI15GGGgUVbdeSEoiabVvcL',NULL,'104.197.69.115','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.60 Safari/537.36 Edge/12.246','YTozOntzOjY6Il90b2tlbiI7czo0MDoiczlJSlFnSG9LZ3o0NEw4V1RCY3B4TVdJU1dZeVBCN0U2U0NRR2licSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784957287),('jgNRArPqlnMdgv3D0VpRPL30t99ZlBt3p8WD07Pn',1,'182.8.161.167','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36','YTo0OntzOjY6Il90b2tlbiI7czo0MDoiSjNBS3gzVDhRNnBwUHE2TUdabGtOVUFKaDhhRE9TWGhoblhMRGFvYyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NTQ6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9hY2NvdW50L2Rhc2hib2FyZCI7czo1OiJyb3V0ZSI7czoxNzoiYWNjb3VudC5kYXNoYm9hcmQiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX1zOjUwOiJsb2dpbl93ZWJfNTliYTM2YWRkYzJiMmY5NDAxNTgwZjAxNGM3ZjU4ZWE0ZTMwOTg5ZCI7aToxO30=',1784800397),('JpKbN4Iwfuka7ey3CLugMXLEWqySNCzFmqNq5Gqp',NULL,'54.165.28.132','Mozilla/5.0 (Linux; Android 16; SM-S921U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiSVY1SnNRNWZLVEZxZkNVMDlkNFJRaEtGOFM0dnhnVFdOckZHRk5hdSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784864815),('jXTv4gm0IDRwybLEOc5zbxJGZCfaoj7U1ObqkjzZ',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiTnpuUzFCdWlURE1GQXNic0tmbGZNb2dSaDFRUVJ4eFhRdWh3aGVXMiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784898172),('KgNRgH1QjtOpg3gHq2pgqQLfUOb8CBmoBt5aZNmH',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiMHZyQTJIcVR5VTloTnN2VzZ1M3FuMml3RnNDZVpZc0NIU0I2bnFKYyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784898655),('MATKpL8lgxUNKTpVOt0jsmBRzLiHfOVF4QZMYIHv',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoibzRRM0JOQVM4aVlyTzU2SFd4dHYzSWRNcTBOZXdnbUhXcFpsVXlCMCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784898230),('MZ6IM0mArHKLsYMge8ZN3vGEos8kbori4vzhhed7',NULL,'94.154.43.183','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiS1NlTUpNQUpvQzFrZzFpMk1DaHg3VUV2dWUyZDBGM0NUbGNtT2RLSCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784811650),('N0nAAZ7fU0Nnqlb7zhRnWKf68cVHjn1cc5ZCBdiM',NULL,'100.31.248.76','Mozilla/5.0 (Linux; Android 16; SM-S921U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoieWhlYWhkYjNZRndjZ2NXYWJxREY1aXM0THVBS09vbWp3TG5WRm40aCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784879407),('N4W9Aa8scWOIRGtxP5GFsfJ44IGCPmmi2bDwXWaE',NULL,'::1','curl/8.18.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoicUFsQ3FaV2h1SzJPbERKa05VV3hXZkJOaGF0N09TTjIzNm1jQk9nbyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9sb2NhbGhvc3QvbG9naW4iO3M6NToicm91dGUiO3M6NToibG9naW4iO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1784805869),('n5MhXhawLQ1KQ0C0lTnMLF0NqjmXSrAsusewjkqt',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiVVpYVU5SbDJwQjhTdFNMR1FsT2RDbFZDSG5ySmpqUUxkQ045MzFkbyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784899903),('oDWKuHwJ4sq1Cs2sVhtobPAmj3zH5oCNM9M2R5xL',NULL,'100.127.24.46','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiRE1yU1FLdzVQd0gxZEREUmF3c1d6aHdkNVlrTnF6djJzY0hTaDlncSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784805771),('ogHmyDfRkf14wF4bMJUqHqBwBGC4ifcAPhqm3erk',NULL,'::1','curl/8.18.0','YTo0OntzOjY6Il90b2tlbiI7czo0MDoieTZ3SkVHVEVTRjlTaTdRVklESkVINUtSZ1N6MFRMY3V1bUJiWDlTbSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czozOiJ1cmwiO2E6MTp7czo4OiJpbnRlbmRlZCI7czozNDoiaHR0cDovL2xvY2FsaG9zdC9hY2NvdW50L2Rhc2hib2FyZCI7fXM6OToiX3ByZXZpb3VzIjthOjI6e3M6MzoidXJsIjtzOjM0OiJodHRwOi8vbG9jYWxob3N0L2FjY291bnQvZGFzaGJvYXJkIjtzOjU6InJvdXRlIjtzOjE3OiJhY2NvdW50LmRhc2hib2FyZCI7fX0=',1784800167),('OmgYVB6dKn9FbLC4U59G8jjn4tsZVw522qpCdpMv',NULL,'::1','curl/8.18.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiQ3NqaW5HREZQNzdwVDZMSG5FRnhnanlkSmUwZkZ2SlVDSnRIU0xMaCI7czozOiJ1cmwiO2E6MTp7czo4OiJpbnRlbmRlZCI7czoxNzoiaHR0cHM6Ly9sb2NhbGhvc3QiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1784800113),('On3z5ObvdhFyrE6P9jtSyQDu8kga9ofc27A4K791',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoidW9SdHlqc3BRMW9PVFJ5am1RS0NWelVhV3FMenBCeFB0VnRwUXVCVSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784899451),('OO8czihG6eIMKO3sManIQtpF9qwT4wADF2X4ECHZ',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiNVUybEhzeXFOeFk0MUx3TVdscEVNYnVNR3JuUlhCeTVoTnBHT2lBRyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784900220),('PLyg7PdDdwB4bHulm3R8OHAhkKpPOwj5IROfIhuD',NULL,'::1','curl/8.18.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiNVAzOXFGUUVvc240c1hqWFVPc1JIaWRRTDJxSTE0QmRuN09zOHRJVCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9sb2NhbGhvc3QvbG9naW4iO3M6NToicm91dGUiO3M6NToibG9naW4iO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1784805848),('Pq89JnYt97iS7JooY1LJMVBXvTD58Oo2y8fvc3js',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiUzF5RU1UMjcyaWdrZUhPcDNCOE9WOUJUaGFUSDNwbmhKclpRZVdTNSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784900285),('pyrJUjWGeVNrA6fCESE9Rf7d2lpRW2HuuebO4DLT',NULL,'18.233.150.238','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiQTRIUml0WjZuRURJVnZvdml0UHBtWjNCV2w2MnduNWFpWFR5VlpTZiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784937255),('Q8CYuaAEr9kDCn4NfC3JtrpZK8Upy30bioUNVGJw',NULL,'98.81.35.17','Mozilla/5.0 (Linux; Android 16; SM-S921U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Mobile Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiOTVra1VDakVzcTJUZHJNbzJxbHFnVXYxNTZuYVZuNUUxR0NhOFQ1cCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784835869),('Qx6utHltPXzlj8zs2cbISqWjRO65AMhn9W3riZqA',NULL,'3.86.144.8','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiVXUzVUtWZDhKcGIwVXhwSGR6dkJRQlVLMTRvMXpaY3NOeUd2Y0hEbyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784864815),('RCVqJNqQLBf60fXOLXQ0syr2EV2tpTKyPycxINQa',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiSGRxZGdYaWc0YTVISnVkWWRIbk5XSkhFeWdGY2p2bjhQd0VydHBQeSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784901008),('RFDWGyggUzv8emccxsDHQR7lQezwXY4HR936NsVp',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiVHh2eXBTQWoxQXRONllwVTlzM3hQV21sWXJKSThXNWhIOEM5RW5CdCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784898861),('RiZvfJRbeAwDlYJu4wyOoasKEHuGf325dsJ9Ezt8',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiSUxvM0JzV1l1dGE5WU1FRXZOZFVBUkprenIyQ2FpaGpGalUwU3liTyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784898165),('RTZ31fTQjld54LPgTM0W1qz0rmg6trQYU531uItt',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiVTJ4MTgzVEdkZ3ZMeXR3VHIxRGQ1eTlzSVJFTEpEUlJNdVROTExJciI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784898166),('s1QQMN4JIJLjvFJUS4awTiwS1xJGUUzmdddtUifq',NULL,'45.41.130.246','Mozilla/5.0 (X11; Linux i686; rv:109.0) Gecko/20100101 Firefox/120.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiZ1F0NjN6aGM5T0ZMY2RkNkd2cnlzbGwwMUxEWU83ZXE0YlpwQ0xiZiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784970605),('SJOaGW3RZJR3jW50ShkrbXwcGwxMaAk5BKaJVrWd',NULL,'::1','curl/8.18.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiQTdKdGtleldmR3A4SndrTlR2V000RHNWOGdWbXR0bGRPblFrUlJPZCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9sb2NhbGhvc3QvbG9naW4iO3M6NToicm91dGUiO3M6NToibG9naW4iO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1784805869),('sTQ0EKZuvOJoyAaEDcERinD7YdGrfm4huiyYoh8x',NULL,'202.78.167.217','Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1','YTozOntzOjY6Il90b2tlbiI7czo0MDoibDRkMzk5aWVhYVZDN1NWeVQ4dW82TUxCeWd5NlpQR3Zsa1h6SEpKNCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzY6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784819841),('tAgy5CaMeCHz2IGA5fWRPJ9ANdWgBcMgZXiHiNP8',NULL,'54.175.0.58','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoic25pY0U5YWFpVzdoUFoxZExSMndYSXJ5TW9MQkRKdFR4ZXBLUlZaSiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784879426),('U8XQrwNPYqAc4KvYLHXY2FO0WAeBZ4c3hwU1iV7r',NULL,'54.167.254.78','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiSmVzbFlUN09odjhrZjF5QU1rcDREV2xUM2pRVVlhdlNrUk45NnhNMCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784835863),('uGWB3NhQdK183zb9DVaw7w3Z1R30PVTtWlPLuVoL',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoia3JVQ081Q0x6eWNlQWc5NFFjTUdTcHdYNVdDd0N6VVk0WlBDZXFlcCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784900828),('uK3RvfV2zfBiW9zlGTLJSe4Mwu9kUVwvPyJIzOVs',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiQTBYVlRWTHF1RFF4WVNPRmtJR0dyVHZFOVBxQXJ6S2l3cUZDVmVBMCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784898978),('Ukyu6hLogYFePOx70m50piOs1EBB96Ul5ihBQHCf',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiRGFMMkE5Tm9jeWNya2VvbDFTcmpZU1U2cHRjVkpGSE9ibTB6ek1XYiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784899829),('ULhZRK5WchFjeafnek54sjtI5QDhtyAYryvyc06i',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiNURoZGdRaTNDSGdFMzlpbEpQaHNBa0Zld0ttTnRTMm0xUjF3dlVLWCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784900059),('UsppLlX1MXCu2yGsv6yyL1QHewKFqfzR5brs7t8H',NULL,'::1','curl/8.18.0','YToyOntzOjY6Il90b2tlbiI7czo0MDoiUkJJOEdYTk93ajVtdVgzNDZ3dGRESTZQZFU0MllHaFNYcHNzNW5vcSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784804760),('v7Cuz37udvqUuXty5Za6l1gAQcS8BQ93mXEp5xmq',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiR1lheHNmeURCdVBJTmJZVDc0U2VyOFk1QUVsdVQ5VlBzazBBS1I5RSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784898294),('VGsUwXLArMr4mSRBED3SlGQ8gbl2A8Hvw6JXd3SR',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiQ0NHeDZ0SzVyemR4Z3FJWnd3MUhmcG1aWjA5Y3dQN3hkNFVQTGJVRCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784901382),('vQvjVm44lMPOrPTO8qESjv06qMt5HsVht28ZMJp0',NULL,'54.145.138.49','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiV0JudnhBbGJhQ2x2QzRpMnB3aGFYdE5oZDFvdUxBVTE1N0dBNjBVWSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784908343),('WayuiaZ78wYgOOb65zMs5SbMz5bzmnGaY6BszOSS',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoidUtWcUJWSzRLQks3ODkxOVJyNjhvU2F5NzNtd0ExS3IzTFhNNktuNyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784901533),('wKiScCarufkgVPqkTT56WDL8hYAjPpH6uzMYG9tZ',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiSlFuVFJvblZxMjZqUWh1WmNsSEtPOTNsSms3OGtieVp6U3RBRUhnaSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784899348),('WPfeS3uieLxLLYcjXUCytfobGU5H2MzRmuIMLnFK',NULL,'74.7.243.131','Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.4; +https://openai.com/gptbot)','YTozOntzOjY6Il90b2tlbiI7czo0MDoiM1BXRVFjMnlSNW5JQTdZRWFSNm1aRWpZVWpUVE5uYXo1QkRMOUg5NCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784830067),('wZwvdY7eMhONh1yBGdys1hzIGcjUCaO7LftnzryM',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiR0FMU016QWZ3WXVpR1RoVW9YZVkzeXE1R3ZNV3RvTlVzRXlncWhCaCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784900719),('x7lC1vMl8xthDvLms631OcKoGhGtp8x6bhxYl7S0',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiOXJEVENLVG9keGxxV2ZkWHVid0ljbFZtT1ZCRzZqcU13RWpGZGM0ciI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784901448),('XakHBhKKcU95uji90Q4vBb5VblGZ8QLQ8v8myWSZ',NULL,'::1','curl/8.18.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiZGVXZDU0Q3ZtaXZQeEl0eUdXQ0l3NEFON21NZkpxd1VRNHJ1bVhZViI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjI6Imh0dHA6Ly9sb2NhbGhvc3QvbG9naW4iO3M6NToicm91dGUiO3M6NToibG9naW4iO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1784805863),('XDEGAHV0hknv9swRSOaCa50G7QynihxN41FotwH5',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiVnpZcFZ6c1ZJcWdEMVoxQURMeEdrRUVhN09LSWFCcFFYR3FkSTFVcyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784898374),('Xl1RNnkPZlk4oaxPQZ7I0OWTbTkpFmC6VJSvoIMr',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiMkp0WUIzUzY5QVIwcUxuUlpYb21Ub1FnRUYwaDdaUFJCVkZOY01SMiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784898570),('xm66zB9jbCv8fPISbvi0wO4kwRWRIvlpaSZbPANO',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiWmpqRTlQU2RMMTI0TTdWMjI4Tzh6SjBXUkVFMk1FcEx5Z0tEVG9HTiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784898460),('XyRSBAB39Hq1XlrRUrlpE6B4jqTYxZoc9PD8gELU',NULL,'45.92.84.56','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiV3ZLRW9UTXZDVjVBZ01iUjltQTVaUUxTZFlTdFZkSU5CYVdyR3AxNSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784838510),('YNZAj0LeD6XKMNwCj3fG5KLDpuaoA7Ek2hKlsU15',NULL,'103.24.233.17','Mozilla/5.0 (X11; Linux i686; rv:109.0) Gecko/20100101 Firefox/120.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiNU55U3pNUWlhOFVaVzRaOVI0ckxZbFNjSGNOb2ZBV1hVN1ZMcDJZNyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784970578),('ySFB8v5uIoBzGrjfUBVwCMX87WAKeFJnLXxkWiAv',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiOFhudVZSNDVIVTM2TTExUGJIeDJSbWxYT2RmRVBZQk9uMEJLM2VWRyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784900472),('YvJChm4WS9V8XT8i0gptakvigkzBnjAqqFEh00CQ',NULL,'127.0.0.1','curl/8.18.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiaTQySlQ0dlI3NFJncHlwcVBUdnF6UUxKb2Ftb2doRlNLOTZqUmdYNyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMS9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784802299),('z8IdoBqdP3U3IbDtmZ152k8CygWRQlPn80Bv9tuk',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiQWwxZzV2eUpkS1o3T1JzMTA2cVRzb2dNbTVvdzBiZU1VQmFSS3Y1WSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784901731),('zA68ROIOqbWsdgjic2euijK3iUHXv7EUwiSJ3IE0',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiaUFuSzZ1NlViNHRTNFdVZHNPdFBHNWlPa25oekp0dEw0VzEzMXhraiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784900928),('ZBIi2xJhoXLXytzW83u8mB9lLNy5ivnh3Y36lN5a',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoiTjNaZkdudDRYWHF0ZXE3VEpEbHNOQnZFamtIa2l6V1pVRWRVVDh6aiI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784901612),('ZbWqywD4iyTF4mWaT3PnUMF7z74nyUZklrfLsWzZ',NULL,'2404:c0:8110::599:8a46','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiT2U2V3BaTEhhYmdleWxGdDR0RG9uR2E2eE9GWEVyNWV5VXFGUkFWdSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784931937),('ziEtTMQXPnIiNWrXMghBKG4mX3uNR58huwXEcF1G',NULL,'52.91.65.201','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiYXZRTHhER01wQ2NSR2Z5ampkQ2dhZ2RjbHFnclRSYmVxc2xlSGNWbiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDI6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1784821339),('zlLRPEwrHM1TUnpmtCab9v6IWNqcTF8EOFpjybzK',NULL,'94.154.43.183','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiWHpTdFZ6RlJIVFFsUmx0dlp5OW1hNWxCTVhOWW04QU81azUwN201ZSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzY6Imh0dHBzOi8vZGVhLWdlZWtvbS50YWlsODMzNGNlLnRzLm5ldCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784811649),('ZTkCzejbZEV1SoIkT90PU6fg0XAA3nqB6aJM0pzE',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoicGtoYmtqQXhmMDFZU0dQNlFQT053MTVLTmNwTHpGRFF2NWxlZlZiUSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784899758),('ZylifuNSwelxSnEwDDiFE3ESkQ0tlNAdV9CAaaNX',NULL,'91.108.5.1','','YToyOntzOjY6Il90b2tlbiI7czo0MDoib1NMbzlldUhrUTBPNEczdVJqUHg1Z21MMnpWbThEdmpIWnlFM3BrcyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1784898197);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `group` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key_unique` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'ppob_admin_fee','2000','ppob','2026-06-26 18:58:40','2026-06-26 18:58:40'),(2,'ppob_min_balance_default','100000','ppob','2026-06-26 18:58:40','2026-06-26 18:58:40'),(3,'store.name','VASIA Stationery','store','2026-06-26 19:05:28','2026-06-26 19:05:28'),(4,'store.address','Jl. Mekar Sari\r\nGn. Sari iiir, Balikpapan','store','2026-06-26 19:05:28','2026-06-26 19:05:28'),(5,'store.phone','0812-3456-7890','store','2026-06-26 19:05:28','2026-06-26 19:05:28'),(6,'store.email',NULL,'store','2026-06-26 19:05:28','2026-06-26 19:05:28'),(7,'store.logo',NULL,'store','2026-06-26 19:05:28','2026-06-26 19:05:28'),(8,'receipt.paper_size','58','store','2026-06-26 19:05:28','2026-06-26 19:05:28');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `type` enum('in','out','adjustment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` int NOT NULL,
  `stock_before` int NOT NULL,
  `stock_after` int NOT NULL,
  `reference_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint unsigned DEFAULT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_movements_user_id_foreign` (`user_id`),
  KEY `stock_movements_product_id_index` (`product_id`),
  KEY `stock_movements_type_index` (`type`),
  KEY `stock_movements_reference_type_reference_id_index` (`reference_type`,`reference_id`),
  CONSTRAINT `stock_movements_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_movements_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_opname_details`
--

DROP TABLE IF EXISTS `stock_opname_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_opname_details` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `stock_opname_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `system_stock` int NOT NULL,
  `physical_stock` int NOT NULL,
  `difference_qty` int NOT NULL DEFAULT '0',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_opname_details_stock_opname_id_foreign` (`stock_opname_id`),
  KEY `stock_opname_details_product_id_foreign` (`product_id`),
  CONSTRAINT `stock_opname_details_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `stock_opname_details_stock_opname_id_foreign` FOREIGN KEY (`stock_opname_id`) REFERENCES `stock_opnames` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_opname_details`
--

LOCK TABLES `stock_opname_details` WRITE;
/*!40000 ALTER TABLE `stock_opname_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_opname_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_opnames`
--

DROP TABLE IF EXISTS `stock_opnames`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_opnames` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `opname_date` date NOT NULL,
  `total_items` int NOT NULL DEFAULT '0',
  `total_difference_qty` int NOT NULL DEFAULT '0',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_opnames_code_unique` (`code`),
  KEY `stock_opnames_user_id_foreign` (`user_id`),
  KEY `stock_opnames_opname_date_index` (`opname_date`),
  CONSTRAINT `stock_opnames_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_opnames`
--

LOCK TABLES `stock_opnames` WRITE;
/*!40000 ALTER TABLE `stock_opnames` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_opnames` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_return_details`
--

DROP TABLE IF EXISTS `supplier_return_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_return_details` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `supplier_return_id` bigint unsigned NOT NULL,
  `purchase_detail_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `qty` int NOT NULL,
  `buy_price` bigint NOT NULL DEFAULT '0',
  `subtotal` bigint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `supplier_return_details_supplier_return_id_foreign` (`supplier_return_id`),
  KEY `supplier_return_details_purchase_detail_id_foreign` (`purchase_detail_id`),
  KEY `supplier_return_details_product_id_foreign` (`product_id`),
  CONSTRAINT `supplier_return_details_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `supplier_return_details_purchase_detail_id_foreign` FOREIGN KEY (`purchase_detail_id`) REFERENCES `purchase_details` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `supplier_return_details_supplier_return_id_foreign` FOREIGN KEY (`supplier_return_id`) REFERENCES `supplier_returns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_return_details`
--

LOCK TABLES `supplier_return_details` WRITE;
/*!40000 ALTER TABLE `supplier_return_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplier_return_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_returns`
--

DROP TABLE IF EXISTS `supplier_returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_returns` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `purchase_id` bigint unsigned NOT NULL,
  `supplier_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `invoice` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `return_date` date NOT NULL,
  `total_items` int NOT NULL DEFAULT '0',
  `total_qty` int NOT NULL DEFAULT '0',
  `total_amount` bigint NOT NULL DEFAULT '0',
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `supplier_returns_invoice_unique` (`invoice`),
  KEY `supplier_returns_purchase_id_foreign` (`purchase_id`),
  KEY `supplier_returns_supplier_id_foreign` (`supplier_id`),
  KEY `supplier_returns_user_id_foreign` (`user_id`),
  KEY `supplier_returns_return_date_index` (`return_date`),
  CONSTRAINT `supplier_returns_purchase_id_foreign` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `supplier_returns_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `supplier_returns_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_returns`
--

LOCK TABLES `supplier_returns` WRITE;
/*!40000 ALTER TABLE `supplier_returns` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplier_returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_telp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `suppliers_name_index` (`name`),
  KEY `suppliers_no_telp_index` (`no_telp`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Kantor Pos','123',NULL,'Balikpapan',NULL,1,'2026-06-27 10:18:30','2026-06-27 10:18:30');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction_details`
--

DROP TABLE IF EXISTS `transaction_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_details` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `unit_id` bigint unsigned DEFAULT NULL,
  `conversion_factor` decimal(10,4) NOT NULL DEFAULT '1.0000',
  `qty` int NOT NULL,
  `price` bigint NOT NULL,
  `buy_price` bigint NOT NULL DEFAULT '0',
  `subtotal` bigint NOT NULL DEFAULT '0',
  `customer_ref` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ppob_cost` bigint DEFAULT NULL,
  `admin_fee` bigint DEFAULT NULL,
  `discount_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'nominal | percent',
  `discount_amount` bigint DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transaction_details_transaction_id_foreign` (`transaction_id`),
  KEY `transaction_details_product_id_foreign` (`product_id`),
  KEY `transaction_details_unit_id_foreign` (`unit_id`),
  CONSTRAINT `transaction_details_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `transaction_details_transaction_id_foreign` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transaction_details_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_details`
--

LOCK TABLES `transaction_details` WRITE;
/*!40000 ALTER TABLE `transaction_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `transaction_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cashier_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned DEFAULT NULL,
  `invoice` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cash` bigint NOT NULL DEFAULT '0',
  `change` bigint NOT NULL DEFAULT '0',
  `discount` bigint NOT NULL DEFAULT '0',
  `grand_total` bigint NOT NULL DEFAULT '0',
  `payment_method` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `payment_channel` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('unpaid','pending','paid','expired','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `snap_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `midtrans_transaction_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','completed','voided') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `void_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `voided_by` bigint unsigned DEFAULT NULL,
  `voided_at` timestamp NULL DEFAULT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transactions_invoice_unique` (`invoice`),
  KEY `transactions_cashier_id_foreign` (`cashier_id`),
  KEY `transactions_customer_id_foreign` (`customer_id`),
  KEY `transactions_voided_by_foreign` (`voided_by`),
  KEY `transactions_created_at_index` (`created_at`),
  KEY `transactions_payment_status_index` (`payment_status`),
  KEY `transactions_status_payment_status_index` (`status`,`payment_status`),
  CONSTRAINT `transactions_cashier_id_foreign` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `transactions_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transactions_voided_by_foreign` FOREIGN KEY (`voided_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abbreviation` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `units_abbreviation_unique` (`abbreviation`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES (1,'Pieces','pcs','2026-06-26 18:58:40','2026-06-26 18:58:40'),(2,'Box','box','2026-06-26 18:58:40','2026-06-26 18:58:40'),(3,'Lusin','lsn','2026-06-26 18:58:40','2026-06-26 18:58:40'),(4,'Kodi','kodi','2026-06-26 18:58:40','2026-06-26 18:58:40'),(5,'Kilogram','kg','2026-06-26 18:58:40','2026-06-26 18:58:40'),(6,'Gram','gram','2026-06-26 18:58:40','2026-06-26 18:58:40'),(7,'Liter','liter','2026-06-26 18:58:40','2026-06-26 18:58:40'),(8,'Mililiter','ml','2026-06-26 18:58:40','2026-06-26 18:58:40');
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telegram_id` bigint unsigned DEFAULT NULL,
  `telegram_username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telegram_linked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_telegram_id_unique` (`telegram_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Administrator','superadmin','admin@gmail.com',NULL,'$2y$12$B8dXwjD0IyjmNGalGnvGReyIbqYAJsU3dHZfz9/NeoPMg/KzW/ksS',NULL,268015883,'rachmanj','2026-07-21 02:35:24','2026-06-26 18:58:40','2026-06-27 12:30:33'),(2,'Kasir','kasir','kasir@gmail.com',NULL,'$2y$12$tc.ZkxgzwzP02vsqBIit1.j2iHFiLyB5FCZGCz.xgd62R33H4NcS2',NULL,NULL,NULL,NULL,'2026-06-26 18:58:40','2026-06-27 10:58:09'),(3,'Sofie','sofie','sofie@gmail.com',NULL,'$2y$12$zSIF2t/hcwlHkocsoLZoYexWnM9EQGxysBBtsy0PRLDtB8Xj8wwqq',NULL,NULL,NULL,NULL,'2026-06-27 12:31:14','2026-06-27 12:31:14'),(4,'Ririn','ririn','ririn@gmail.com',NULL,'$2y$12$t0S/TNkSPaMRfYWii.FenulE5H2p5vREmnMX5B7LtfCfp6ISpfk7a',NULL,NULL,NULL,NULL,'2026-06-27 12:31:47','2026-06-27 12:31:47'),(5,'Nabila','nabila','nabila@gmail.com',NULL,'$2y$12$y3AhW3qaXV8Z4lN0tY088OZ/btir6jnCdBy7Okz779LsD.rL787ni',NULL,NULL,NULL,NULL,'2026-06-27 12:32:15','2026-06-27 12:32:15'),(6,'Rachman','rachman','rachmanj@gmail.com',NULL,'$2y$12$uRqlHMHeM6MOMddD4/4JZ.JgOrOwST8eeE8jztsQcizMaSXvPgcye',NULL,NULL,NULL,NULL,'2026-07-24 21:36:21','2026-07-24 21:36:21');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-25  9:26:30
