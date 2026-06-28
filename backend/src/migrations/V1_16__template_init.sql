CREATE TABLE
    IF NOT EXISTS `template-category` (
        `id` int NOT NULL AUTO_INCREMENT,
        `label` VARCHAR(255) DEFAULT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW (),
        `updatedAt` TIMESTAMP DEFAULT NOW (),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    IF NOT EXISTS `template` (
        `id` int NOT NULL AUTO_INCREMENT,
        `markdownContent` TEXT DEFAULT NULL,
        `stylesheetContent` TEXT DEFAULT NULL,
        `categoryId` int NOT NULL,
        `createdAt` TIMESTAMP DEFAULT NOW (),
        `updatedAt` TIMESTAMP DEFAULT NOW (),
        `deletedAt` TIMESTAMP DEFAULT NULL,
        `isDeletionRestricted` BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (`id`),
        KEY `FK_template-category_template` (`categoryId`),
        CONSTRAINT `FK_template-category_template` FOREIGN KEY (`categoryId`) REFERENCES `template-category` (`id`) ON DELETE CASCADE
    );