SET @has_sequences_table = (
    SELECT COUNT(*)
    FROM `information_schema`.`tables`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'sequences'
);

SET @migration_sql = IF(
    @has_sequences_table > 0,
    'CREATE TABLE IF NOT EXISTS `legacy_honorary_note_sequences_archive` LIKE `sequences`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_sequences_table > 0,
    'INSERT IGNORE INTO `legacy_honorary_note_sequences_archive` SELECT * FROM `sequences` WHERE `label` IN (''honorary_note'', ''buying_honorary_note'')',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @has_article_honorary_note_entry_tax_table = (
    SELECT COUNT(*)
    FROM `information_schema`.`tables`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'article_honorary_note_entry_tax'
);

SET @migration_sql = IF(
    @has_article_honorary_note_entry_tax_table > 0,
    'CREATE TABLE IF NOT EXISTS `legacy_article_honorary_note_entry_tax_archive` LIKE `article_honorary_note_entry_tax`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_article_honorary_note_entry_tax_table > 0,
    'INSERT IGNORE INTO `legacy_article_honorary_note_entry_tax_archive` SELECT * FROM `article_honorary_note_entry_tax`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @has_article_honorary_note_entry_table = (
    SELECT COUNT(*)
    FROM `information_schema`.`tables`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'article_honorary_note_entry'
);

SET @migration_sql = IF(
    @has_article_honorary_note_entry_table > 0,
    'CREATE TABLE IF NOT EXISTS `legacy_article_honorary_note_entry_archive` LIKE `article_honorary_note_entry`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_article_honorary_note_entry_table > 0,
    'INSERT IGNORE INTO `legacy_article_honorary_note_entry_archive` SELECT * FROM `article_honorary_note_entry`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @has_honorary_note_upload_snake_table = (
    SELECT COUNT(*)
    FROM `information_schema`.`tables`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'honorary_note_upload'
);

SET @migration_sql = IF(
    @has_honorary_note_upload_snake_table > 0,
    'CREATE TABLE IF NOT EXISTS `legacy_honorary_note_upload_snake_archive` LIKE `honorary_note_upload`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_honorary_note_upload_snake_table > 0,
    'INSERT IGNORE INTO `legacy_honorary_note_upload_snake_archive` SELECT * FROM `honorary_note_upload`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @has_honorary_note_upload_camel_table = (
    SELECT COUNT(*)
    FROM `information_schema`.`tables`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'honorary-note-upload'
);

SET @migration_sql = IF(
    @has_honorary_note_upload_camel_table > 0,
    'CREATE TABLE IF NOT EXISTS `legacy_honorary_note_upload_camel_archive` LIKE `honorary-note-upload`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_honorary_note_upload_camel_table > 0,
    'INSERT IGNORE INTO `legacy_honorary_note_upload_camel_archive` SELECT * FROM `honorary-note-upload`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @has_payment_honorary_note_entry_table = (
    SELECT COUNT(*)
    FROM `information_schema`.`tables`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'payment_honorary_note_entry'
);

SET @migration_sql = IF(
    @has_payment_honorary_note_entry_table > 0,
    'CREATE TABLE IF NOT EXISTS `legacy_payment_honorary_note_entry_archive` LIKE `payment_honorary_note_entry`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_payment_honorary_note_entry_table > 0,
    'INSERT IGNORE INTO `legacy_payment_honorary_note_entry_archive` SELECT * FROM `payment_honorary_note_entry`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @has_honorary_note_snake_table = (
    SELECT COUNT(*)
    FROM `information_schema`.`tables`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'honorary_note'
);

SET @migration_sql = IF(
    @has_honorary_note_snake_table > 0,
    'CREATE TABLE IF NOT EXISTS `legacy_honorary_note_snake_archive` LIKE `honorary_note`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_honorary_note_snake_table > 0,
    'INSERT IGNORE INTO `legacy_honorary_note_snake_archive` SELECT * FROM `honorary_note`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @has_honorary_note_camel_table = (
    SELECT COUNT(*)
    FROM `information_schema`.`tables`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'honoraryNote'
);

SET @migration_sql = IF(
    @has_honorary_note_camel_table > 0,
    'CREATE TABLE IF NOT EXISTS `legacy_honorary_note_camel_archive` LIKE `honoraryNote`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_honorary_note_camel_table > 0,
    'INSERT IGNORE INTO `legacy_honorary_note_camel_archive` SELECT * FROM `honoraryNote`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @has_honorary_note_meta_data_table = (
    SELECT COUNT(*)
    FROM `information_schema`.`tables`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'honorary_note_meta_data'
);

SET @migration_sql = IF(
    @has_honorary_note_meta_data_table > 0,
    'CREATE TABLE IF NOT EXISTS `legacy_honorary_note_meta_data_archive` LIKE `honorary_note_meta_data`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_honorary_note_meta_data_table > 0,
    'INSERT IGNORE INTO `legacy_honorary_note_meta_data_archive` SELECT * FROM `honorary_note_meta_data`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_article_honorary_note_entry_tax_table > 0,
    'DROP TABLE `article_honorary_note_entry_tax`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_honorary_note_upload_snake_table > 0,
    'DROP TABLE `honorary_note_upload`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_honorary_note_upload_camel_table > 0,
    'DROP TABLE `honorary-note-upload`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_payment_honorary_note_entry_table > 0,
    'DROP TABLE `payment_honorary_note_entry`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_article_honorary_note_entry_table > 0,
    'DROP TABLE `article_honorary_note_entry`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_honorary_note_snake_table > 0,
    'DROP TABLE `honorary_note`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_honorary_note_camel_table > 0,
    'DROP TABLE `honoraryNote`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_honorary_note_meta_data_table > 0,
    'DROP TABLE `honorary_note_meta_data`',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    @has_sequences_table > 0,
    'DELETE FROM `sequences` WHERE `label` IN (''honorary_note'', ''buying_honorary_note'')',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;
