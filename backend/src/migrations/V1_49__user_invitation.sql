SET @schema_name = DATABASE();

SET @must_change_password_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'mustChangePassword'
);

SET @must_change_password_sql = IF(
  @must_change_password_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `mustChangePassword` TINYINT(1) DEFAULT 0 AFTER `emailVerified`',
  'SELECT 1'
);

PREPARE must_change_password_stmt FROM @must_change_password_sql;
EXECUTE must_change_password_stmt;
DEALLOCATE PREPARE must_change_password_stmt;

UPDATE `users`
SET `mustChangePassword` = FALSE
WHERE `mustChangePassword` IS NULL;
