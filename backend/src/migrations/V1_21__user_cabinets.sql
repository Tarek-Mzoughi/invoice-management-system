CREATE TABLE IF NOT EXISTS `user_cabinets` (
  `userId` varchar(36) NOT NULL,
  `cabinetId` int NOT NULL,
  PRIMARY KEY (`userId`, `cabinetId`),
  KEY `IDX_user_cabinets_user_id` (`userId`),
  KEY `IDX_user_cabinets_cabinet_id` (`cabinetId`),
  CONSTRAINT `FK_user_cabinets_user_id` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_user_cabinets_cabinet_id` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT IGNORE INTO `user_cabinets` (`userId`, `cabinetId`)
SELECT `users`.`id`, `default_cabinet`.`id`
FROM `users`
JOIN (
  SELECT MIN(`id`) AS `id`
  FROM `cabinet`
) AS `default_cabinet`
WHERE `default_cabinet`.`id` IS NOT NULL;
