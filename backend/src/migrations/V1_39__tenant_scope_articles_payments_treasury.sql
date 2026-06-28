SET @schema_name = DATABASE();

SET @article_has_cabinet_id = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'article'
    AND COLUMN_NAME = 'cabinetId'
);
SET @article_add_cabinet_id_sql = IF(
  @article_has_cabinet_id = 0,
  'ALTER TABLE `article` ADD COLUMN `cabinetId` INT DEFAULT NULL',
  'SELECT 1'
);
PREPARE article_add_cabinet_id_stmt FROM @article_add_cabinet_id_sql;
EXECUTE article_add_cabinet_id_stmt;
DEALLOCATE PREPARE article_add_cabinet_id_stmt;

SET @payment_has_cabinet_id = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'payment'
    AND COLUMN_NAME = 'cabinetId'
);
SET @payment_add_cabinet_id_sql = IF(
  @payment_has_cabinet_id = 0,
  'ALTER TABLE `payment` ADD COLUMN `cabinetId` INT DEFAULT NULL',
  'SELECT 1'
);
PREPARE payment_add_cabinet_id_stmt FROM @payment_add_cabinet_id_sql;
EXECUTE payment_add_cabinet_id_stmt;
DEALLOCATE PREPARE payment_add_cabinet_id_stmt;

SET @bank_account_has_cabinet_id = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'bank_account'
    AND COLUMN_NAME = 'cabinetId'
);
SET @bank_account_add_cabinet_id_sql = IF(
  @bank_account_has_cabinet_id = 0,
  'ALTER TABLE `bank_account` ADD COLUMN `cabinetId` INT DEFAULT NULL',
  'SELECT 1'
);
PREPARE bank_account_add_cabinet_id_stmt FROM @bank_account_add_cabinet_id_sql;
EXECUTE bank_account_add_cabinet_id_stmt;
DEALLOCATE PREPARE bank_account_add_cabinet_id_stmt;

UPDATE `payment` p
LEFT JOIN `firm` f ON f.`id` = p.`firmId`
SET p.`cabinetId` = f.`cabinetId`
WHERE p.`cabinetId` IS NULL
  AND f.`cabinetId` IS NOT NULL;

UPDATE `payment` p
JOIN `payment-invoice_entry` pie ON pie.`paymentId` = p.`id`
JOIN `invoice` i ON i.`id` = pie.`invoiceId`
SET p.`cabinetId` = i.`cabinetId`
WHERE p.`cabinetId` IS NULL
  AND i.`cabinetId` IS NOT NULL;

UPDATE `payment` p
JOIN `payment_credit_note_entry` pcne ON pcne.`paymentId` = p.`id`
JOIN `credit_note` cn ON cn.`id` = pcne.`creditNoteId`
SET p.`cabinetId` = cn.`cabinetId`
WHERE p.`cabinetId` IS NULL
  AND cn.`cabinetId` IS NOT NULL;

UPDATE `article` a
JOIN `article-quotation-entry` aqe ON aqe.`articleId` = a.`id`
JOIN `quotation` q ON q.`id` = aqe.`quotationId`
SET a.`cabinetId` = q.`cabinetId`
WHERE a.`cabinetId` IS NULL
  AND q.`cabinetId` IS NOT NULL;

UPDATE `article` a
JOIN `article-invoice-entry` aie ON aie.`articleId` = a.`id`
JOIN `invoice` i ON i.`id` = aie.`invoiceId`
SET a.`cabinetId` = i.`cabinetId`
WHERE a.`cabinetId` IS NULL
  AND i.`cabinetId` IS NOT NULL;

UPDATE `article` a
JOIN `article-customer-order-entry` acoe ON acoe.`articleId` = a.`id`
JOIN `customer_order` co ON co.`id` = acoe.`customerOrderId`
SET a.`cabinetId` = co.`cabinetId`
WHERE a.`cabinetId` IS NULL
  AND co.`cabinetId` IS NOT NULL;

UPDATE `article` a
JOIN `article-delivery-note-entry` adne ON adne.`articleId` = a.`id`
JOIN `delivery_note` dn ON dn.`id` = adne.`deliveryNoteId`
SET a.`cabinetId` = dn.`cabinetId`
WHERE a.`cabinetId` IS NULL
  AND dn.`cabinetId` IS NOT NULL;

UPDATE `article` a
JOIN `article-goods-issue-note-entry` agine ON agine.`articleId` = a.`id`
JOIN `goods_issue_note` gin ON gin.`id` = agine.`goodsIssueNoteId`
SET a.`cabinetId` = gin.`cabinetId`
WHERE a.`cabinetId` IS NULL
  AND gin.`cabinetId` IS NOT NULL;

UPDATE `article` a
JOIN `article_credit_note_entry` acne ON acne.`articleId` = a.`id`
JOIN `credit_note` cn ON cn.`id` = acne.`creditNoteId`
SET a.`cabinetId` = cn.`cabinetId`
WHERE a.`cabinetId` IS NULL
  AND cn.`cabinetId` IS NOT NULL;

