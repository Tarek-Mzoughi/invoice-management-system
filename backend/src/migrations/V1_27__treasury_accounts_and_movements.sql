ALTER TABLE `bank_account`
ADD COLUMN `type` ENUM('cash', 'bank') NOT NULL DEFAULT 'bank' AFTER `name`,
ADD COLUMN `agency` VARCHAR(255) DEFAULT NULL AFTER `iban`;

UPDATE `bank_account`
SET `type` = 'bank'
WHERE `type` IS NULL;

CREATE TABLE IF NOT EXISTS `treasury_movement` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `accountId` INT NOT NULL,
    `currencyId` INT NOT NULL,
    `kind` ENUM('expense', 'income', 'adjustment', 'transfer') NOT NULL,
    `direction` ENUM('in', 'out') NOT NULL,
    `amount` FLOAT NOT NULL,
    `label` VARCHAR(255) DEFAULT NULL,
    `notes` VARCHAR(1024) DEFAULT NULL,
    `movementDate` DATETIME NOT NULL,
    `createdAt` TIMESTAMP DEFAULT NOW(),
    `updatedAt` TIMESTAMP DEFAULT NOW(),
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`),
    KEY `FK_bank_account_treasury_movement` (`accountId`),
    KEY `FK_currency_treasury_movement` (`currencyId`),
    CONSTRAINT `FK_bank_account_treasury_movement` FOREIGN KEY (`accountId`) REFERENCES `bank_account` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_currency_treasury_movement` FOREIGN KEY (`currencyId`) REFERENCES `currency` (`id`) ON DELETE RESTRICT
);
