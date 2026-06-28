SET @quotation_has_tax_stamp = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'quotation'
      AND `column_name` = 'taxStamp'
);

SET @quotation_tax_stamp_update_sql = IF(
    @quotation_has_tax_stamp > 0,
    '
    UPDATE `quotation`
    SET `total` = `total` - IFNULL(`taxStamp`, 0)
    ',
    'SELECT 1'
);

PREPARE `quotation_tax_stamp_update_stmt` FROM @quotation_tax_stamp_update_sql;
EXECUTE `quotation_tax_stamp_update_stmt`;
DEALLOCATE PREPARE `quotation_tax_stamp_update_stmt`;

SET @quotation_tax_stamp_drop_sql = IF(
    @quotation_has_tax_stamp > 0,
    '
    ALTER TABLE `quotation`
    DROP COLUMN `taxStamp`
    ',
    'SELECT 1'
);

PREPARE `quotation_tax_stamp_drop_stmt` FROM @quotation_tax_stamp_drop_sql;
EXECUTE `quotation_tax_stamp_drop_stmt`;
DEALLOCATE PREPARE `quotation_tax_stamp_drop_stmt`;

SET @quotation_meta_has_tax_stamp = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'quotation_meta_data'
      AND `column_name` = 'hasTaxStamp'
);

SET @quotation_meta_drop_sql = IF(
    @quotation_meta_has_tax_stamp > 0,
    '
    ALTER TABLE `quotation_meta_data`
    DROP COLUMN `hasTaxStamp`
    ',
    'SELECT 1'
);

PREPARE `quotation_meta_drop_stmt` FROM @quotation_meta_drop_sql;
EXECUTE `quotation_meta_drop_stmt`;
DEALLOCATE PREPARE `quotation_meta_drop_stmt`;

SET @tax_has_rate = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'tax'
      AND `column_name` = 'rate'
);

SET @tax_has_value = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'tax'
      AND `column_name` = 'value'
);

SET @tax_rename_sql = IF(
    @tax_has_rate > 0 AND @tax_has_value = 0,
    '
    ALTER TABLE `tax`
    RENAME COLUMN `rate` TO `value`
    ',
    'SELECT 1'
);

PREPARE `tax_rename_stmt` FROM @tax_rename_sql;
EXECUTE `tax_rename_stmt`;
DEALLOCATE PREPARE `tax_rename_stmt`;

SET @tax_value_scale_sql = IF(
    @tax_has_rate > 0,
    '
    UPDATE `tax`
    SET `value` = `value` * 100
    ',
    'SELECT 1'
);

PREPARE `tax_value_scale_stmt` FROM @tax_value_scale_sql;
EXECUTE `tax_value_scale_stmt`;
DEALLOCATE PREPARE `tax_value_scale_stmt`;

SET @tax_has_is_rate = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'tax'
      AND `column_name` = 'isRate'
);

SET @tax_add_is_rate_sql = IF(
    @tax_has_is_rate = 0,
    '
    ALTER TABLE `tax`
    ADD COLUMN `isRate` BOOLEAN DEFAULT TRUE
    ',
    'SELECT 1'
);

PREPARE `tax_add_is_rate_stmt` FROM @tax_add_is_rate_sql;
EXECUTE `tax_add_is_rate_stmt`;
DEALLOCATE PREPARE `tax_add_is_rate_stmt`;
