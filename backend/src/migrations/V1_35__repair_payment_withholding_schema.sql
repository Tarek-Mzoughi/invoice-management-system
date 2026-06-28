-- Repair payment-level withholding schema introduced by the payment workflow refactor.
-- This migration is intentionally idempotent because some databases may already have
-- the credit-note table from manual/synchronized schema changes while missing the
-- payment withholding columns.

SET @payment_has_tax_withholding_id = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'payment'
      AND `column_name` = 'taxWithholdingId'
);

SET @payment_add_tax_withholding_id_sql = IF(
    @payment_has_tax_withholding_id = 0,
    'ALTER TABLE `payment` ADD COLUMN `taxWithholdingId` INT DEFAULT NULL',
    'SELECT 1'
);

PREPARE `payment_add_tax_withholding_id_stmt`
FROM @payment_add_tax_withholding_id_sql;
EXECUTE `payment_add_tax_withholding_id_stmt`;
DEALLOCATE PREPARE `payment_add_tax_withholding_id_stmt`;

SET @payment_has_tax_withholding_date = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'payment'
      AND `column_name` = 'taxWithholdingDate'
);

SET @payment_add_tax_withholding_date_sql = IF(
    @payment_has_tax_withholding_date = 0,
    'ALTER TABLE `payment` ADD COLUMN `taxWithholdingDate` DATETIME DEFAULT NULL',
    'SELECT 1'
);

PREPARE `payment_add_tax_withholding_date_stmt`
FROM @payment_add_tax_withholding_date_sql;
EXECUTE `payment_add_tax_withholding_date_stmt`;
DEALLOCATE PREPARE `payment_add_tax_withholding_date_stmt`;

SET @payment_has_tax_withholding_amount = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'payment'
      AND `column_name` = 'taxWithholdingAmount'
);

SET @payment_add_tax_withholding_amount_sql = IF(
    @payment_has_tax_withholding_amount = 0,
    'ALTER TABLE `payment` ADD COLUMN `taxWithholdingAmount` FLOAT DEFAULT NULL',
    'SELECT 1'
);

PREPARE `payment_add_tax_withholding_amount_stmt`
FROM @payment_add_tax_withholding_amount_sql;
EXECUTE `payment_add_tax_withholding_amount_stmt`;
DEALLOCATE PREPARE `payment_add_tax_withholding_amount_stmt`;

SET @payment_has_tax_withholding_index = (
    SELECT COUNT(*)
    FROM `information_schema`.`statistics`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'payment'
      AND `index_name` = 'FK_payment_tax_withholding'
);

SET @payment_add_tax_withholding_index_sql = IF(
    @payment_has_tax_withholding_index = 0,
    'ALTER TABLE `payment` ADD KEY `FK_payment_tax_withholding` (`taxWithholdingId`)',
    'SELECT 1'
);

PREPARE `payment_add_tax_withholding_index_stmt`
FROM @payment_add_tax_withholding_index_sql;
EXECUTE `payment_add_tax_withholding_index_stmt`;
DEALLOCATE PREPARE `payment_add_tax_withholding_index_stmt`;

SET @payment_has_tax_withholding_fk = (
    SELECT COUNT(*)
    FROM `information_schema`.`table_constraints`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'payment'
      AND `constraint_name` = 'FK_payment_tax_withholding'
      AND `constraint_type` = 'FOREIGN KEY'
);

SET @payment_has_tax_withholding_table = (
    SELECT COUNT(*)
    FROM `information_schema`.`tables`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'tax-withholding'
);

SET @payment_add_tax_withholding_fk_sql = IF(
    @payment_has_tax_withholding_fk = 0
      AND @payment_has_tax_withholding_table > 0,
    '
    ALTER TABLE `payment`
    ADD CONSTRAINT `FK_payment_tax_withholding`
    FOREIGN KEY (`taxWithholdingId`) REFERENCES `tax-withholding` (`id`) ON DELETE SET NULL
    ',
    'SELECT 1'
);

PREPARE `payment_add_tax_withholding_fk_stmt`
FROM @payment_add_tax_withholding_fk_sql;
EXECUTE `payment_add_tax_withholding_fk_stmt`;
DEALLOCATE PREPARE `payment_add_tax_withholding_fk_stmt`;
