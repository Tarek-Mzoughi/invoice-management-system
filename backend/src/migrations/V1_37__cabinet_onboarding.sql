SET @migration_sql = IF(
    EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'cabinet'
            AND COLUMN_NAME = 'activityType'
    ),
    'SELECT 1',
    'ALTER TABLE `cabinet` ADD COLUMN `activityType` varchar(100) DEFAULT NULL'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'cabinet'
            AND COLUMN_NAME = 'personType'
    ),
    'SELECT 1',
    'ALTER TABLE `cabinet` ADD COLUMN `personType` varchar(32) DEFAULT NULL'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'cabinet'
            AND COLUMN_NAME = 'taxSettings'
    ),
    'SELECT 1',
    'ALTER TABLE `cabinet` ADD COLUMN `taxSettings` json DEFAULT NULL'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'cabinet'
            AND COLUMN_NAME = 'onboardingCompleted'
    ),
    'SELECT 1',
    'ALTER TABLE `cabinet` ADD COLUMN `onboardingCompleted` tinyint(1) NOT NULL DEFAULT 0'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'cabinet'
            AND COLUMN_NAME = 'onboardingCompletedAt'
    ),
    'SELECT 1',
    'ALTER TABLE `cabinet` ADD COLUMN `onboardingCompletedAt` datetime DEFAULT NULL'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

UPDATE `cabinet`
SET
    `personType` = CASE
        WHEN `isPerson` = 1 THEN 'physical'
        ELSE 'moral'
    END
WHERE `personType` IS NULL;

UPDATE `cabinet`
SET
    `onboardingCompleted` = 1,
    `onboardingCompletedAt` = COALESCE(`onboardingCompletedAt`, NOW())
WHERE `id` IS NOT NULL;
