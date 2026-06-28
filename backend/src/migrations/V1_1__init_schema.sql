-- Ensure all baseline tables exist (fixes missing tables when DATABASE_SYNCHRONIZE=false)
CREATE TABLE IF NOT EXISTS `storage` (
    `id` int NOT NULL AUTO_INCREMENT,
    `slug` varchar(1024) NOT NULL,
    `filename` varchar(1024) NOT NULL,
    `relativePath` text NOT NULL,
    `mimeType` varchar(255) NOT NULL,
    `size` int NOT NULL,
    `isTemporary` boolean NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deletedAt` TIMESTAMP NULL DEFAULT NULL,
    `isDeletionRestricted` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `roles` (
    `id` varchar(36) NOT NULL,
    `label` varchar(255) NOT NULL,
    `description` varchar(255) DEFAULT NULL,
    `cabinetId` int DEFAULT NULL,
    `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deletedAt` timestamp NULL DEFAULT NULL,
    `isDeletionRestricted` tinyint(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `permissions` (
    `id` varchar(255) NOT NULL,
    `label` varchar(255) NOT NULL,
    `description` varchar(255) DEFAULT NULL,
    `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deletedAt` timestamp NULL DEFAULT NULL,
    `isDeletionRestricted` tinyint(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `role_permissions` (
    `id` int NOT NULL AUTO_INCREMENT,
    `roleId` varchar(36) NOT NULL,
    `permissionId` varchar(255) NOT NULL,
    `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deletedAt` timestamp NULL DEFAULT NULL,
    `isDeletionRestricted` tinyint(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `FK_role_permissions_role` (`roleId`),
    KEY `FK_role_permissions_permission` (`permissionId`),
    CONSTRAINT `FK_role_permissions_role` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_role_permissions_permission` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `profiles` (
    `id` int NOT NULL AUTO_INCREMENT,
    `phone` varchar(255) DEFAULT NULL,
    `cin` varchar(255) DEFAULT NULL,
    `bio` text DEFAULT NULL,
    `gender` enum('Male', 'Female') DEFAULT NULL,
    `isPrivate` tinyint(1) NOT NULL DEFAULT 0,
    `regionId` int DEFAULT NULL,
    `pictureId` int DEFAULT NULL,
    `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deletedAt` timestamp NULL DEFAULT NULL,
    `isDeletionRestricted` tinyint(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `profiles_unique_cin` (`cin`),
    CONSTRAINT `FK_profiles_picture` FOREIGN KEY (`pictureId`) REFERENCES `storage` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `users` (
    `id` varchar(36) NOT NULL,
    `username` varchar(255) NOT NULL,
    `firstName` varchar(255) DEFAULT NULL,
    `lastName` varchar(255) DEFAULT NULL,
    `email` varchar(255) NOT NULL,
    `password` varchar(255) NOT NULL,
    `dateOfBirth` datetime DEFAULT NULL,
    `isActive` tinyint(1) NOT NULL DEFAULT 0,
    `isApproved` tinyint(1) NOT NULL DEFAULT 0,
    `mustChangePassword` tinyint(1) NOT NULL DEFAULT 0,
    `image` varchar(255) DEFAULT NULL,
    `roleId` varchar(36) DEFAULT NULL,
    `profileId` int DEFAULT NULL,
    `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deletedAt` timestamp NULL DEFAULT NULL,
    `isDeletionRestricted` tinyint(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `users_unique_username` (`username`),
    UNIQUE KEY `users_unique_email` (`email`),
    CONSTRAINT `FK_users_role` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_users_profile` FOREIGN KEY (`profileId`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `sequences` (
    `id` int NOT NULL AUTO_INCREMENT,
    `label` varchar(255) NOT NULL,
    `prefix` varchar(3) DEFAULT NULL,
    `dateFormat` enum ('YYYY', 'YYMM', 'YYYYMM') DEFAULT 'YYYY',
    `next` int NOT NULL DEFAULT 1,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    UNIQUE KEY `IDX_sequences_label` (`label`)
);

CREATE TABLE IF NOT EXISTS `templates` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) DEFAULT NULL,
    `content` LONGTEXT DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deletedAt` TIMESTAMP NULL DEFAULT NULL,
    `isDeletionRestricted` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `template-styles` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `content` LONGTEXT DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deletedAt` TIMESTAMP NULL DEFAULT NULL,
    `isDeletionRestricted` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `IDX_template_styles_name` (`name`)
);

CREATE TABLE IF NOT EXISTS `template_template_styles` (
    `templateId` VARCHAR(36) NOT NULL,
    `styleId` VARCHAR(36) NOT NULL,
    PRIMARY KEY (`templateId`, `styleId`),
    KEY `FK_tts_templateId` (`templateId`),
    KEY `FK_tts_styleId` (`styleId`)
);

CREATE TABLE
    IF NOT EXISTS `app_config` (
        `id` int NOT NULL AUTO_INCREMENT,
        `key` varchar(255) NOT NULL UNIQUE,
        `value` json DEFAULT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    IF NOT EXISTS `activity` (
        `id` int NOT NULL AUTO_INCREMENT,
        `label` varchar(255) DEFAULT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    IF NOT EXISTS `country` (
        `id` int NOT NULL,
        `alpha2Code` varchar(2) DEFAULT NULL,
        `alpha3Code` varchar(3) DEFAULT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    IF NOT EXISTS `address` (
        `id` int NOT NULL AUTO_INCREMENT,
        `address` varchar(255) DEFAULT NULL,
        `address2` varchar(255) DEFAULT NULL,
        `region` varchar(255) DEFAULT NULL,
        `zipcode` varchar(10) DEFAULT NULL,
        `countryId` int DEFAULT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`),
        KEY `FK_country_address` (`countryId`),
        CONSTRAINT `FK_countryId` FOREIGN KEY (`countryId`) REFERENCES `country` (`id`) ON DELETE SET NULL
    );

CREATE TABLE
    IF NOT EXISTS `article` (
        `id` int NOT NULL AUTO_INCREMENT,
        `title` varchar(50) DEFAULT NULL,
        `description` varchar(255) DEFAULT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    IF NOT EXISTS `currency` (
        `id` int NOT NULL AUTO_INCREMENT,
        `label` varchar(255) DEFAULT NULL,
        `code` varchar(3) DEFAULT NULL,
        `symbol` varchar(10) DEFAULT NULL,
        `digitAfterComma` int DEFAULT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    IF NOT EXISTS `cabinet` (
        `id` int NOT NULL AUTO_INCREMENT,
        `enterpriseName` varchar(255) DEFAULT NULL UNIQUE,
        `email` varchar(255) DEFAULT NULL,
        `phone` varchar(50) DEFAULT NULL,
        `taxIdNumber` varchar(50) DEFAULT NULL UNIQUE,
        `activityId` int DEFAULT NULL,
        `currencyId` int DEFAULT NULL,
        `addressId` int DEFAULT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`),
        KEY `FK_activity_cabinet` (`activityId`),
        KEY `FK_currency_cabinet` (`currencyId`),
        KEY `FK_addressId_cabinet` (`addressId`),
        CONSTRAINT `FK_activity_cabinet` FOREIGN KEY (`activityId`) REFERENCES `activity` (`id`) ON DELETE SET NULL,
        CONSTRAINT `FK_currency_cabinet` FOREIGN KEY (`currencyId`) REFERENCES `currency` (`id`) ON DELETE SET NULL,
        CONSTRAINT `FK_address_cabinet` FOREIGN KEY (`addressId`) REFERENCES `address` (`id`) ON DELETE SET NULL
    );

CREATE TABLE
    IF NOT EXISTS `bank_account` (
        `id` int NOT NULL AUTO_INCREMENT,
        `name` varchar(255) DEFAULT NULL,
        `bic` varchar(11) DEFAULT NULL,
        `rib` varchar(20) DEFAULT NULL,
        `iban` varchar(30) DEFAULT NULL,
        `currencyId` int DEFAULT NULL,
        `isMain` boolean DEFAULT TRUE,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`),
        KEY `FK_currency_bank_account` (`currencyId`),
        CONSTRAINT `FK_currencyId` FOREIGN KEY (`currencyId`) REFERENCES `currency` (`id`) ON DELETE SET NULL
    );

CREATE TABLE
    IF NOT EXISTS `payment_condition` (
        `id` int NOT NULL AUTO_INCREMENT,
        `label` varchar(255) DEFAULT NULL,
        `description` varchar(1024) DEFAULT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    IF NOT EXISTS `tax` (
        `id` int NOT NULL AUTO_INCREMENT,
        `label` varchar(255) DEFAULT NULL,
        `rate` float DEFAULT NULL,
        `isSpecial` boolean DEFAULT FALSE,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    IF NOT EXISTS `firm` (
        `id` int NOT NULL AUTO_INCREMENT,
        `name` varchar(255) NOT NULL,
        `website` varchar(255) NOT NULL,
        `isPerson` boolean DEFAULT TRUE,
        `taxIdNumber` varchar(50) DEFAULT NULL,
        `notes` varchar(1024) NOT NULL,
        `phone` varchar(25) DEFAULT NULL,
        `activityId` int DEFAULT NULL,
        `currencyId` int DEFAULT NULL,
        `paymentConditionId` int DEFAULT NULL,
        `invoicingAddressId` int DEFAULT NULL,
        `deliveryAddressId` int DEFAULT NULL,
        `cabinetId` int DEFAULT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`),
        KEY `FK_activity_firm` (`activityId`),
        KEY `FK_currency_firm` (`currencyId`),
        KEY `FK_paymentCondition_firm` (`paymentConditionId`),
        KEY `FK_invoicingAddress_firm` (`invoicingAddressId`),
        KEY `FK_deliveryAddress_firm` (`deliveryAddressId`),
        KEY `FK_cabinet_firm` (`cabinetId`),
        CONSTRAINT `FK_activity_firm` FOREIGN KEY (`activityId`) REFERENCES `activity` (`id`) ON DELETE SET NULL,
        CONSTRAINT `FK_currency_firm` FOREIGN KEY (`currencyId`) REFERENCES `currency` (`id`) ON DELETE SET NULL,
        CONSTRAINT `FK_paymentCondition_firm` FOREIGN KEY (`paymentConditionId`) REFERENCES `payment_condition` (`id`) ON DELETE SET NULL,
        CONSTRAINT `FK_invoicingAddress_firm` FOREIGN KEY (`invoicingAddressId`) REFERENCES `address` (`id`) ON DELETE SET NULL,
        CONSTRAINT `FK_deliveryAddress_firm` FOREIGN KEY (`deliveryAddressId`) REFERENCES `address` (`id`) ON DELETE SET NULL,
        CONSTRAINT `FK_cabinet_firm` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE SET NULL
    );

CREATE TABLE
    IF NOT EXISTS `interlocutor` (
        `id` int NOT NULL AUTO_INCREMENT,
        `title` enum ('Mr.', 'Mrs.', 'Miss.', 'Ms.', 'Dr.', 'Prof.') DEFAULT NULL,
        `name` varchar(255) DEFAULT NULL,
        `surname` varchar(255) DEFAULT NULL,
        `phone` varchar(25) DEFAULT NULL,
        `email` varchar(255) DEFAULT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    IF NOT EXISTS `firm_interlocutor_entry` (
        `id` int NOT NULL AUTO_INCREMENT,
        `firmId` int NOT NULL,
        `interlocutorId` int NOT NULL,
        `isMain` boolean DEFAULT FALSE,
        `position` varchar(255) NOT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`),
        KEY `FK_firm_firm_interlocutor_entry` (`firmId`),
        KEY `FK_interlocutor_firm_interlocutor_entry` (`interlocutorId`),
        CONSTRAINT `FK_firm_firm_interlocutor_entry` FOREIGN KEY (`firmId`) REFERENCES `firm` (`id`) ON DELETE CASCADE,
        CONSTRAINT `FK_interlocutor_firm_interlocutor_entry` FOREIGN KEY (`interlocutorId`) REFERENCES `interlocutor` (`id`) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS `quotation_meta_data` (
        `id` int NOT NULL AUTO_INCREMENT,
        `showInvoiceAddress` boolean DEFAULT TRUE,
        `showDeliveryAddress` boolean DEFAULT TRUE,
        `showArticleDescription` boolean DEFAULT TRUE,
        `hasBankingDetails` boolean DEFAULT TRUE,
        `hasGeneralConditions` boolean DEFAULT TRUE,
        `hasTaxStamp` boolean DEFAULT TRUE,
        `taxSummary` json DEFAULT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    IF NOT EXISTS `quotation` (
        `id` int NOT NULL AUTO_INCREMENT,
        `sequential` varchar(25) NOT NULL UNIQUE,
        `date` datetime DEFAULT NULL,
        `dueDate` datetime DEFAULT NULL,
        `object` varchar(255) DEFAULT NULL,
        `generalConditions` varchar(1024) DEFAULT NULL,
        `status` enum (
            'quotation.status.non_existent',
            'quotation.status.expired',
            'quotation.status.draft',
            'quotation.status.created',
            'quotation.status.validated',
            'quotation.status.sent',
            'quotation.status.accepted',
            'quotation.status.rejected'
        ) DEFAULT NULL,
        `discount` float DEFAULT NULL,
        `discount_type` enum ('PERCENTAGE', 'AMOUNT') DEFAULT NULL,
        `subTotal` float DEFAULT NULL,
        `total` float DEFAULT NULL,
        `currencyId` int NOT NULL,
        `firmId` int NOT NULL,
        `interlocutorId` int NOT NULL,
        `cabinetId` int NOT NULL,
        `quotationMetaDataId` int NOT NULL,
        `notes` varchar(1024) DEFAULT NULL,
        `taxStamp` float DEFAULT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`),
        KEY `FK_currency_quotation` (`currencyId`),
        KEY `FK_firm_quotation` (`firmId`),
        KEY `FK_interlocutor_quotation` (`interlocutorId`),
        KEY `FK_cabinet_quotation` (`cabinetId`),
        KEY `FK_quotation_meta_data_quotation` (`quotationMetaDataId`),
        CONSTRAINT `FK_currency_quotation` FOREIGN KEY (`currencyId`) REFERENCES `currency` (`id`) ON DELETE CASCADE,
        CONSTRAINT `FK_firm_quotation` FOREIGN KEY (`firmId`) REFERENCES `firm` (`id`) ON DELETE CASCADE,
        CONSTRAINT `FK_interlocutor_quotation` FOREIGN KEY (`interlocutorId`) REFERENCES `interlocutor` (`id`) ON DELETE CASCADE,
        CONSTRAINT `FK_cabinet_quotation` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE,
        CONSTRAINT `FK_quotation_meta_data_quotation` FOREIGN KEY (`quotationMetaDataId`) REFERENCES `quotation_meta_data` (`id`) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS `article-quotation-entry` (
        `id` int NOT NULL AUTO_INCREMENT,
        `unit_price` float DEFAULT NULL,
        `quantity` float DEFAULT NULL,
        `discount` float DEFAULT NULL,
        `discount_type` enum ('PERCENTAGE', 'AMOUNT') DEFAULT NULL,
        `subTotal` float DEFAULT NULL,
        `total` float DEFAULT NULL,
        `articleId` int DEFAULT NULL,
        `quotationId` int DEFAULT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`),
        KEY `FK_article_article-quotation-entry` (`articleId`),
        KEY `FK_quotation_article-quotation-entry` (`quotationId`),
        CONSTRAINT `FK_article_article-quotation-entry` FOREIGN KEY (`articleId`) REFERENCES `article` (`id`) ON DELETE SET NULL,
        CONSTRAINT `FK_quotation_article-quotation-entry` FOREIGN KEY (`quotationId`) REFERENCES `quotation` (`id`) ON DELETE SET NULL
    );

CREATE TABLE
    IF NOT EXISTS `article-quotation-entry-tax` (
        `id` int NOT NULL AUTO_INCREMENT,
        `articleQuotationEntryId` int NOT NULL,
        `taxId` int NOT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW(),
        `updatedAt` TIMESTAMP DEFAULT NOW(),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`),
        KEY `FK_articleQuotationEntry_article-quotation-entry-tax` (`articleQuotationEntryId`),
        KEY `FK_tax_article-quotation-entry-tax` (`taxId`),
        CONSTRAINT `FK_articleQuotationEntry_article-quotation-entry-tax` FOREIGN KEY (`articleQuotationEntryId`) REFERENCES `article-quotation-entry` (`id`) ON DELETE CASCADE,
        CONSTRAINT `FK_tax_article-quotation-entry-tax` FOREIGN KEY (`taxId`) REFERENCES `tax` (`id`) ON DELETE CASCADE
    );
