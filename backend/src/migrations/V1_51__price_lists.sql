SET @schema_name = DATABASE();

CREATE TABLE IF NOT EXISTS `price_list` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `cabinetId` INT DEFAULT NULL,
  `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` DATETIME(6) DEFAULT NULL,
  `isDeletionRestricted` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

SET @price_list_has_cabinet_index = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'price_list'
    AND INDEX_NAME = 'IDX_price_list_cabinet_id'
);
SET @price_list_add_cabinet_index_sql = IF(
  @price_list_has_cabinet_index = 0,
  'CREATE INDEX `IDX_price_list_cabinet_id` ON `price_list` (`cabinetId`)',
  'SELECT 1'
);
PREPARE price_list_add_cabinet_index_stmt FROM @price_list_add_cabinet_index_sql;
EXECUTE price_list_add_cabinet_index_stmt;
DEALLOCATE PREPARE price_list_add_cabinet_index_stmt;

SET @price_list_has_name_cabinet_index = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'price_list'
    AND INDEX_NAME = 'IDX_price_list_name_cabinet'
);
SET @price_list_add_name_cabinet_index_sql = IF(
  @price_list_has_name_cabinet_index = 0,
  'CREATE INDEX `IDX_price_list_name_cabinet` ON `price_list` (`name`, `cabinetId`)',
  'SELECT 1'
);
PREPARE price_list_add_name_cabinet_index_stmt FROM @price_list_add_name_cabinet_index_sql;
EXECUTE price_list_add_name_cabinet_index_stmt;
DEALLOCATE PREPARE price_list_add_name_cabinet_index_stmt;

SET @price_list_has_cabinet_fk = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @schema_name
    AND TABLE_NAME = 'price_list'
    AND CONSTRAINT_NAME = 'FK_price_list_cabinet'
);
SET @price_list_add_cabinet_fk_sql = IF(
  @price_list_has_cabinet_fk = 0,
  'ALTER TABLE `price_list` ADD CONSTRAINT `FK_price_list_cabinet` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE price_list_add_cabinet_fk_stmt FROM @price_list_add_cabinet_fk_sql;
EXECUTE price_list_add_cabinet_fk_stmt;
DEALLOCATE PREPARE price_list_add_cabinet_fk_stmt;

SET @article_has_price_list_id = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'article'
    AND COLUMN_NAME = 'priceListId'
);
SET @article_add_price_list_id_sql = IF(
  @article_has_price_list_id = 0,
  'ALTER TABLE `article` ADD COLUMN `priceListId` INT DEFAULT NULL',
  'SELECT 1'
);
PREPARE article_add_price_list_id_stmt FROM @article_add_price_list_id_sql;
EXECUTE article_add_price_list_id_stmt;
DEALLOCATE PREPARE article_add_price_list_id_stmt;

SET @article_has_price_list_index = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'article'
    AND INDEX_NAME = 'IDX_article_price_list_id'
);
SET @article_add_price_list_index_sql = IF(
  @article_has_price_list_index = 0,
  'CREATE INDEX `IDX_article_price_list_id` ON `article` (`priceListId`)',
  'SELECT 1'
);
PREPARE article_add_price_list_index_stmt FROM @article_add_price_list_index_sql;
EXECUTE article_add_price_list_index_stmt;
DEALLOCATE PREPARE article_add_price_list_index_stmt;

INSERT INTO `price_list` (`name`, `active`, `cabinetId`, `createdAt`, `updatedAt`)
SELECT seed.`name`, 1, cabinet.`id`, NOW(6), NOW(6)
FROM `cabinet` cabinet
JOIN (
  SELECT 'Prix de promotion' AS `name`
  UNION ALL SELECT 'Prix de gros'
  UNION ALL SELECT 'Prix par défaut'
) seed
LEFT JOIN `price_list` existing_price_list
  ON existing_price_list.`cabinetId` = cabinet.`id`
  AND existing_price_list.`name` = seed.`name`
  AND existing_price_list.`deletedAt` IS NULL
WHERE existing_price_list.`id` IS NULL;

INSERT INTO `price_list` (`name`, `active`, `cabinetId`, `createdAt`, `updatedAt`)
SELECT DISTINCT TRIM(article.`priceListName`) AS `name`, 1, article.`cabinetId`, NOW(6), NOW(6)
FROM `article` article
LEFT JOIN `price_list` existing_price_list
  ON existing_price_list.`cabinetId` = article.`cabinetId`
  AND existing_price_list.`name` = TRIM(article.`priceListName`)
  AND existing_price_list.`deletedAt` IS NULL
WHERE article.`cabinetId` IS NOT NULL
  AND article.`priceListName` IS NOT NULL
  AND TRIM(article.`priceListName`) <> ''
  AND existing_price_list.`id` IS NULL;

UPDATE `article` article
JOIN `price_list` price_list
  ON price_list.`cabinetId` = article.`cabinetId`
  AND price_list.`name` = TRIM(article.`priceListName`)
  AND price_list.`deletedAt` IS NULL
SET article.`priceListId` = price_list.`id`
WHERE article.`priceListId` IS NULL
  AND article.`priceListName` IS NOT NULL
  AND TRIM(article.`priceListName`) <> '';

SET @article_has_price_list_fk = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @schema_name
    AND TABLE_NAME = 'article'
    AND CONSTRAINT_NAME = 'FK_article_price_list'
);
SET @article_add_price_list_fk_sql = IF(
  @article_has_price_list_fk = 0,
  'ALTER TABLE `article` ADD CONSTRAINT `FK_article_price_list` FOREIGN KEY (`priceListId`) REFERENCES `price_list` (`id`) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE article_add_price_list_fk_stmt FROM @article_add_price_list_fk_sql;
EXECUTE article_add_price_list_fk_stmt;
DEALLOCATE PREPARE article_add_price_list_fk_stmt;
