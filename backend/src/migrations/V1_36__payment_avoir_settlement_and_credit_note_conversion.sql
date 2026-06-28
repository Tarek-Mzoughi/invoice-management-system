ALTER TABLE `payment`
MODIFY COLUMN `mode` enum (
    'payment.payment_mode.cash',
    'payment.payment_mode.credit_card',
    'payment.payment_mode.check',
    'payment.payment_mode.bill_of_exchange',
    'payment.payment_mode.bank_transfer',
    'payment.payment_mode.wire_transfer',
    'payment.payment_mode.credit_note_settlement'
) DEFAULT NULL;

SET @payment_credit_note_entry_has_original_currency_id = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'payment_credit_note_entry'
      AND `column_name` = 'originalCurrencyId'
);

SET @payment_credit_note_entry_add_original_currency_id_sql = IF(
    @payment_credit_note_entry_has_original_currency_id = 0,
    'ALTER TABLE `payment_credit_note_entry` ADD COLUMN `originalCurrencyId` INT DEFAULT NULL AFTER `amount`',
    'SELECT 1'
);

PREPARE `payment_credit_note_entry_add_original_currency_id_stmt`
FROM @payment_credit_note_entry_add_original_currency_id_sql;
EXECUTE `payment_credit_note_entry_add_original_currency_id_stmt`;
DEALLOCATE PREPARE `payment_credit_note_entry_add_original_currency_id_stmt`;

SET @payment_credit_note_entry_has_exchange_rate = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'payment_credit_note_entry'
      AND `column_name` = 'exchangeRateToPaymentCurrency'
);

SET @payment_credit_note_entry_add_exchange_rate_sql = IF(
    @payment_credit_note_entry_has_exchange_rate = 0,
    'ALTER TABLE `payment_credit_note_entry` ADD COLUMN `exchangeRateToPaymentCurrency` FLOAT DEFAULT NULL AFTER `originalCurrencyId`',
    'SELECT 1'
);

PREPARE `payment_credit_note_entry_add_exchange_rate_stmt`
FROM @payment_credit_note_entry_add_exchange_rate_sql;
EXECUTE `payment_credit_note_entry_add_exchange_rate_stmt`;
DEALLOCATE PREPARE `payment_credit_note_entry_add_exchange_rate_stmt`;

SET @payment_credit_note_entry_has_converted_amount = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'payment_credit_note_entry'
      AND `column_name` = 'convertedAmount'
);

SET @payment_credit_note_entry_add_converted_amount_sql = IF(
    @payment_credit_note_entry_has_converted_amount = 0,
    'ALTER TABLE `payment_credit_note_entry` ADD COLUMN `convertedAmount` FLOAT DEFAULT NULL AFTER `exchangeRateToPaymentCurrency`',
    'SELECT 1'
);

PREPARE `payment_credit_note_entry_add_converted_amount_stmt`
FROM @payment_credit_note_entry_add_converted_amount_sql;
EXECUTE `payment_credit_note_entry_add_converted_amount_stmt`;
DEALLOCATE PREPARE `payment_credit_note_entry_add_converted_amount_stmt`;

SET @payment_credit_note_entry_has_converted_currency_id = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'payment_credit_note_entry'
      AND `column_name` = 'convertedCurrencyId'
);

SET @payment_credit_note_entry_add_converted_currency_id_sql = IF(
    @payment_credit_note_entry_has_converted_currency_id = 0,
    'ALTER TABLE `payment_credit_note_entry` ADD COLUMN `convertedCurrencyId` INT DEFAULT NULL AFTER `convertedAmount`',
    'SELECT 1'
);

PREPARE `payment_credit_note_entry_add_converted_currency_id_stmt`
FROM @payment_credit_note_entry_add_converted_currency_id_sql;
EXECUTE `payment_credit_note_entry_add_converted_currency_id_stmt`;
DEALLOCATE PREPARE `payment_credit_note_entry_add_converted_currency_id_stmt`;

UPDATE `payment_credit_note_entry` pcne
LEFT JOIN `credit_note` cn ON cn.`id` = pcne.`creditNoteId`
LEFT JOIN `payment` p ON p.`id` = pcne.`paymentId`
SET pcne.`originalCurrencyId` = COALESCE(pcne.`originalCurrencyId`, cn.`currencyId`),
    pcne.`exchangeRateToPaymentCurrency` = COALESCE(NULLIF(pcne.`exchangeRateToPaymentCurrency`, 0), 1),
    pcne.`convertedAmount` = COALESCE(pcne.`convertedAmount`, pcne.`amount`),
    pcne.`convertedCurrencyId` = COALESCE(pcne.`convertedCurrencyId`, p.`currencyId`);

