SET @cabinet_enterprise_unique_index = (
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cabinet'
      AND COLUMN_NAME = 'enterpriseName'
      AND NON_UNIQUE = 0
    ORDER BY INDEX_NAME
    LIMIT 1
);

SET @drop_cabinet_enterprise_unique_sql = IF(
    @cabinet_enterprise_unique_index IS NOT NULL,
    CONCAT('ALTER TABLE `cabinet` DROP INDEX `', @cabinet_enterprise_unique_index, '`'),
    'SELECT 1'
);

PREPARE drop_cabinet_enterprise_unique_stmt FROM @drop_cabinet_enterprise_unique_sql;
EXECUTE drop_cabinet_enterprise_unique_stmt;
DEALLOCATE PREPARE drop_cabinet_enterprise_unique_stmt;

SET @cabinet_tax_unique_index = (
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cabinet'
      AND COLUMN_NAME = 'taxIdNumber'
      AND NON_UNIQUE = 0
    ORDER BY INDEX_NAME
    LIMIT 1
);

SET @drop_cabinet_tax_unique_sql = IF(
    @cabinet_tax_unique_index IS NOT NULL,
    CONCAT('ALTER TABLE `cabinet` DROP INDEX `', @cabinet_tax_unique_index, '`'),
    'SELECT 1'
);

PREPARE drop_cabinet_tax_unique_stmt FROM @drop_cabinet_tax_unique_sql;
EXECUTE drop_cabinet_tax_unique_stmt;
DEALLOCATE PREPARE drop_cabinet_tax_unique_stmt;

SET @cabinet_enterprise_index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cabinet'
      AND INDEX_NAME = 'IDX_cabinet_enterprise_name'
);

SET @add_cabinet_enterprise_index_sql = IF(
    @cabinet_enterprise_index_exists = 0,
    'CREATE INDEX `IDX_cabinet_enterprise_name` ON `cabinet` (`enterpriseName`)',
    'SELECT 1'
);

PREPARE add_cabinet_enterprise_index_stmt FROM @add_cabinet_enterprise_index_sql;
EXECUTE add_cabinet_enterprise_index_stmt;
DEALLOCATE PREPARE add_cabinet_enterprise_index_stmt;

SET @cabinet_tax_index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cabinet'
      AND INDEX_NAME = 'IDX_cabinet_tax_id_number'
);

SET @add_cabinet_tax_index_sql = IF(
    @cabinet_tax_index_exists = 0,
    'CREATE INDEX `IDX_cabinet_tax_id_number` ON `cabinet` (`taxIdNumber`)',
    'SELECT 1'
);

PREPARE add_cabinet_tax_index_stmt FROM @add_cabinet_tax_index_sql;
EXECUTE add_cabinet_tax_index_stmt;
DEALLOCATE PREPARE add_cabinet_tax_index_stmt;
