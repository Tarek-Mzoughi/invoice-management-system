-- Invoicing System generic PDF template editor
-- Keeps existing EJS templates intact and adds an additive JSON-template system.

CREATE TABLE IF NOT EXISTS `document_template_categories` (
    `id` int NOT NULL AUTO_INCREMENT,
    `label` varchar(255) NOT NULL,
    `slug` varchar(255) NOT NULL,
    `description` text DEFAULT NULL,
    `documentType` enum(
        'INVOICE',
        'QUOTE',
        'CUSTOMER_ORDER',
        'DELIVERY_NOTE',
        'GOODS_ISSUE_NOTE',
        'CREDIT_NOTE',
        'RETURN_NOTE',
        'PURCHASE_ORDER',
        'SUPPLIER_INVOICE',
        'SUPPLIER_CREDIT_NOTE',
        'RECEIPT',
        'CUSTOM_DOCUMENT'
    ) DEFAULT NULL,
    `cabinetId` int NOT NULL DEFAULT 1,
    `createdAt` timestamp DEFAULT NOW(),
    `updatedAt` timestamp DEFAULT NOW(),
    `deletedAt` timestamp DEFAULT NULL,
    `isDeletionRestricted` boolean DEFAULT FALSE,
    PRIMARY KEY (`id`),
    KEY `IDX_document_template_categories_cabinet` (`cabinetId`),
    KEY `IDX_document_template_categories_type` (`documentType`),
    CONSTRAINT `FK_document_template_categories_cabinet`
        FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `document_templates` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `slug` varchar(255) NOT NULL,
    `documentType` enum(
        'INVOICE',
        'QUOTE',
        'CUSTOMER_ORDER',
        'DELIVERY_NOTE',
        'GOODS_ISSUE_NOTE',
        'CREDIT_NOTE',
        'RETURN_NOTE',
        'PURCHASE_ORDER',
        'SUPPLIER_INVOICE',
        'SUPPLIER_CREDIT_NOTE',
        'RECEIPT',
        'CUSTOM_DOCUMENT'
    ) NOT NULL,
    `status` enum('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `isDefault` boolean NOT NULL DEFAULT FALSE,
    `versionNumber` int NOT NULL DEFAULT 1,
    `templateSchema` json DEFAULT NULL,
    `pageSettings` json DEFAULT NULL,
    `variablesConfig` json DEFAULT NULL,
    `thumbnailUrl` text DEFAULT NULL,
    `thumbnailStorageId` int DEFAULT NULL,
    `categoryId` int DEFAULT NULL,
    `cabinetId` int NOT NULL DEFAULT 1,
    `createdById` varchar(36) DEFAULT NULL,
    `updatedById` varchar(36) DEFAULT NULL,
    `createdAt` timestamp DEFAULT NOW(),
    `updatedAt` timestamp DEFAULT NOW(),
    `deletedAt` timestamp DEFAULT NULL,
    `isDeletionRestricted` boolean DEFAULT FALSE,
    PRIMARY KEY (`id`),
    KEY `IDX_document_templates_cabinet_document_type` (`cabinetId`, `documentType`),
    KEY `IDX_document_templates_default` (`cabinetId`, `documentType`, `isDefault`),
    KEY `IDX_document_templates_status` (`status`),
    KEY `FK_document_templates_thumbnail_storage` (`thumbnailStorageId`),
    KEY `FK_document_templates_category` (`categoryId`),
    CONSTRAINT `FK_document_templates_thumbnail_storage`
        FOREIGN KEY (`thumbnailStorageId`) REFERENCES `storage` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_document_templates_category`
        FOREIGN KEY (`categoryId`) REFERENCES `document_template_categories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_document_templates_cabinet`
        FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `document_template_versions` (
    `id` int NOT NULL AUTO_INCREMENT,
    `templateId` int NOT NULL,
    `versionNumber` int NOT NULL,
    `name` varchar(255) NOT NULL,
    `status` enum('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `templateSchema` json DEFAULT NULL,
    `pageSettings` json DEFAULT NULL,
    `variablesConfig` json DEFAULT NULL,
    `changeDescription` text DEFAULT NULL,
    `createdById` varchar(36) DEFAULT NULL,
    `createdAt` timestamp DEFAULT NOW(),
    `updatedAt` timestamp DEFAULT NOW(),
    `deletedAt` timestamp DEFAULT NULL,
    `isDeletionRestricted` boolean DEFAULT FALSE,
    PRIMARY KEY (`id`),
    KEY `IDX_document_template_versions_template` (`templateId`, `versionNumber`),
    CONSTRAINT `FK_document_template_versions_template`
        FOREIGN KEY (`templateId`) REFERENCES `document_templates` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `document_template_assets` (
    `id` int NOT NULL AUTO_INCREMENT,
    `templateId` int DEFAULT NULL,
    `storageId` int NOT NULL,
    `assetType` enum('IMAGE', 'LOGO', 'FONT', 'THUMBNAIL', 'ATTACHMENT') NOT NULL DEFAULT 'IMAGE',
    `name` varchar(255) NOT NULL,
    `metadata` json DEFAULT NULL,
    `createdAt` timestamp DEFAULT NOW(),
    `updatedAt` timestamp DEFAULT NOW(),
    `deletedAt` timestamp DEFAULT NULL,
    `isDeletionRestricted` boolean DEFAULT FALSE,
    PRIMARY KEY (`id`),
    KEY `IDX_document_template_assets_template` (`templateId`),
    KEY `FK_document_template_assets_storage` (`storageId`),
    CONSTRAINT `FK_document_template_assets_template`
        FOREIGN KEY (`templateId`) REFERENCES `document_templates` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_document_template_assets_storage`
        FOREIGN KEY (`storageId`) REFERENCES `storage` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `generated_documents` (
    `id` int NOT NULL AUTO_INCREMENT,
    `templateId` int DEFAULT NULL,
    `templateVersionId` int DEFAULT NULL,
    `documentType` enum(
        'INVOICE',
        'QUOTE',
        'CUSTOMER_ORDER',
        'DELIVERY_NOTE',
        'GOODS_ISSUE_NOTE',
        'CREDIT_NOTE',
        'RETURN_NOTE',
        'PURCHASE_ORDER',
        'SUPPLIER_INVOICE',
        'SUPPLIER_CREDIT_NOTE',
        'RECEIPT',
        'CUSTOM_DOCUMENT'
    ) NOT NULL,
    `sourceDocumentId` int DEFAULT NULL,
    `cabinetId` int NOT NULL DEFAULT 1,
    `storageId` int DEFAULT NULL,
    `filename` varchar(255) NOT NULL,
    `mimeType` varchar(128) NOT NULL DEFAULT 'application/pdf',
    `status` enum('GENERATED', 'FAILED') NOT NULL DEFAULT 'GENERATED',
    `errorMessage` text DEFAULT NULL,
    `generatedById` varchar(36) DEFAULT NULL,
    `createdAt` timestamp DEFAULT NOW(),
    `updatedAt` timestamp DEFAULT NOW(),
    `deletedAt` timestamp DEFAULT NULL,
    `isDeletionRestricted` boolean DEFAULT FALSE,
    PRIMARY KEY (`id`),
    KEY `IDX_generated_documents_template` (`templateId`),
    KEY `IDX_generated_documents_source` (`documentType`, `sourceDocumentId`),
    KEY `FK_generated_documents_template_version` (`templateVersionId`),
    KEY `FK_generated_documents_cabinet` (`cabinetId`),
    KEY `FK_generated_documents_storage` (`storageId`),
    CONSTRAINT `FK_generated_documents_template`
        FOREIGN KEY (`templateId`) REFERENCES `document_templates` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_generated_documents_template_version`
        FOREIGN KEY (`templateVersionId`) REFERENCES `document_template_versions` (`id`) ON DELETE SET NULL,
    CONSTRAINT `FK_generated_documents_cabinet`
        FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_generated_documents_storage`
        FOREIGN KEY (`storageId`) REFERENCES `storage` (`id`) ON DELETE SET NULL
);
