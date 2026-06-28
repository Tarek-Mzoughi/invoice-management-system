ALTER TABLE `cabinet`
ADD COLUMN `website` varchar(255) DEFAULT NULL,
ADD COLUMN `isPerson` tinyint(1) NOT NULL DEFAULT 0,
ADD COLUMN `phoneNumbers` json DEFAULT NULL,
ADD COLUMN `countryId` int DEFAULT NULL,
ADD COLUMN `invoiceDisplayType` enum ('invoice', 'honorary_note') NOT NULL DEFAULT 'invoice',
ADD COLUMN `deliveryAddressId` int DEFAULT NULL,
ADD COLUMN `stampId` int DEFAULT NULL;

UPDATE `cabinet`
SET
    `isPerson` = 0
WHERE
    `isPerson` IS NULL;

UPDATE `cabinet`
SET
    `phoneNumbers` = JSON_ARRAY(`phone`)
WHERE
    `phone` IS NOT NULL
    AND TRIM(`phone`) <> '';

UPDATE `cabinet` c
    LEFT JOIN `address` a ON a.id = c.addressId
SET
    c.countryId = a.countryId
WHERE
    c.countryId IS NULL;

CREATE INDEX `IDX_cabinet_country_id` ON `cabinet` (`countryId`);
CREATE INDEX `IDX_cabinet_delivery_address_id` ON `cabinet` (`deliveryAddressId`);
CREATE INDEX `IDX_cabinet_stamp_id` ON `cabinet` (`stampId`);

ALTER TABLE `cabinet`
ADD CONSTRAINT `FK_cabinet_country_id` FOREIGN KEY (`countryId`) REFERENCES `country` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
ADD CONSTRAINT `FK_cabinet_delivery_address_id` FOREIGN KEY (`deliveryAddressId`) REFERENCES `address` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
ADD CONSTRAINT `FK_cabinet_stamp_id` FOREIGN KEY (`stampId`) REFERENCES `storage` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE TABLE IF NOT EXISTS `cabinet_activities_activity` (
    `cabinetId` int NOT NULL,
    `activityId` int NOT NULL,
    PRIMARY KEY (`cabinetId`, `activityId`),
    INDEX `IDX_cabinet_activities_cabinet_id` (`cabinetId`),
    INDEX `IDX_cabinet_activities_activity_id` (`activityId`),
    CONSTRAINT `FK_cabinet_activities_cabinet_id` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT `FK_cabinet_activities_activity_id` FOREIGN KEY (`activityId`) REFERENCES `activity` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);

INSERT IGNORE INTO
    `cabinet_activities_activity` (`cabinetId`, `activityId`)
SELECT
    `id`,
    `activityId`
FROM
    `cabinet`
WHERE
    `activityId` IS NOT NULL;
