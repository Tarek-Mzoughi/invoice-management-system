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

ALTER TABLE `invoice`
ADD COLUMN `activityType` enum ('selling', 'buying') NOT NULL DEFAULT 'selling',
ADD COLUMN `reference` varchar(255) DEFAULT NULL;

UPDATE `invoice`
SET
    `activityType` = 'selling'
WHERE
    `activityType` IS NULL;

CREATE INDEX `IDX_invoice_activity_type` ON `invoice` (`activityType`);

ALTER TABLE `quotation`
ADD COLUMN `activityType` enum ('selling', 'buying') NOT NULL DEFAULT 'selling';

UPDATE `quotation`
SET
    `activityType` = 'selling'
WHERE
    `activityType` IS NULL;

CREATE INDEX `IDX_quotation_activity_type` ON `quotation` (`activityType`);

ALTER TABLE `payment`
ADD COLUMN `activityType` enum ('selling', 'buying') NOT NULL DEFAULT 'selling';

UPDATE `payment`
SET
    `activityType` = 'selling'
WHERE
    `activityType` IS NULL;

CREATE INDEX `IDX_payment_activity_type` ON `payment` (`activityType`);

INSERT INTO
    `sequences` (`label`, `prefix`, `dateFormat`, `next`)
SELECT
    'buying_invoice',
    'BIN',
    'YYYYMM',
    1
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            `sequences`
        WHERE
            `label` IN ('buying_invoice', 'BUYING_INVOICE')
    );

INSERT INTO
    `sequences` (`label`, `prefix`, `dateFormat`, `next`)
SELECT
    'buying_quotation',
    'BQU',
    'YYYYMM',
    1
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            `sequences`
        WHERE
            `label` IN ('buying_quotation', 'BUYING_QUOTATION')
    );
