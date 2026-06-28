CREATE TABLE IF NOT EXISTS `firm_bank_account` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) DEFAULT NULL,
    `bic` varchar(11) DEFAULT NULL,
    `rib` varchar(20) DEFAULT NULL,
    `iban` varchar(30) DEFAULT NULL,
    `currencyId` int DEFAULT NULL,
    `isMain` boolean DEFAULT TRUE,
    `firmId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    KEY `FK_firm_bank_account_firm` (`firmId`),
    KEY `FK_currency_firm_bank_account` (`currencyId`),
    CONSTRAINT `FK_firm_bank_account_firm` FOREIGN KEY (`firmId`) REFERENCES `firm` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_firm_bank_account_currency` FOREIGN KEY (`currencyId`) REFERENCES `currency` (`id`) ON DELETE
    SET
        NULL
);

CREATE TABLE IF NOT EXISTS `expense-quotation-meta-data` (
    `id` int NOT NULL AUTO_INCREMENT,
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

CREATE TABLE IF NOT EXISTS `expense-quotation` (
    `id` int NOT NULL AUTO_INCREMENT,
    `sequential` varchar(25),
    `date` datetime DEFAULT NULL,
    `dueDate` datetime DEFAULT NULL,
    `object` varchar(255) DEFAULT NULL,
    `generalConditions` varchar(1024) DEFAULT NULL,
    `status` enum (
        'quotation.status.non_existent',
        'quotation.status.expired',
        'quotation.status.draft',
        'quotation.status.validated',
        'quotation.status.invoiced',
        'quotation.status.archived'
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
    `bankAccountId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `referenceDocId` int,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    KEY `FK_currency_expense-quotation` (`currencyId`),
    KEY `FK_firm_expense-quotation` (`firmId`),
    KEY `FK_interlocutor_expense-quotation` (`interlocutorId`),
    KEY `FK_cabinet_expense-quotation` (`cabinetId`),
    KEY `FK_expense-quotation-meta-data_expense-quotation` (`quotationMetaDataId`),
    CONSTRAINT `FK_currency_expense-quotation` FOREIGN KEY (`currencyId`) REFERENCES `currency` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_firm_expense-quotation` FOREIGN KEY (`firmId`) REFERENCES `firm` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_interlocutor_expense-quotation` FOREIGN KEY (`interlocutorId`) REFERENCES `interlocutor` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_cabinet_expense-quotation` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_expense-quotation-meta-data_expense-quotation` FOREIGN KEY (`quotationMetaDataId`) REFERENCES `expense-quotation-meta-data` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_reference-doc-expense-quotation` FOREIGN KEY (`referenceDocId`) REFERENCES `storage` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_firm-bank-account_expense-quotation` FOREIGN KEY (`bankAccountId`) REFERENCES `firm_bank_account` (`id`) ON DELETE
    SET
        NULL
);

CREATE TABLE IF NOT EXISTS `expense-article-quotation-entry` (
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
    KEY `FK_article_expense-article-quotation-entry` (`articleId`),
    KEY `FK_expense-quotation_expense-article-quotation-entry` (`quotationId`),
    CONSTRAINT `FK_article_expense-article-quotation-entry` FOREIGN KEY (`articleId`) REFERENCES `article` (`id`) ON DELETE
    SET
        NULL,
        CONSTRAINT `FK_expense-quotation_expense-article-quotation-entry` FOREIGN KEY (`quotationId`) REFERENCES `expense-quotation` (`id`) ON DELETE
    SET
        NULL
);

CREATE TABLE IF NOT EXISTS `expense-article-quotation-entry-tax` (
    `id` int NOT NULL AUTO_INCREMENT,
    `articleQuotationEntryId` int NOT NULL,
    `taxId` int NOT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    KEY `FK_expense-article-quotation-entry_article-quotation-entry-tax` (`articleQuotationEntryId`),
    KEY `FK_tax_expense-article-quotation-entry-tax` (`taxId`),
    CONSTRAINT `FK_expense-article-quotation-entry_article-quotation-entry-tax` FOREIGN KEY (`articleQuotationEntryId`) REFERENCES `expense-article-quotation-entry` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_tax_expense-article-quotation-entry-tax` FOREIGN KEY (`taxId`) REFERENCES `tax` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `expense-quotation-upload` (
    `id` int NOT NULL AUTO_INCREMENT,
    `quotationId` int DEFAULT NULL,
    `uploadId` int DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    KEY `FK_expense-quotation_expense-quotation-upload` (`quotationId`),
    KEY `FK_upload_expense-quotation-upload` (`uploadId`),
    CONSTRAINT `FK_expense-quotation_expense-quotation-upload` FOREIGN KEY (`quotationId`) REFERENCES `expense-quotation` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_upload_expense-quotation-upload` FOREIGN KEY (`uploadId`) REFERENCES `storage` (`id`) ON DELETE CASCADE
);
