ALTER TABLE `payment`
MODIFY COLUMN `mode` enum (
    'payment.payment_mode.cash',
    'payment.payment_mode.credit_card',
    'payment.payment_mode.check',
    'payment.payment_mode.bill_of_exchange',
    'payment.payment_mode.bank_transfer',
    'payment.payment_mode.wire_transfer'
) DEFAULT NULL;

ALTER TABLE `payment`
ADD COLUMN `reference` VARCHAR(255) DEFAULT NULL AFTER `notes`,
ADD COLUMN `dueDate` DATETIME DEFAULT NULL AFTER `reference`,
ADD COLUMN `treasuryAccountId` INT DEFAULT NULL AFTER `firmId`,
ADD COLUMN `originTreasuryAccountId` INT DEFAULT NULL AFTER `treasuryAccountId`,
ADD COLUMN `collectionStatus` ENUM (
    'pending',
    'deposited',
    'paid',
    'rejected',
    'cancelled',
    'deposited_supplier',
    'paid_supplier'
) DEFAULT NULL AFTER `originTreasuryAccountId`,
ADD COLUMN `depositedAt` DATETIME DEFAULT NULL AFTER `collectionStatus`,
ADD COLUMN `paidAt` DATETIME DEFAULT NULL AFTER `depositedAt`,
ADD COLUMN `rejectedAt` DATETIME DEFAULT NULL AFTER `paidAt`,
ADD COLUMN `rejectionReason` VARCHAR(1024) DEFAULT NULL AFTER `rejectedAt`,
ADD COLUMN `encashmentMovementId` INT DEFAULT NULL AFTER `rejectionReason`,
ADD KEY `FK_payment_treasury_account` (`treasuryAccountId`),
ADD KEY `FK_payment_origin_treasury_account` (`originTreasuryAccountId`),
ADD KEY `IDX_payment_encashment_movement` (`encashmentMovementId`),
ADD CONSTRAINT `FK_payment_treasury_account` FOREIGN KEY (`treasuryAccountId`) REFERENCES `bank_account` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `FK_payment_origin_treasury_account` FOREIGN KEY (`originTreasuryAccountId`) REFERENCES `bank_account` (`id`) ON DELETE SET NULL;

UPDATE `payment`
SET `collectionStatus` = 'pending'
WHERE `collectionStatus` IS NULL
  AND `mode` IN (
    'payment.payment_mode.check',
    'payment.payment_mode.bill_of_exchange'
  );
