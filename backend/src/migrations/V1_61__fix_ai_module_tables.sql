-- Drop empty, mismatched AI module tables
DROP TABLE IF EXISTS `ai_action_logs`;
DROP TABLE IF EXISTS `ai_messages`;
DROP TABLE IF EXISTS `ai_conversations`;

-- Create ai_conversations table with correct schema and references
CREATE TABLE `ai_conversations` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  `userId` VARCHAR(36) NOT NULL,
  `cabinetId` INT NOT NULL,
  `metadataJson` JSON NULL,
  `isDeletionRestricted` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` DATETIME(6) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `IDX_ai_conversation_user` (`userId`),
  INDEX `IDX_ai_conversation_cabinet` (`cabinetId`),
  CONSTRAINT `FK_ai_conversation_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_ai_conversation_cabinet` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ai_messages table with correct schema and references
CREATE TABLE `ai_messages` (
  `id` VARCHAR(36) NOT NULL,
  `conversationId` VARCHAR(36) NOT NULL,
  `cabinetId` INT NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `provider` VARCHAR(50) NULL DEFAULT NULL,
  `intent` VARCHAR(80) NULL DEFAULT NULL,
  `confidence` FLOAT NULL DEFAULT NULL,
  `riskLevel` VARCHAR(20) NULL DEFAULT NULL,
  `metadataJson` JSON NULL,
  `isDeletionRestricted` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` DATETIME(6) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `IDX_ai_message_conversation` (`conversationId`),
  INDEX `IDX_ai_message_cabinet` (`cabinetId`),
  INDEX `IDX_ai_message_user` (`userId`),
  CONSTRAINT `FK_ai_message_conversation` FOREIGN KEY (`conversationId`) REFERENCES `ai_conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_ai_message_cabinet` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_ai_message_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ai_action_logs table with correct schema and references
CREATE TABLE `ai_action_logs` (
  `id` VARCHAR(36) NOT NULL,
  `conversationId` VARCHAR(36) NOT NULL,
  `messageId` VARCHAR(36) NULL DEFAULT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `cabinetId` INT NOT NULL,
  `actionType` VARCHAR(80) NOT NULL,
  `status` VARCHAR(40) NOT NULL,
  `riskLevel` VARCHAR(20) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT NULL DEFAULT NULL,
  `payloadJson` JSON NULL,
  `validationJson` JSON NULL,
  `resultJson` JSON NULL,
  `errorMessage` TEXT NULL DEFAULT NULL,
  `confirmedAt` DATETIME NULL DEFAULT NULL,
  `executedAt` DATETIME NULL DEFAULT NULL,
  `isDeletionRestricted` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` DATETIME(6) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `IDX_ai_action_log_conversation` (`conversationId`),
  INDEX `IDX_ai_action_log_user` (`userId`),
  INDEX `IDX_ai_action_log_cabinet` (`cabinetId`),
  CONSTRAINT `FK_ai_action_log_conversation` FOREIGN KEY (`conversationId`) REFERENCES `ai_conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_ai_action_log_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_ai_action_log_cabinet` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
