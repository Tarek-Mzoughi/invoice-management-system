CREATE TABLE
    `log` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `event` VARCHAR(255) NULL,
        `api` VARCHAR(255) NULL,
        `method` VARCHAR(50) NULL,
        `userId` VARCHAR(36) NULL,
        `logInfo` json DEFAULT NULL,
        `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`),
        KEY `FK_users_log` (`userId`),
        CONSTRAINT `FK_users_log` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL
    );