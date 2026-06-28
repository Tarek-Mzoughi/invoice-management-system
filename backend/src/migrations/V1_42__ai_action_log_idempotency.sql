-- Add confirmedAt and executedAt columns to ai_action_logs for idempotent confirm handling

SET @schema_name = DATABASE();

SET @has_confirmed_at = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'ai_action_logs'
    AND COLUMN_NAME = 'confirmedAt'
);

SET @add_confirmed_at_sql = IF(
  @has_confirmed_at = 0,
  'ALTER TABLE `ai_action_logs` ADD COLUMN `confirmedAt` DATETIME NULL DEFAULT NULL',
  'SELECT 1'
);

PREPARE add_confirmed_at_stmt FROM @add_confirmed_at_sql;
EXECUTE add_confirmed_at_stmt;
DEALLOCATE PREPARE add_confirmed_at_stmt;

SET @has_executed_at = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'ai_action_logs'
    AND COLUMN_NAME = 'executedAt'
);

SET @add_executed_at_sql = IF(
  @has_executed_at = 0,
  'ALTER TABLE `ai_action_logs` ADD COLUMN `executedAt` DATETIME NULL DEFAULT NULL',
  'SELECT 1'
);

PREPARE add_executed_at_stmt FROM @add_executed_at_sql;
EXECUTE add_executed_at_stmt;
DEALLOCATE PREPARE add_executed_at_stmt;
