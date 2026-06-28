-- AI Module: conversations, messages, action logs

CREATE TABLE IF NOT EXISTS `ai_conversations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NULL,
  `userId` INT NULL,
  `cabinetId` INT NULL,
  `isDeletionRestricted` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` DATETIME(6) NULL,
  PRIMARY KEY (`id`),
  INDEX `IDX_ai_conversation_user` (`userId`),
  INDEX `IDX_ai_conversation_cabinet` (`cabinetId`),
  CONSTRAINT `FK_ai_conversation_user` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_ai_conversation_cabinet` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `conversationId` INT NOT NULL,
  `role` ENUM('user', 'assistant', 'system', 'tool') NOT NULL,
  `content` TEXT NOT NULL,
  `metadata` JSON NULL,
  `isDeletionRestricted` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` DATETIME(6) NULL,
  PRIMARY KEY (`id`),
  INDEX `IDX_ai_message_conversation` (`conversationId`),
  CONSTRAINT `FK_ai_message_conversation` FOREIGN KEY (`conversationId`) REFERENCES `ai_conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_action_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NULL,
  `cabinetId` INT NULL,
  `conversationId` INT NULL,
  `intent` ENUM(
    'ANSWER_BUSINESS_QUESTION',
    'GENERATE_CHART',
    'CREATE_INVOICE_DRAFT',
    'CREATE_QUOTE_DRAFT',
    'CREATE_CUSTOMER',
    'CREATE_PAYMENT',
    'TRANSFORM_QUOTE_TO_INVOICE',
    'SUMMARIZE_DASHBOARD',
    'EXPLAIN_ENTITY',
    'UNKNOWN_INTENT'
  ) NOT NULL,
  `status` ENUM('pending', 'confirmed', 'executed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  `inputMessage` TEXT NULL,
  `extractedArguments` JSON NULL,
  `previewPayload` JSON NULL,
  `executionResult` JSON NULL,
  `errorMessage` TEXT NULL,
  `confirmedAt` DATETIME NULL,
  `executedAt` DATETIME NULL,
  `isDeletionRestricted` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` DATETIME(6) NULL,
  PRIMARY KEY (`id`),
  INDEX `IDX_ai_action_log_user` (`userId`),
  INDEX `IDX_ai_action_log_cabinet` (`cabinetId`),
  INDEX `IDX_ai_action_log_status` (`status`),
  CONSTRAINT `FK_ai_action_log_user` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_ai_action_log_cabinet` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
