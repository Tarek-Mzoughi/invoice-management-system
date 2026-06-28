-- AI Reminders table for scheduled client follow-ups
CREATE TABLE IF NOT EXISTS `ai_reminders` (
  `id` CHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `cabinetId` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'custom',
  `status` VARCHAR(40) NOT NULL DEFAULT 'pending',
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `scheduledAt` DATETIME NOT NULL,
  `sentAt` DATETIME NULL,
  `entityId` INT NULL,
  `entityType` VARCHAR(50) NULL,
  `metadataJson` JSON NULL,
  `isDeletionRestricted` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` DATETIME(6) NULL,
  PRIMARY KEY (`id`),
  INDEX `IDX_ai_reminder_user` (`userId`),
  INDEX `IDX_ai_reminder_cabinet` (`cabinetId`),
  INDEX `IDX_ai_reminder_pending` (`status`, `scheduledAt`),
  INDEX `IDX_ai_reminder_entity` (`entityType`, `entityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
