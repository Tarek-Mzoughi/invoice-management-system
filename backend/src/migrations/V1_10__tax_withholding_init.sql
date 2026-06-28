CREATE TABLE IF NOT EXISTS `tax-withholding` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(255) DEFAULT NULL,
    `rate` FLOAT DEFAULT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deletedAt` TIMESTAMP DEFAULT NULL,
    `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (`id`)
);

INSERT INTO `tax-withholding` (`label`, `rate`)
SELECT
    seed.`label`,
    seed.`rate`
FROM (
    SELECT 'Frais - Régime forfaitaire' AS `label`, 10 AS `rate`
    UNION ALL SELECT 'Frais - Régime forfaitaire', 15
    UNION ALL SELECT 'Frais - Régime réel', 3
    UNION ALL SELECT 'Frais - Régime réel', 5
    UNION ALL SELECT 'Loyer - Frais spéciaux - Société exportation', 2.5
    UNION ALL SELECT 'Marché - Frais généraux', 1
    UNION ALL SELECT 'Marché - Frais généraux', 1.5
    UNION ALL SELECT 'Marché - Frais spéciaux - Société exportation', 0.5
    UNION ALL SELECT 'Revenus des comptes épargne spéciaux', 20
) AS seed
LEFT JOIN `tax-withholding` existing
    ON existing.`label` = seed.`label`
    AND existing.`rate` = seed.`rate`
WHERE existing.`id` IS NULL;

ALTER TABLE `invoice`
ADD COLUMN `taxWithholdingId` INT NULL,
ADD CONSTRAINT `FK_invoice_tax_withholding` 
    FOREIGN KEY (`taxWithholdingId`) 
    REFERENCES `tax-withholding` (`id`) 
    ON DELETE SET NULL;

ALTER TABLE `invoice_meta_data`
ADD COLUMN `hasTaxWithholding` BOOLEAN DEFAULT FALSE;

ALTER TABLE `invoice`
ADD COLUMN `taxWithholdingAmount` FLOAT DEFAULT NULL;
