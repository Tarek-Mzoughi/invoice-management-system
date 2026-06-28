UPDATE `invoice` i
LEFT JOIN `quotation` q ON q.`id` = i.`quotationId`
SET i.`quotationId` = NULL
WHERE i.`quotationId` IS NOT NULL
  AND q.`id` IS NULL;

UPDATE `invoice` i
LEFT JOIN `customer_order` co ON co.`id` = i.`customerOrderId`
SET i.`customerOrderId` = NULL
WHERE i.`customerOrderId` IS NOT NULL
  AND co.`id` IS NULL;

UPDATE `invoice` i
LEFT JOIN `delivery_note` dn ON dn.`id` = i.`deliveryNoteId`
SET i.`deliveryNoteId` = NULL
WHERE i.`deliveryNoteId` IS NOT NULL
  AND dn.`id` IS NULL;

UPDATE `invoice` i
LEFT JOIN `goods_issue_note` gin ON gin.`id` = i.`goodsIssueNoteId`
SET i.`goodsIssueNoteId` = NULL
WHERE i.`goodsIssueNoteId` IS NOT NULL
  AND gin.`id` IS NULL;

UPDATE `invoice` i
LEFT JOIN `return_note` rn ON rn.`id` = i.`returnNoteId`
SET i.`returnNoteId` = NULL
WHERE i.`returnNoteId` IS NOT NULL
  AND rn.`id` IS NULL;

UPDATE `customer_order` co
LEFT JOIN `quotation` q ON q.`id` = co.`quotationId`
SET co.`quotationId` = NULL
WHERE co.`quotationId` IS NOT NULL
  AND q.`id` IS NULL;

UPDATE `delivery_note` dn
LEFT JOIN `quotation` q ON q.`id` = dn.`quotationId`
SET dn.`quotationId` = NULL
WHERE dn.`quotationId` IS NOT NULL
  AND q.`id` IS NULL;

UPDATE `goods_issue_note` gin
LEFT JOIN `quotation` q ON q.`id` = gin.`quotationId`
SET gin.`quotationId` = NULL
WHERE gin.`quotationId` IS NOT NULL
  AND q.`id` IS NULL;

UPDATE `credit_note` cn
LEFT JOIN `quotation` q ON q.`id` = cn.`quotationId`
SET cn.`quotationId` = NULL
WHERE cn.`quotationId` IS NOT NULL
  AND q.`id` IS NULL;

SET @honorary_note_has_quotation_id = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'honorary_note'
      AND `column_name` = 'quotationId'
);

SET @honorary_note_cleanup_quotation_sql = IF(
    @honorary_note_has_quotation_id > 0,
    '
    UPDATE `honorary_note` hn
    LEFT JOIN `quotation` q ON q.`id` = hn.`quotationId`
    SET hn.`quotationId` = NULL
    WHERE hn.`quotationId` IS NOT NULL
      AND q.`id` IS NULL
    ',
    'SELECT 1'
);

PREPARE `honorary_note_cleanup_quotation_stmt` FROM @honorary_note_cleanup_quotation_sql;
EXECUTE `honorary_note_cleanup_quotation_stmt`;
DEALLOCATE PREPARE `honorary_note_cleanup_quotation_stmt`;

ALTER TABLE `invoice`
MODIFY `status` ENUM(
    'invoice.status.non_existent',
    'invoice.status.draft',
    'invoice.status.sent',
    'invoice.status.validated',
    'invoice.status.paid',
    'invoice.status.settled',
    'invoice.status.partially_paid',
    'invoice.status.partially_settled',
    'invoice.status.unpaid',
    'invoice.status.expired',
    'quotation.status.archived'
) DEFAULT NULL;

SET @invoice_has_amount_settled = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'invoice'
      AND `column_name` = 'amountSettled'
);

SET @invoice_add_amount_settled_sql = IF(
    @invoice_has_amount_settled = 0,
    '
    ALTER TABLE `invoice`
    ADD COLUMN `amountSettled` float DEFAULT 0 AFTER `amountPaid`
    ',
    'SELECT 1'
);

PREPARE `invoice_add_amount_settled_stmt` FROM @invoice_add_amount_settled_sql;
EXECUTE `invoice_add_amount_settled_stmt`;
DEALLOCATE PREPARE `invoice_add_amount_settled_stmt`;

UPDATE `invoice`
SET `amountSettled` = 0
WHERE `amountSettled` IS NULL;
