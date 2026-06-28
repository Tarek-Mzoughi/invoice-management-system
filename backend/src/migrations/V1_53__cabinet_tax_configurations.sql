SET @tax_has_cabinet_id = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'tax'
      AND `column_name` = 'cabinetId'
);

SET @tax_add_cabinet_id_sql = IF(
    @tax_has_cabinet_id = 0,
    'ALTER TABLE `tax` ADD COLUMN `cabinetId` INT DEFAULT NULL',
    'SELECT 1'
);

PREPARE `tax_add_cabinet_id_stmt` FROM @tax_add_cabinet_id_sql;
EXECUTE `tax_add_cabinet_id_stmt`;
DEALLOCATE PREPARE `tax_add_cabinet_id_stmt`;

SET @tax_cabinet_index_exists = (
    SELECT COUNT(*)
    FROM `information_schema`.`statistics`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'tax'
      AND `index_name` = 'IDX_tax_cabinetId'
);

SET @tax_cabinet_index_sql = IF(
    @tax_cabinet_index_exists = 0,
    'CREATE INDEX `IDX_tax_cabinetId` ON `tax` (`cabinetId`)',
    'SELECT 1'
);

PREPARE `tax_cabinet_index_stmt` FROM @tax_cabinet_index_sql;
EXECUTE `tax_cabinet_index_stmt`;
DEALLOCATE PREPARE `tax_cabinet_index_stmt`;

SET @tax_cabinet_fk_exists = (
    SELECT COUNT(*)
    FROM `information_schema`.`table_constraints`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'tax'
      AND `constraint_name` = 'FK_tax_cabinet'
);

SET @tax_cabinet_fk_sql = IF(
    @tax_cabinet_fk_exists = 0,
    'ALTER TABLE `tax` ADD CONSTRAINT `FK_tax_cabinet` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
);

PREPARE `tax_cabinet_fk_stmt` FROM @tax_cabinet_fk_sql;
EXECUTE `tax_cabinet_fk_stmt`;
DEALLOCATE PREPARE `tax_cabinet_fk_stmt`;

CREATE TABLE IF NOT EXISTS `cabinet_tax_configuration` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `cabinetId` INT NOT NULL,
    `taxId` INT NOT NULL,
    `isActive` TINYINT(1) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `deletedAt` DATETIME(6) NULL,
    `isDeletionRestricted` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UQ_cabinet_tax_configuration_cabinet_tax` (`cabinetId`, `taxId`),
    KEY `IDX_cabinet_tax_configuration_cabinetId` (`cabinetId`),
    KEY `IDX_cabinet_tax_configuration_taxId` (`taxId`),
    CONSTRAINT `FK_cabinet_tax_configuration_cabinet` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_cabinet_tax_configuration_tax` FOREIGN KEY (`taxId`) REFERENCES `tax` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO `tax` (`label`, `value`, `isRate`, `isSpecial`, `cabinetId`, `isDeletionRestricted`)
SELECT seed.`label`, seed.`value`, seed.`isRate`, seed.`isSpecial`, NULL, FALSE
FROM (
    SELECT 'TVA 0%' AS `label`, 0 AS `value`, TRUE AS `isRate`, FALSE AS `isSpecial`
    UNION ALL SELECT 'TVA 7%', 7, TRUE, FALSE
    UNION ALL SELECT 'TVA 13%', 13, TRUE, FALSE
    UNION ALL SELECT 'TVA 19%', 19, TRUE, FALSE
    UNION ALL SELECT 'Timbre fiscal', 1, FALSE, TRUE
    UNION ALL SELECT 'FODEC 1%', 1, TRUE, TRUE
) seed
WHERE NOT EXISTS (
    SELECT 1
    FROM `tax` existing
    WHERE existing.`cabinetId` IS NULL
      AND existing.`deletedAt` IS NULL
      AND (
        LOWER(existing.`label`) = LOWER(seed.`label`)
        OR (
          seed.`isRate` = TRUE
          AND seed.`isSpecial` = FALSE
          AND existing.`isRate` = TRUE
          AND existing.`isSpecial` = FALSE
          AND existing.`value` = seed.`value`
        )
        OR (
          seed.`label` = 'FODEC 1%'
          AND LOWER(existing.`label`) = 'fodec'
          AND existing.`isRate` = TRUE
          AND existing.`isSpecial` = TRUE
          AND existing.`value` = 1
        )
      )
);

INSERT INTO `cabinet_tax_configuration`
    (`cabinetId`, `taxId`, `isActive`, `createdAt`, `updatedAt`, `isDeletionRestricted`)
SELECT
    cabinet.`id`,
    tax.`id`,
    TRUE,
    CURRENT_TIMESTAMP(6),
    CURRENT_TIMESTAMP(6),
    FALSE
FROM `cabinet` cabinet
JOIN `tax` tax ON tax.`cabinetId` IS NULL AND tax.`deletedAt` IS NULL
WHERE cabinet.`deletedAt` IS NULL
ON DUPLICATE KEY UPDATE
    `isActive` = `cabinet_tax_configuration`.`isActive`;
