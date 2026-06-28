CREATE TABLE IF NOT EXISTS `store` (
    `id` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) DEFAULT NULL,
    `value` JSON DEFAULT NULL,
    `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `deletedAt` DATETIME(6) DEFAULT NULL,
    `isDeletionRestricted` TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
);

INSERT INTO `store` (`id`, `description`, `value`, `isDeletionRestricted`)
VALUES
    ('core', 'Core Application Settings', '{"name": "Invoicing System", "support": "support@invoicing-system.tn", "address": "Tunis, Tunisia"}', 1),
    ('faqs', 'Frequently Asked Questions', '[]', 1)
ON DUPLICATE KEY UPDATE `id`=`id`;