UPDATE `article` a
JOIN `article_return_note_entry` arne ON arne.`articleId` = a.`id`
JOIN `return_note` rn ON rn.`id` = arne.`returnNoteId`
SET a.`cabinetId` = rn.`cabinetId`
WHERE a.`cabinetId` IS NULL
  AND rn.`cabinetId` IS NOT NULL;

UPDATE `article`
SET `cabinetId` = (SELECT MIN(`id`) FROM `cabinet`)
WHERE `cabinetId` IS NULL
  AND (SELECT COUNT(*) FROM `cabinet`) > 0;

UPDATE `payment`
SET `cabinetId` = (SELECT MIN(`id`) FROM `cabinet`)
WHERE `cabinetId` IS NULL
  AND (SELECT COUNT(*) FROM `cabinet`) > 0;

UPDATE `bank_account`
SET `cabinetId` = (SELECT MIN(`id`) FROM `cabinet`)
WHERE `cabinetId` IS NULL
  AND (SELECT COUNT(*) FROM `cabinet`) > 0;

SET @article_has_cabinet_index = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'article'
    AND INDEX_NAME = 'IDX_article_cabinet_id'
);
SET @article_add_cabinet_index_sql = IF(
  @article_has_cabinet_index = 0,
  'CREATE INDEX `IDX_article_cabinet_id` ON `article` (`cabinetId`)',
  'SELECT 1'
);
PREPARE article_add_cabinet_index_stmt FROM @article_add_cabinet_index_sql;
EXECUTE article_add_cabinet_index_stmt;
DEALLOCATE PREPARE article_add_cabinet_index_stmt;

SET @payment_has_cabinet_index = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'payment'
    AND INDEX_NAME = 'IDX_payment_cabinet_id'
);
SET @payment_add_cabinet_index_sql = IF(
  @payment_has_cabinet_index = 0,
  'CREATE INDEX `IDX_payment_cabinet_id` ON `payment` (`cabinetId`)',
  'SELECT 1'
);
PREPARE payment_add_cabinet_index_stmt FROM @payment_add_cabinet_index_sql;
EXECUTE payment_add_cabinet_index_stmt;
DEALLOCATE PREPARE payment_add_cabinet_index_stmt;

SET @bank_account_has_cabinet_index = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'bank_account'
    AND INDEX_NAME = 'IDX_bank_account_cabinet_id'
);
SET @bank_account_add_cabinet_index_sql = IF(
  @bank_account_has_cabinet_index = 0,
  'CREATE INDEX `IDX_bank_account_cabinet_id` ON `bank_account` (`cabinetId`)',
  'SELECT 1'
);
PREPARE bank_account_add_cabinet_index_stmt FROM @bank_account_add_cabinet_index_sql;
EXECUTE bank_account_add_cabinet_index_stmt;
DEALLOCATE PREPARE bank_account_add_cabinet_index_stmt;

SET @article_has_cabinet_fk = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @schema_name
    AND TABLE_NAME = 'article'
    AND CONSTRAINT_NAME = 'FK_article_cabinet'
);
SET @article_add_cabinet_fk_sql = IF(
  @article_has_cabinet_fk = 0,
  'ALTER TABLE `article` ADD CONSTRAINT `FK_article_cabinet` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE article_add_cabinet_fk_stmt FROM @article_add_cabinet_fk_sql;
EXECUTE article_add_cabinet_fk_stmt;
DEALLOCATE PREPARE article_add_cabinet_fk_stmt;

SET @payment_has_cabinet_fk = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @schema_name
    AND TABLE_NAME = 'payment'
    AND CONSTRAINT_NAME = 'FK_payment_cabinet'
);
SET @payment_add_cabinet_fk_sql = IF(
  @payment_has_cabinet_fk = 0,
  'ALTER TABLE `payment` ADD CONSTRAINT `FK_payment_cabinet` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE payment_add_cabinet_fk_stmt FROM @payment_add_cabinet_fk_sql;
EXECUTE payment_add_cabinet_fk_stmt;
DEALLOCATE PREPARE payment_add_cabinet_fk_stmt;

SET @bank_account_has_cabinet_fk = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @schema_name
    AND TABLE_NAME = 'bank_account'
    AND CONSTRAINT_NAME = 'FK_bank_account_cabinet'
);
SET @bank_account_add_cabinet_fk_sql = IF(
  @bank_account_has_cabinet_fk = 0,
  'ALTER TABLE `bank_account` ADD CONSTRAINT `FK_bank_account_cabinet` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE bank_account_add_cabinet_fk_stmt FROM @bank_account_add_cabinet_fk_sql;
EXECUTE bank_account_add_cabinet_fk_stmt;
DEALLOCATE PREPARE bank_account_add_cabinet_fk_stmt;
