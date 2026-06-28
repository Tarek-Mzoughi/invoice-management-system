-- Migration for remaining Sales Documents and Stock Management
-- V1_25__sales_documents_rest.sql

-- 1. Article Table Updates
ALTER TABLE `article`
ADD COLUMN `stockQuantity` float NOT NULL DEFAULT 0,
ADD COLUMN `isService` tinyint(1) NOT NULL DEFAULT 0;

-- 2. Stock Movement Table
CREATE TABLE IF NOT EXISTS `stock_movement` (
    `id` int NOT NULL AUTO_INCREMENT,
    `articleId` int NOT NULL,
    `quantity` float NOT NULL DEFAULT 0,
    `direction` enum('IN', 'OUT') NOT NULL,
    `documentType` enum(
        'quotation',
        'invoice',
        'delivery_note',
        'goods_issue_note',
        'customer_order',
        'honorary_note',
        'credit_note',
        'return_note'
    ) NOT NULL,
    `documentId` int NOT NULL,
    `date` timestamp DEFAULT NOW(),
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    KEY `FK_article_stock_movement` (`articleId`),
    CONSTRAINT `FK_article_stock_movement` FOREIGN KEY (`articleId`) REFERENCES `article` (`id`) ON DELETE CASCADE
);

-- 3. Customer Order Tables
CREATE TABLE IF NOT EXISTS `customer_order_meta_data` (
    `id` int NOT NULL AUTO_INCREMENT,
    `showInvoiceAddress` boolean DEFAULT TRUE,
    `showDeliveryAddress` boolean DEFAULT TRUE,
    `showArticleDescription` boolean DEFAULT TRUE,
    `hasBankingDetails` boolean DEFAULT TRUE,
    `hasGeneralConditions` boolean DEFAULT TRUE,
    `taxSummary` json DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `customer_order` (
    `id` int NOT NULL AUTO_INCREMENT,
    `quotationId` int DEFAULT NULL,
    `sequential` varchar(25) NOT NULL UNIQUE,
    `activityType` enum ('selling', 'buying') NOT NULL DEFAULT 'selling',
    `date` datetime DEFAULT NULL,
    `dueDate` datetime DEFAULT NULL,
    `object` varchar(255) DEFAULT NULL,
    `generalConditions` varchar(1024) DEFAULT NULL,
    `status` enum (
        'draft',
        'validated',
        'canceled'
    ) DEFAULT 'draft',
    `discount` float DEFAULT NULL,
    `discount_type` enum (
        'PERCENTAGE',
        'AMOUNT'
    ) DEFAULT NULL,
    `subTotal` float DEFAULT NULL,
    `total` float DEFAULT NULL,
    `currencyId` int NOT NULL,
    `firmId` int NOT NULL,
    `interlocutorId` int NOT NULL,
    `cabinetId` int NOT NULL,
    `customerOrderMetaDataId` int NOT NULL,
    `notes` varchar(1024) DEFAULT NULL,
    `bankAccountId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_currency_customer_order` FOREIGN KEY (`currencyId`) REFERENCES `currency` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_firm_customer_order` FOREIGN KEY (`firmId`) REFERENCES `firm` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_interlocutor_customer_order` FOREIGN KEY (`interlocutorId`) REFERENCES `interlocutor` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_cabinet_customer_order` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_bank_account_customer_order` FOREIGN KEY (`bankAccountId`) REFERENCES `bank_account` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_customer_order_meta_data_customer_order` FOREIGN KEY (`customerOrderMetaDataId`) REFERENCES `customer_order_meta_data` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_quotation_customer_order` FOREIGN KEY (`quotationId`) REFERENCES `quotation` (`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `article-customer-order-entry` (
    `id` int NOT NULL AUTO_INCREMENT,
    `unit_price` float DEFAULT NULL,
    `quantity` float DEFAULT NULL,
    `discount` float DEFAULT NULL,
    `discount_type` enum (
        'PERCENTAGE',
        'AMOUNT'
    ) DEFAULT NULL,
    `subTotal` float DEFAULT NULL,
    `total` float DEFAULT NULL,
    `articleId` int DEFAULT NULL,
    `customerOrderId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_article_article_customer_order_entry` FOREIGN KEY (`articleId`) REFERENCES `article` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_customer_order_article_customer_order_entry` FOREIGN KEY (`customerOrderId`) REFERENCES `customer_order` (`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `article-customer-order-entry-tax` (
    `id` int NOT NULL AUTO_INCREMENT,
    `articleCustomerOrderEntryId` int NOT NULL,
    `taxId` int NOT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_articleCustomerOrderEntry_article_customer_order_entry_tax` FOREIGN KEY (`articleCustomerOrderEntryId`) REFERENCES `article-customer-order-entry` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_tax_article_customer_order_entry_tax` FOREIGN KEY (`taxId`) REFERENCES `tax` (`id`) ON DELETE CASCADE
);

-- 4. Delivery Note Tables
CREATE TABLE IF NOT EXISTS `delivery_note_meta_data` (
    `id` int NOT NULL AUTO_INCREMENT,
    `showInvoiceAddress` boolean DEFAULT TRUE,
    `showDeliveryAddress` boolean DEFAULT TRUE,
    `showArticleDescription` boolean DEFAULT TRUE,
    `showPrices` boolean DEFAULT TRUE,
    `hasBankingDetails` boolean DEFAULT TRUE,
    `hasGeneralConditions` boolean DEFAULT TRUE,
    `vehicleRegistration` varchar(255) DEFAULT NULL,
    `driverName` varchar(255) DEFAULT NULL,
    `taxSummary` json DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `delivery_note` (
    `id` int NOT NULL AUTO_INCREMENT,
    `quotationId` int DEFAULT NULL,
    `customerOrderId` int DEFAULT NULL,
    `invoiceId` int DEFAULT NULL,
    `sequential` varchar(25) NOT NULL UNIQUE,
    `activityType` enum ('selling', 'buying') NOT NULL DEFAULT 'selling',
    `date` datetime DEFAULT NULL,
    `dueDate` datetime DEFAULT NULL,
    `object` varchar(255) DEFAULT NULL,
    `generalConditions` varchar(1024) DEFAULT NULL,
    `status` enum (
        'deliveryNote.status.draft',
        'deliveryNote.status.created',
        'deliveryNote.status.delivered',
        'deliveryNote.status.cancelled'
    ) DEFAULT 'deliveryNote.status.draft',
    `discount` float DEFAULT NULL,
    `discount_type` enum (
        'PERCENTAGE',
        'AMOUNT'
    ) DEFAULT NULL,
    `subTotal` float DEFAULT NULL,
    `total` float DEFAULT NULL,
    `currencyId` int NOT NULL,
    `firmId` int NOT NULL,
    `interlocutorId` int NOT NULL,
    `cabinetId` int NOT NULL,
    `deliveryNoteMetaDataId` int NOT NULL,
    `notes` varchar(1024) DEFAULT NULL,
    `bankAccountId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_currency_delivery_note` FOREIGN KEY (`currencyId`) REFERENCES `currency` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_firm_delivery_note` FOREIGN KEY (`firmId`) REFERENCES `firm` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_interlocutor_delivery_note` FOREIGN KEY (`interlocutorId`) REFERENCES `interlocutor` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_cabinet_delivery_note` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_bank_account_delivery_note` FOREIGN KEY (`bankAccountId`) REFERENCES `bank_account` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_delivery_note_meta_data_delivery_note` FOREIGN KEY (`deliveryNoteMetaDataId`) REFERENCES `delivery_note_meta_data` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `article-delivery-note-entry` (
    `id` int NOT NULL AUTO_INCREMENT,
    `unit_price` float DEFAULT NULL,
    `quantity` float DEFAULT NULL,
    `discount` float DEFAULT NULL,
    `discount_type` enum (
        'PERCENTAGE',
        'AMOUNT'
    ) DEFAULT NULL,
    `subTotal` float DEFAULT NULL,
    `total` float DEFAULT NULL,
    `articleId` int DEFAULT NULL,
    `deliveryNoteId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_article_article_delivery_note_entry` FOREIGN KEY (`articleId`) REFERENCES `article` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_delivery_note_article_delivery_note_entry` FOREIGN KEY (`deliveryNoteId`) REFERENCES `delivery_note` (`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `article-delivery-note-entry-tax` (
    `id` int NOT NULL AUTO_INCREMENT,
    `articleDeliveryNoteEntryId` int NOT NULL,
    `taxId` int NOT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_articleDeliveryNoteEntry_article_delivery_note_entry_tax` FOREIGN KEY (`articleDeliveryNoteEntryId`) REFERENCES `article-delivery-note-entry` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_tax_article_delivery_note_entry_tax` FOREIGN KEY (`taxId`) REFERENCES `tax` (`id`) ON DELETE CASCADE
);

-- 5. Goods Issue Note Tables
CREATE TABLE IF NOT EXISTS `goods_issue_note_meta_data` (
    `id` int NOT NULL AUTO_INCREMENT,
    `showInvoiceAddress` boolean DEFAULT TRUE,
    `showDeliveryAddress` boolean DEFAULT TRUE,
    `showArticleDescription` boolean DEFAULT TRUE,
    `showPrices` boolean DEFAULT TRUE,
    `hasBankingDetails` boolean DEFAULT TRUE,
    `hasGeneralConditions` boolean DEFAULT TRUE,
    `vehicleRegistration` varchar(255) DEFAULT NULL,
    `driverName` varchar(255) DEFAULT NULL,
    `taxSummary` json DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `goods_issue_note` (
    `id` int NOT NULL AUTO_INCREMENT,
    `quotationId` int DEFAULT NULL,
    `customerOrderId` int DEFAULT NULL,
    `invoiceId` int DEFAULT NULL,
    `sequential` varchar(25) NOT NULL UNIQUE,
    `activityType` enum ('selling', 'buying') NOT NULL DEFAULT 'selling',
    `date` datetime DEFAULT NULL,
    `dueDate` datetime DEFAULT NULL,
    `object` varchar(255) DEFAULT NULL,
    `generalConditions` varchar(1024) DEFAULT NULL,
    `status` enum (
        'goodsIssueNote.status.non_existent',
        'goodsIssueNote.status.expired',
        'goodsIssueNote.status.draft',
        'goodsIssueNote.status.created',
        'goodsIssueNote.status.validated',
        'goodsIssueNote.status.sent',
        'goodsIssueNote.status.issued',
        'goodsIssueNote.status.accepted',
        'goodsIssueNote.status.rejected',
        'goodsIssueNote.status.cancelled',
        'goodsIssueNote.status.invoiced'
    ) DEFAULT 'goodsIssueNote.status.draft',
    `discount` float DEFAULT NULL,
    `discount_type` enum (
        'PERCENTAGE',
        'AMOUNT'
    ) DEFAULT NULL,
    `subTotal` float DEFAULT NULL,
    `total` float DEFAULT NULL,
    `currencyId` int NOT NULL,
    `firmId` int NOT NULL,
    `interlocutorId` int NOT NULL,
    `cabinetId` int NOT NULL,
    `goodsIssueNoteMetaDataId` int NOT NULL,
    `notes` varchar(1024) DEFAULT NULL,
    `bankAccountId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_currency_goods_issue_note` FOREIGN KEY (`currencyId`) REFERENCES `currency` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_firm_goods_issue_note` FOREIGN KEY (`firmId`) REFERENCES `firm` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_interlocutor_goods_issue_note` FOREIGN KEY (`interlocutorId`) REFERENCES `interlocutor` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_cabinet_goods_issue_note` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_bank_account_goods_issue_note` FOREIGN KEY (`bankAccountId`) REFERENCES `bank_account` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_goods_issue_note_meta_data_goods_issue_note` FOREIGN KEY (`goodsIssueNoteMetaDataId`) REFERENCES `goods_issue_note_meta_data` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `article-goods-issue-note-entry` (
    `id` int NOT NULL AUTO_INCREMENT,
    `unit_price` float DEFAULT NULL,
    `quantity` float DEFAULT NULL,
    `discount` float DEFAULT NULL,
    `discount_type` enum (
        'PERCENTAGE',
        'AMOUNT'
    ) DEFAULT NULL,
    `subTotal` float DEFAULT NULL,
    `total` float DEFAULT NULL,
    `articleId` int DEFAULT NULL,
    `goodsIssueNoteId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_article_article_goods_issue_note_entry` FOREIGN KEY (`articleId`) REFERENCES `article` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_goods_issue_note_article_goods_issue_note_entry` FOREIGN KEY (`goodsIssueNoteId`) REFERENCES `goods_issue_note` (`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `article-goods-issue-note-entry-tax` (
    `id` int NOT NULL AUTO_INCREMENT,
    `articleGoodsIssueNoteEntryId` int NOT NULL,
    `taxId` int NOT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_articleGoodsIssueNoteEntry_article_goods_issue_note_entry_tax` FOREIGN KEY (`articleGoodsIssueNoteEntryId`) REFERENCES `article-goods-issue-note-entry` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_tax_article_goods_issue_note_entry_tax` FOREIGN KEY (`taxId`) REFERENCES `tax` (`id`) ON DELETE CASCADE
);

-- 6. Honorary Note Tables
CREATE TABLE IF NOT EXISTS `honorary_note_meta_data` (
    `id` int NOT NULL AUTO_INCREMENT,
    `showInvoiceAddress` boolean DEFAULT TRUE,
    `showDeliveryAddress` boolean DEFAULT TRUE,
    `showArticleDescription` boolean DEFAULT TRUE,
    `hasBankingDetails` boolean DEFAULT TRUE,
    `hasGeneralConditions` boolean DEFAULT TRUE,
    `taxSummary` json DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `honorary_note` (
    `id` int NOT NULL AUTO_INCREMENT,
    `sequential` varchar(25) NOT NULL UNIQUE,
    `activityType` enum ('selling', 'buying') NOT NULL DEFAULT 'selling',
    `date` datetime DEFAULT NULL,
    `dueDate` datetime DEFAULT NULL,
    `object` varchar(255) DEFAULT NULL,
    `generalConditions` varchar(1024) DEFAULT NULL,
    `status` enum (
        'draft',
        'sent',
        'validated',
        'paid',
        'unpaid',
        'expired',
        'archived'
    ) DEFAULT 'draft',
    `discount` float DEFAULT NULL,
    `discount_type` enum (
        'PERCENTAGE',
        'AMOUNT'
    ) DEFAULT NULL,
    `subTotal` float DEFAULT NULL,
    `total` float DEFAULT NULL,
    `currencyId` int NOT NULL,
    `firmId` int NOT NULL,
    `interlocutorId` int NOT NULL,
    `cabinetId` int NOT NULL,
    `honoraryNoteMetaDataId` int NOT NULL,
    `notes` varchar(1024) DEFAULT NULL,
    `bankAccountId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_currency_honorary_note` FOREIGN KEY (`currencyId`) REFERENCES `currency` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_firm_honorary_note` FOREIGN KEY (`firmId`) REFERENCES `firm` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_interlocutor_honorary_note` FOREIGN KEY (`interlocutorId`) REFERENCES `interlocutor` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_cabinet_honorary_note` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_bank_account_honorary_note` FOREIGN KEY (`bankAccountId`) REFERENCES `bank_account` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_honorary_note_meta_data_honorary_note` FOREIGN KEY (`honoraryNoteMetaDataId`) REFERENCES `honorary_note_meta_data` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `article_honorary_note_entry` (
    `id` int NOT NULL AUTO_INCREMENT,
    `unit_price` float DEFAULT NULL,
    `quantity` float DEFAULT NULL,
    `discount` float DEFAULT NULL,
    `discount_type` enum (
        'PERCENTAGE',
        'AMOUNT'
    ) DEFAULT NULL,
    `subTotal` float DEFAULT NULL,
    `total` float DEFAULT NULL,
    `articleId` int DEFAULT NULL,
    `honoraryNoteId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_article_article_honorary_note_entry` FOREIGN KEY (`articleId`) REFERENCES `article` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_honorary_note_article_honorary_note_entry` FOREIGN KEY (`honoraryNoteId`) REFERENCES `honorary_note` (`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `article_honorary_note_entry_tax` (
    `id` int NOT NULL AUTO_INCREMENT,
    `articleHonoraryNoteEntryId` int NOT NULL,
    `taxId` int NOT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_articleHonoraryNoteEntry_article_honorary_note_entry_tax` FOREIGN KEY (`articleHonoraryNoteEntryId`) REFERENCES `article_honorary_note_entry` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_tax_article_honorary_note_entry_tax` FOREIGN KEY (`taxId`) REFERENCES `tax` (`id`) ON DELETE CASCADE
);

-- 7. Credit Note Tables
CREATE TABLE IF NOT EXISTS `credit_note_meta_data` (
    `id` int NOT NULL AUTO_INCREMENT,
    `showInvoiceAddress` boolean DEFAULT TRUE,
    `showDeliveryAddress` boolean DEFAULT TRUE,
    `showArticleDescription` boolean DEFAULT TRUE,
    `showPrices` boolean DEFAULT TRUE,
    `hasBankingDetails` boolean DEFAULT TRUE,
    `hasGeneralConditions` boolean DEFAULT TRUE,
    `hasTaxStamp` boolean DEFAULT TRUE,
    `hasTaxWithholding` boolean DEFAULT TRUE,
    `vehicleRegistration` varchar(255) DEFAULT NULL,
    `driverName` varchar(255) DEFAULT NULL,
    `taxSummary` json DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `credit_note` (
    `id` int NOT NULL AUTO_INCREMENT,
    `sourceInvoiceId` int DEFAULT NULL,
    `quotationId` int DEFAULT NULL,
    `deliveryNoteId` int DEFAULT NULL,
    `goodsIssueNoteId` int DEFAULT NULL,
    `sequential` varchar(25) NOT NULL UNIQUE,
    `activityType` enum ('selling', 'buying') NOT NULL DEFAULT 'selling',
    `reference` varchar(255) DEFAULT NULL,
    `date` datetime DEFAULT NULL,
    `dueDate` datetime DEFAULT NULL,
    `object` varchar(255) DEFAULT NULL,
    `generalConditions` varchar(1024) DEFAULT NULL,
    `status` enum (
        'draft',
        'sent',
        'validated',
        'paid',
        'unpaid',
        'expired',
        'archived'
    ) DEFAULT 'draft',
    `discount` float DEFAULT NULL,
    `discount_type` enum (
        'PERCENTAGE',
        'AMOUNT'
    ) DEFAULT NULL,
    `subTotal` float DEFAULT NULL,
    `total` float DEFAULT NULL,
    `amountPaid` float DEFAULT 0,
    `currencyId` int NOT NULL,
    `firmId` int NOT NULL,
    `interlocutorId` int NOT NULL,
    `cabinetId` int NOT NULL,
    `creditNoteMetaDataId` int NOT NULL,
    `notes` varchar(1024) DEFAULT NULL,
    `bankAccountId` int DEFAULT NULL,
    `taxStampId` int DEFAULT NULL,
    `taxWithholdingId` int DEFAULT NULL,
    `taxWithholdingAmount` float DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_currency_credit_note` FOREIGN KEY (`currencyId`) REFERENCES `currency` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_firm_credit_note` FOREIGN KEY (`firmId`) REFERENCES `firm` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_interlocutor_credit_note` FOREIGN KEY (`interlocutorId`) REFERENCES `interlocutor` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_cabinet_credit_note` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_bank_account_credit_note` FOREIGN KEY (`bankAccountId`) REFERENCES `bank_account` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_credit_note_meta_data_credit_note` FOREIGN KEY (`creditNoteMetaDataId`) REFERENCES `credit_note_meta_data` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_source_invoice_credit_note` FOREIGN KEY (`sourceInvoiceId`) REFERENCES `invoice` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_quotation_credit_note` FOREIGN KEY (`quotationId`) REFERENCES `quotation` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_delivery_note_credit_note` FOREIGN KEY (`deliveryNoteId`) REFERENCES `delivery_note` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_goods_issue_note_credit_note` FOREIGN KEY (`goodsIssueNoteId`) REFERENCES `goods_issue_note` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_tax_stamp_credit_note` FOREIGN KEY (`taxStampId`) REFERENCES `tax` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_tax_withholding_credit_note` FOREIGN KEY (`taxWithholdingId`) REFERENCES `tax-withholding` (`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `article_credit_note_entry` (
    `id` int NOT NULL AUTO_INCREMENT,
    `unit_price` float DEFAULT NULL,
    `quantity` float DEFAULT NULL,
    `discount` float DEFAULT NULL,
    `discount_type` enum (
        'PERCENTAGE',
        'AMOUNT'
    ) DEFAULT NULL,
    `subTotal` float DEFAULT NULL,
    `total` float DEFAULT NULL,
    `articleId` int DEFAULT NULL,
    `creditNoteId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_article_article_credit_note_entry` FOREIGN KEY (`articleId`) REFERENCES `article` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_credit_note_article_credit_note_entry` FOREIGN KEY (`creditNoteId`) REFERENCES `credit_note` (`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `article_credit_note_entry_tax` (
    `id` int NOT NULL AUTO_INCREMENT,
    `articleCreditNoteEntryId` int NOT NULL,
    `taxId` int NOT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_articleCreditNoteEntry_article_credit_note_entry_tax` FOREIGN KEY (`articleCreditNoteEntryId`) REFERENCES `article_credit_note_entry` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_tax_article_credit_note_entry_tax` FOREIGN KEY (`taxId`) REFERENCES `tax` (`id`) ON DELETE CASCADE
);

-- 8. Return Note Tables
CREATE TABLE IF NOT EXISTS `return_note_meta_data` (
    `id` int NOT NULL AUTO_INCREMENT,
    `showInvoiceAddress` boolean DEFAULT TRUE,
    `showDeliveryAddress` boolean DEFAULT TRUE,
    `showArticleDescription` boolean DEFAULT TRUE,
    `showPrices` boolean DEFAULT TRUE,
    `hasBankingDetails` boolean DEFAULT TRUE,
    `hasGeneralConditions` boolean DEFAULT TRUE,
    `vehicleRegistration` varchar(255) DEFAULT NULL,
    `driverName` varchar(255) DEFAULT NULL,
    `taxSummary` json DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `return_note` (
    `id` int NOT NULL AUTO_INCREMENT,
    `sourceDeliveryNoteId` int DEFAULT NULL,
    `sourceGoodsIssueNoteId` int DEFAULT NULL,
    `sourceInvoiceId` int DEFAULT NULL,
    `sequential` varchar(25) NOT NULL UNIQUE,
    `activityType` enum ('selling', 'buying') NOT NULL DEFAULT 'selling',
    `date` datetime DEFAULT NULL,
    `dueDate` datetime DEFAULT NULL,
    `object` varchar(255) DEFAULT NULL,
    `generalConditions` varchar(1024) DEFAULT NULL,
    `status` enum (
        'returnNote.status.non_existent',
        'returnNote.status.expired',
        'returnNote.status.draft',
        'returnNote.status.validated',
        'returnNote.status.sent',
        'returnNote.status.accepted',
        'returnNote.status.rejected',
        'returnNote.status.cancelled',
        'returnNote.status.invoiced',
        'returnNote.status.archived'
    ) DEFAULT 'returnNote.status.draft',
    `discount` float DEFAULT NULL,
    `discount_type` enum (
        'PERCENTAGE',
        'AMOUNT'
    ) DEFAULT NULL,
    `subTotal` float DEFAULT NULL,
    `total` float DEFAULT NULL,
    `currencyId` int NOT NULL,
    `firmId` int NOT NULL,
    `interlocutorId` int NOT NULL,
    `cabinetId` int NOT NULL,
    `returnNoteMetaDataId` int NOT NULL,
    `notes` varchar(1024) DEFAULT NULL,
    `bankAccountId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_currency_return_note` FOREIGN KEY (`currencyId`) REFERENCES `currency` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_firm_return_note` FOREIGN KEY (`firmId`) REFERENCES `firm` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_interlocutor_return_note` FOREIGN KEY (`interlocutorId`) REFERENCES `interlocutor` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_cabinet_return_note` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_bank_account_return_note` FOREIGN KEY (`bankAccountId`) REFERENCES `bank_account` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_return_note_meta_data_return_note` FOREIGN KEY (`returnNoteMetaDataId`) REFERENCES `return_note_meta_data` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_delivery_note_return_note` FOREIGN KEY (`sourceDeliveryNoteId`) REFERENCES `delivery_note` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_goods_issue_note_return_note` FOREIGN KEY (`sourceGoodsIssueNoteId`) REFERENCES `goods_issue_note` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_invoice_return_note` FOREIGN KEY (`sourceInvoiceId`) REFERENCES `invoice` (`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `article_return_note_entry` (
    `id` int NOT NULL AUTO_INCREMENT,
    `unit_price` float DEFAULT NULL,
    `quantity` float DEFAULT NULL,
    `discount` float DEFAULT NULL,
    `discount_type` enum (
        'PERCENTAGE',
        'AMOUNT'
    ) DEFAULT NULL,
    `subTotal` float DEFAULT NULL,
    `total` float DEFAULT NULL,
    `articleId` int DEFAULT NULL,
    `returnNoteId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_article_article_return_note_entry` FOREIGN KEY (`articleId`) REFERENCES `article` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_return_note_article_return_note_entry` FOREIGN KEY (`returnNoteId`) REFERENCES `return_note` (`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `article_return_note_entry_tax` (
    `id` int NOT NULL AUTO_INCREMENT,
    `articleReturnNoteEntryId` int NOT NULL,
    `taxId` int NOT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_articleReturnNoteEntry_article_return_note_entry_tax` FOREIGN KEY (`articleReturnNoteEntryId`) REFERENCES `article_return_note_entry` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_tax_article_return_note_entry_tax` FOREIGN KEY (`taxId`) REFERENCES `tax` (`id`) ON DELETE CASCADE
);

-- 9. File Storage Tables
CREATE TABLE IF NOT EXISTS `customer-order-upload` (
    `id` int NOT NULL AUTO_INCREMENT,
    `customerOrderId` int DEFAULT NULL,
    `uploadId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_customer_order_upload` FOREIGN KEY (`customerOrderId`) REFERENCES `customer_order` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_upload_customer_order_upload` FOREIGN KEY (`uploadId`) REFERENCES `storage` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `delivery-note-upload` (
    `id` int NOT NULL AUTO_INCREMENT,
    `deliveryNoteId` int DEFAULT NULL,
    `uploadId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_delivery_note_upload` FOREIGN KEY (`deliveryNoteId`) REFERENCES `delivery_note` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_upload_delivery_note_upload` FOREIGN KEY (`uploadId`) REFERENCES `storage` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `goods-issue-note-upload` (
    `id` int NOT NULL AUTO_INCREMENT,
    `goodsIssueNoteId` int DEFAULT NULL,
    `uploadId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_goods_issue_note_upload` FOREIGN KEY (`goodsIssueNoteId`) REFERENCES `goods_issue_note` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_upload_goods_issue_note_upload` FOREIGN KEY (`uploadId`) REFERENCES `storage` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `honorary_note_upload` (
    `id` int NOT NULL AUTO_INCREMENT,
    `honoraryNoteId` int DEFAULT NULL,
    `uploadId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_honorary_note_upload` FOREIGN KEY (`honoraryNoteId`) REFERENCES `honorary_note` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_upload_honorary_note_upload` FOREIGN KEY (`uploadId`) REFERENCES `storage` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `credit-note-upload` (
    `id` int NOT NULL AUTO_INCREMENT,
    `creditNoteId` int DEFAULT NULL,
    `uploadId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_credit_note_upload` FOREIGN KEY (`creditNoteId`) REFERENCES `credit_note` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_upload_credit_note_upload` FOREIGN KEY (`uploadId`) REFERENCES `storage` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `return-note-upload` (
    `id` int NOT NULL AUTO_INCREMENT,
    `returnNoteId` int DEFAULT NULL,
    `uploadId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_return_note_upload` FOREIGN KEY (`returnNoteId`) REFERENCES `return_note` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_upload_return_note_upload` FOREIGN KEY (`uploadId`) REFERENCES `storage` (`id`) ON DELETE CASCADE
);

-- Add relation columns to invoice table
ALTER TABLE `invoice`
ADD COLUMN `customerOrderId` INT DEFAULT NULL,
ADD COLUMN `deliveryNoteId` INT DEFAULT NULL,
ADD COLUMN `goodsIssueNoteId` INT DEFAULT NULL,
ADD COLUMN `returnNoteId` INT DEFAULT NULL,
ADD CONSTRAINT `FK_invoice_customer_order` FOREIGN KEY (`customerOrderId`) REFERENCES `customer_order` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `FK_invoice_delivery_note` FOREIGN KEY (`deliveryNoteId`) REFERENCES `delivery_note` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `FK_invoice_goods_issue_note` FOREIGN KEY (`goodsIssueNoteId`) REFERENCES `goods_issue_note` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `FK_invoice_return_note_ref` FOREIGN KEY (`returnNoteId`) REFERENCES `return_note` (`id`) ON DELETE SET NULL;

-- 10. Sequences Seeding
INSERT IGNORE INTO `sequences` (`label`, `prefix`, `dateFormat`, `next`) VALUES
('customer_order', 'COM', 'YYYYMM', 1),
('delivery_note', 'BLV', 'YYYYMM', 1),
('goods_issue_note', 'BSO', 'YYYYMM', 1),
('honorary_note', 'HON', 'YYYYMM', 1),
('credit_note', 'AVO', 'YYYYMM', 1),
('return_note', 'BRT', 'YYYYMM', 1);