SET @payment_credit_note_entry_has_original_currency_index = (
    SELECT COUNT(*)
    FROM `information_schema`.`statistics`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'payment_credit_note_entry'
      AND `index_name` = 'FK_payment_credit_note_entry_original_currency'
);

SET @payment_credit_note_entry_add_original_currency_index_sql = IF(
    @payment_credit_note_entry_has_original_currency_index = 0,
    'ALTER TABLE `payment_credit_note_entry` ADD KEY `FK_payment_credit_note_entry_original_currency` (`originalCurrencyId`)',
    'SELECT 1'
);

PREPARE `payment_credit_note_entry_add_original_currency_index_stmt`
FROM @payment_credit_note_entry_add_original_currency_index_sql;
EXECUTE `payment_credit_note_entry_add_original_currency_index_stmt`;
DEALLOCATE PREPARE `payment_credit_note_entry_add_original_currency_index_stmt`;

SET @payment_credit_note_entry_has_converted_currency_index = (
    SELECT COUNT(*)
    FROM `information_schema`.`statistics`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'payment_credit_note_entry'
      AND `index_name` = 'FK_payment_credit_note_entry_converted_currency'
);

SET @payment_credit_note_entry_add_converted_currency_index_sql = IF(
    @payment_credit_note_entry_has_converted_currency_index = 0,
    'ALTER TABLE `payment_credit_note_entry` ADD KEY `FK_payment_credit_note_entry_converted_currency` (`convertedCurrencyId`)',
    'SELECT 1'
);

PREPARE `payment_credit_note_entry_add_converted_currency_index_stmt`
FROM @payment_credit_note_entry_add_converted_currency_index_sql;
EXECUTE `payment_credit_note_entry_add_converted_currency_index_stmt`;
DEALLOCATE PREPARE `payment_credit_note_entry_add_converted_currency_index_stmt`;

SET @payment_credit_note_entry_has_original_currency_fk = (
    SELECT COUNT(*)
    FROM `information_schema`.`table_constraints`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'payment_credit_note_entry'
      AND `constraint_name` = 'FK_payment_credit_note_entry_original_currency'
      AND `constraint_type` = 'FOREIGN KEY'
);

SET @payment_credit_note_entry_add_original_currency_fk_sql = IF(
    @payment_credit_note_entry_has_original_currency_fk = 0,
    '
    ALTER TABLE `payment_credit_note_entry`
    ADD CONSTRAINT `FK_payment_credit_note_entry_original_currency`
    FOREIGN KEY (`originalCurrencyId`) REFERENCES `currency` (`id`) ON DELETE SET NULL
    ',
    'SELECT 1'
);

PREPARE `payment_credit_note_entry_add_original_currency_fk_stmt`
FROM @payment_credit_note_entry_add_original_currency_fk_sql;
EXECUTE `payment_credit_note_entry_add_original_currency_fk_stmt`;
DEALLOCATE PREPARE `payment_credit_note_entry_add_original_currency_fk_stmt`;

SET @payment_credit_note_entry_has_converted_currency_fk = (
    SELECT COUNT(*)
    FROM `information_schema`.`table_constraints`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'payment_credit_note_entry'
      AND `constraint_name` = 'FK_payment_credit_note_entry_converted_currency'
      AND `constraint_type` = 'FOREIGN KEY'
);

SET @payment_credit_note_entry_add_converted_currency_fk_sql = IF(
    @payment_credit_note_entry_has_converted_currency_fk = 0,
    '
    ALTER TABLE `payment_credit_note_entry`
    ADD CONSTRAINT `FK_payment_credit_note_entry_converted_currency`
    FOREIGN KEY (`convertedCurrencyId`) REFERENCES `currency` (`id`) ON DELETE SET NULL
    ',
    'SELECT 1'
);

PREPARE `payment_credit_note_entry_add_converted_currency_fk_stmt`
FROM @payment_credit_note_entry_add_converted_currency_fk_sql;
EXECUTE `payment_credit_note_entry_add_converted_currency_fk_stmt`;
DEALLOCATE PREPARE `payment_credit_note_entry_add_converted_currency_fk_stmt`;
