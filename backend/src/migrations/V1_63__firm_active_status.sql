ALTER TABLE `firm`
ADD COLUMN `isActive` boolean NOT NULL DEFAULT true AFTER `phone`;
