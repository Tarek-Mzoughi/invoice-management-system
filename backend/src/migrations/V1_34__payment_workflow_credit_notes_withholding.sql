ALTER TABLE `payment`
ADD COLUMN `taxWithholdingId` INT DEFAULT NULL AFTER `encashmentMovementId`,
ADD COLUMN `taxWithholdingDate` DATETIME DEFAULT NULL AFTER `taxWithholdingId`,
ADD COLUMN `taxWithholdingAmount` FLOAT DEFAULT NULL AFTER `taxWithholdingDate`,
ADD KEY `FK_payment_tax_withholding` (`taxWithholdingId`),
ADD CONSTRAINT `FK_payment_tax_withholding` FOREIGN KEY (`taxWithholdingId`) REFERENCES `tax-withholding` (`id`) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS `payment_credit_note_entry` (
  `id` int NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
  `paymentId` int NOT NULL,
  `creditNoteId` int NOT NULL,
  `amount` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_payment_credit_note_entry_payment` (`paymentId`),
  KEY `FK_payment_credit_note_entry_credit_note` (`creditNoteId`),
  CONSTRAINT `FK_payment_credit_note_entry_payment` FOREIGN KEY (`paymentId`) REFERENCES `payment` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_payment_credit_note_entry_credit_note` FOREIGN KEY (`creditNoteId`) REFERENCES `credit_note` (`id`) ON DELETE CASCADE
);
