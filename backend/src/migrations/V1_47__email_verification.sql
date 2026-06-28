SET @schema_name = DATABASE();

SET @email_verified_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'emailVerified'
);
SET @email_verified_sql = IF(
  @email_verified_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `emailVerified` DATETIME DEFAULT NULL AFTER `email`',
  'SELECT 1'
);
PREPARE email_verified_stmt FROM @email_verified_sql;
EXECUTE email_verified_stmt;
DEALLOCATE PREPARE email_verified_stmt;

UPDATE `users`
SET `emailVerified` = COALESCE(`emailVerified`, NOW())
WHERE `emailVerified` IS NULL;

SET @password_reset_hash_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'passwordResetTokenHash'
);
SET @password_reset_hash_sql = IF(
  @password_reset_hash_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `passwordResetTokenHash` VARCHAR(64) DEFAULT NULL AFTER `emailVerified`',
  'SELECT 1'
);
PREPARE password_reset_hash_stmt FROM @password_reset_hash_sql;
EXECUTE password_reset_hash_stmt;
DEALLOCATE PREPARE password_reset_hash_stmt;

SET @password_reset_expires_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'passwordResetTokenExpiresAt'
);
SET @password_reset_expires_sql = IF(
  @password_reset_expires_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `passwordResetTokenExpiresAt` DATETIME DEFAULT NULL AFTER `passwordResetTokenHash`',
  'SELECT 1'
);
PREPARE password_reset_expires_stmt FROM @password_reset_expires_sql;
EXECUTE password_reset_expires_stmt;
DEALLOCATE PREPARE password_reset_expires_stmt;

SET @email_verification_hash_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'emailVerificationTokenHash'
);
SET @email_verification_hash_sql = IF(
  @email_verification_hash_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `emailVerificationTokenHash` VARCHAR(64) DEFAULT NULL AFTER `passwordResetTokenExpiresAt`',
  'SELECT 1'
);
PREPARE email_verification_hash_stmt FROM @email_verification_hash_sql;
EXECUTE email_verification_hash_stmt;
DEALLOCATE PREPARE email_verification_hash_stmt;

SET @email_verification_expires_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'emailVerificationTokenExpiresAt'
);
SET @email_verification_expires_sql = IF(
  @email_verification_expires_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `emailVerificationTokenExpiresAt` DATETIME DEFAULT NULL AFTER `emailVerificationTokenHash`',
  'SELECT 1'
);
PREPARE email_verification_expires_stmt FROM @email_verification_expires_sql;
EXECUTE email_verification_expires_stmt;
DEALLOCATE PREPARE email_verification_expires_stmt;

SET @password_reset_index_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'IDX_users_password_reset_token_hash'
);
SET @password_reset_index_sql = IF(
  @password_reset_index_exists = 0,
  'CREATE INDEX `IDX_users_password_reset_token_hash` ON `users` (`passwordResetTokenHash`)',
  'SELECT 1'
);
PREPARE password_reset_index_stmt FROM @password_reset_index_sql;
EXECUTE password_reset_index_stmt;
DEALLOCATE PREPARE password_reset_index_stmt;

SET @email_verification_index_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'IDX_users_email_verification_token_hash'
);
SET @email_verification_index_sql = IF(
  @email_verification_index_exists = 0,
  'CREATE INDEX `IDX_users_email_verification_token_hash` ON `users` (`emailVerificationTokenHash`)',
  'SELECT 1'
);
PREPARE email_verification_index_stmt FROM @email_verification_index_sql;
EXECUTE email_verification_index_stmt;
DEALLOCATE PREPARE email_verification_index_stmt;
