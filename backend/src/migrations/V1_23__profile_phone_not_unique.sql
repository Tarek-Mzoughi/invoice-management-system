SET @database_name = DATABASE();

SET @phone_unique_index = (
    SELECT `INDEX_NAME`
    FROM `information_schema`.`STATISTICS`
    WHERE `TABLE_SCHEMA` = @database_name
      AND `TABLE_NAME` = 'profiles'
      AND `COLUMN_NAME` = 'phone'
      AND `NON_UNIQUE` = 0
    ORDER BY `INDEX_NAME`
    LIMIT 1
);

SET @drop_phone_unique_index_sql = IF(
    @phone_unique_index IS NOT NULL,
    CONCAT('ALTER TABLE `profiles` DROP INDEX `', @phone_unique_index, '`'),
    'SELECT 1'
);

PREPARE drop_phone_unique_index_stmt FROM @drop_phone_unique_index_sql;
EXECUTE drop_phone_unique_index_stmt;
DEALLOCATE PREPARE drop_phone_unique_index_stmt;
