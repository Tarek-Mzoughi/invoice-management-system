ALTER TABLE `article`
ADD COLUMN `reference` varchar(100) DEFAULT NULL,
ADD COLUMN `destination` enum ('selling', 'buying', 'both') NOT NULL DEFAULT 'selling',
ADD COLUMN `articleType` enum ('product', 'service', 'asset') NOT NULL DEFAULT 'product',
ADD COLUMN `imageId` int DEFAULT NULL,
ADD COLUMN `salePrice` decimal(15, 3) DEFAULT NULL,
ADD COLUMN `purchasePrice` decimal(15, 3) DEFAULT NULL,
ADD COLUMN `productionCost` decimal(15, 3) DEFAULT NULL,
ADD COLUMN `taxIds` json DEFAULT NULL,
ADD COLUMN `additionalTaxIds` json DEFAULT NULL,
ADD COLUMN `unit` varchar(100) DEFAULT NULL,
ADD COLUMN `family` varchar(100) DEFAULT NULL,
ADD COLUMN `subFamily` varchar(100) DEFAULT NULL,
ADD COLUMN `brand` varchar(100) DEFAULT NULL,
ADD COLUMN `priceListName` varchar(100) DEFAULT NULL,
ADD COLUMN `barcode` varchar(255) DEFAULT NULL,
ADD COLUMN `privateNotes` text DEFAULT NULL,
ADD COLUMN `attachmentIds` json DEFAULT NULL,
ADD COLUMN `allowEmptyStock` tinyint(1) NOT NULL DEFAULT 0,
ADD COLUMN `stockAlertEnabled` tinyint(1) NOT NULL DEFAULT 0,
ADD COLUMN `stockAlertThreshold` int DEFAULT NULL,
ADD COLUMN `defaultWarehouse` varchar(100) DEFAULT NULL,
ADD COLUMN `discountEnabled` tinyint(1) NOT NULL DEFAULT 0,
ADD COLUMN `discountValue` float DEFAULT NULL,
ADD COLUMN `discountType` enum ('percentage', 'amount') NOT NULL DEFAULT 'percentage';

ALTER TABLE `article`
MODIFY COLUMN `description` text NULL;

CREATE INDEX `IDX_article_destination` ON `article` (`destination`);
CREATE INDEX `IDX_article_type` ON `article` (`articleType`);
CREATE INDEX `IDX_article_reference` ON `article` (`reference`);
CREATE INDEX `IDX_article_image_id` ON `article` (`imageId`);

ALTER TABLE `article`
ADD CONSTRAINT `FK_article_image_id` FOREIGN KEY (`imageId`) REFERENCES `storage` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
