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

SET @cabinet_has_logo_column = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'cabinet'
      AND `column_name` = 'logoId'
);

SET @cabinet_add_logo_sql = IF(
    @cabinet_has_logo_column = 0,
    '
    ALTER TABLE `cabinet`
    ADD COLUMN `logoId` int DEFAULT NULL
    ',
    'SELECT 1'
);

PREPARE `cabinet_add_logo_stmt` FROM @cabinet_add_logo_sql;
EXECUTE `cabinet_add_logo_stmt`;
DEALLOCATE PREPARE `cabinet_add_logo_stmt`;

SET @cabinet_has_signature_column = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'cabinet'
      AND `column_name` = 'signatureId'
);

SET @cabinet_add_signature_sql = IF(
    @cabinet_has_signature_column = 0,
    '
    ALTER TABLE `cabinet`
    ADD COLUMN `signatureId` int DEFAULT NULL
    ',
    'SELECT 1'
);

PREPARE `cabinet_add_signature_stmt` FROM @cabinet_add_signature_sql;
EXECUTE `cabinet_add_signature_stmt`;
DEALLOCATE PREPARE `cabinet_add_signature_stmt`;

SET @cabinet_logo_fk_exists = (
    SELECT COUNT(*)
    FROM `information_schema`.`KEY_COLUMN_USAGE`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'cabinet'
      AND `column_name` = 'logoId'
      AND `referenced_table_name` IS NOT NULL
);

SET @cabinet_signature_fk_exists = (
    SELECT COUNT(*)
    FROM `information_schema`.`KEY_COLUMN_USAGE`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'cabinet'
      AND `column_name` = 'signatureId'
      AND `referenced_table_name` IS NOT NULL
);

SET @cabinet_upload_reference_table = 'storage';

SET @cabinet_logo_fk_sql = IF(
    @cabinet_logo_fk_exists = 0,
    CONCAT(
        'ALTER TABLE `cabinet` ',
        'ADD CONSTRAINT `FK_logo_upload` FOREIGN KEY (`logoId`) REFERENCES `',
        @cabinet_upload_reference_table,
        '` (`id`) ON DELETE SET NULL'
    ),
    'SELECT 1'
);

PREPARE `cabinet_logo_fk_stmt` FROM @cabinet_logo_fk_sql;
EXECUTE `cabinet_logo_fk_stmt`;
DEALLOCATE PREPARE `cabinet_logo_fk_stmt`;

SET @cabinet_signature_fk_sql = IF(
    @cabinet_signature_fk_exists = 0,
    CONCAT(
        'ALTER TABLE `cabinet` ',
        'ADD CONSTRAINT `FK_signature_upload` FOREIGN KEY (`signatureId`) REFERENCES `',
        @cabinet_upload_reference_table,
        '` (`id`) ON DELETE SET NULL'
    ),
    'SELECT 1'
);

PREPARE `cabinet_signature_fk_stmt` FROM @cabinet_signature_fk_sql;
EXECUTE `cabinet_signature_fk_stmt`;
DEALLOCATE PREPARE `cabinet_signature_fk_stmt`;

UPDATE `cabinet`
SET `logoId` = NULL, `signatureId` = NULL
WHERE `logoId` IS NULL AND `signatureId` IS NULL;
