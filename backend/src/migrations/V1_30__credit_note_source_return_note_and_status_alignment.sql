SET @credit_note_add_source_return_note_column = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'credit_note'
      AND `column_name` = 'sourceReturnNoteId'
);

SET @credit_note_add_source_return_note_column_sql = IF(
    @credit_note_add_source_return_note_column = 0,
    '
    ALTER TABLE `credit_note`
    ADD COLUMN `sourceReturnNoteId` int DEFAULT NULL AFTER `sourceInvoiceId`
    ',
    'SELECT 1'
);

PREPARE `credit_note_add_source_return_note_column_stmt`
FROM @credit_note_add_source_return_note_column_sql;
EXECUTE `credit_note_add_source_return_note_column_stmt`;
DEALLOCATE PREPARE `credit_note_add_source_return_note_column_stmt`;

UPDATE `credit_note` cn
LEFT JOIN `return_note` rn ON rn.`id` = cn.`sourceReturnNoteId`
SET cn.`sourceReturnNoteId` = NULL
WHERE cn.`sourceReturnNoteId` IS NOT NULL
  AND rn.`id` IS NULL;

SET @credit_note_has_source_return_note_fk = (
    SELECT COUNT(*)
    FROM `information_schema`.`table_constraints`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'credit_note'
      AND `constraint_name` = 'FK_source_return_note_credit_note'
);

SET @credit_note_add_source_return_note_fk_sql = IF(
    @credit_note_has_source_return_note_fk = 0,
    '
    ALTER TABLE `credit_note`
    ADD CONSTRAINT `FK_source_return_note_credit_note`
    FOREIGN KEY (`sourceReturnNoteId`) REFERENCES `return_note` (`id`) ON DELETE SET NULL
    ',
    'SELECT 1'
);

PREPARE `credit_note_add_source_return_note_fk_stmt`
FROM @credit_note_add_source_return_note_fk_sql;
EXECUTE `credit_note_add_source_return_note_fk_stmt`;
DEALLOCATE PREPARE `credit_note_add_source_return_note_fk_stmt`;

ALTER TABLE `credit_note`
MODIFY `status` ENUM(
    'draft',
    'sent',
    'validated',
    'paid',
    'partially_paid',
    'unpaid',
    'expired',
    'archived',
    'quotation.status.archived',
    'creditNote.status.non_existent',
    'creditNote.status.draft',
    'creditNote.status.sent',
    'creditNote.status.validated',
    'creditNote.status.paid',
    'creditNote.status.partially_paid',
    'creditNote.status.unpaid',
    'creditNote.status.expired'
) DEFAULT NULL;

UPDATE `credit_note`
SET `status` = 'creditNote.status.draft'
WHERE `status` = 'draft';

UPDATE `credit_note`
SET `status` = 'creditNote.status.sent'
WHERE `status` = 'sent';

UPDATE `credit_note`
SET `status` = 'creditNote.status.validated'
WHERE `status` = 'validated';

UPDATE `credit_note`
SET `status` = 'creditNote.status.paid'
WHERE `status` = 'paid';

UPDATE `credit_note`
SET `status` = 'creditNote.status.partially_paid'
WHERE `status` = 'partially_paid';

UPDATE `credit_note`
SET `status` = 'creditNote.status.unpaid'
WHERE `status` = 'unpaid';

UPDATE `credit_note`
SET `status` = 'creditNote.status.expired'
WHERE `status` IN ('expired', 'archived', 'quotation.status.archived');

UPDATE `credit_note`
SET `status` = 'creditNote.status.non_existent'
WHERE `status` = 'non_existent';

ALTER TABLE `credit_note`
MODIFY `status` ENUM(
    'creditNote.status.non_existent',
    'creditNote.status.draft',
    'creditNote.status.sent',
    'creditNote.status.validated',
    'creditNote.status.paid',
    'creditNote.status.partially_paid',
    'creditNote.status.unpaid',
    'creditNote.status.expired'
) DEFAULT NULL;
