ALTER TABLE `firm`
ADD COLUMN `entityType` varchar(20) NOT NULL DEFAULT 'clients' AFTER `name`;

UPDATE `firm`
SET `entityType` = 'clients'
WHERE `entityType` IS NULL OR `entityType` = '';
