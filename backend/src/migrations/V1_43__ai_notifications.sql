-- AI Notifications table
CREATE TABLE IF NOT EXISTS `ai_notifications` (
  `id` CHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `cabinetId` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'info',
  `priority` VARCHAR(20) NOT NULL DEFAULT 'medium',
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `metadataJson` JSON NULL,
  `isRead` TINYINT(1) NOT NULL DEFAULT 0,
  `readAt` DATETIME NULL,
  `actionUrl` VARCHAR(500) NULL,
  `isDeletionRestricted` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` DATETIME(6) NULL,
  PRIMARY KEY (`id`),
  INDEX `IDX_ai_notification_user` (`userId`),
  INDEX `IDX_ai_notification_cabinet` (`cabinetId`),
  INDEX `IDX_ai_notification_unread` (`userId`, `cabinetId`, `isRead`),
  INDEX `IDX_ai_notification_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
