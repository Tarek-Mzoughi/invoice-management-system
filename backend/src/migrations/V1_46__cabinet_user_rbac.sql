SET @schema_name = DATABASE();

SET @user_cabinets_has_role_type = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'user_cabinets'
    AND COLUMN_NAME = 'roleType'
);
SET @user_cabinets_add_role_type_sql = IF(
  @user_cabinets_has_role_type = 0,
  "ALTER TABLE `user_cabinets` ADD COLUMN `roleType` ENUM('ADMIN', 'COLLABORATOR', 'CUSTOM') NOT NULL DEFAULT 'COLLABORATOR'",
  'SELECT 1'
);
PREPARE user_cabinets_add_role_type_stmt FROM @user_cabinets_add_role_type_sql;
EXECUTE user_cabinets_add_role_type_stmt;
DEALLOCATE PREPARE user_cabinets_add_role_type_stmt;

SET @user_cabinets_has_is_active = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'user_cabinets'
    AND COLUMN_NAME = 'isActive'
);
SET @user_cabinets_add_is_active_sql = IF(
  @user_cabinets_has_is_active = 0,
  'ALTER TABLE `user_cabinets` ADD COLUMN `isActive` TINYINT(1) NOT NULL DEFAULT 1',
  'SELECT 1'
);
PREPARE user_cabinets_add_is_active_stmt FROM @user_cabinets_add_is_active_sql;
EXECUTE user_cabinets_add_is_active_stmt;
DEALLOCATE PREPARE user_cabinets_add_is_active_stmt;

SET @user_cabinets_has_is_principal = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'user_cabinets'
    AND COLUMN_NAME = 'isPrincipalAdmin'
);
SET @user_cabinets_add_is_principal_sql = IF(
  @user_cabinets_has_is_principal = 0,
  'ALTER TABLE `user_cabinets` ADD COLUMN `isPrincipalAdmin` TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE user_cabinets_add_is_principal_stmt FROM @user_cabinets_add_is_principal_sql;
EXECUTE user_cabinets_add_is_principal_stmt;
DEALLOCATE PREPARE user_cabinets_add_is_principal_stmt;

SET @user_cabinets_has_created_at = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'user_cabinets'
    AND COLUMN_NAME = 'createdAt'
);
SET @user_cabinets_add_created_at_sql = IF(
  @user_cabinets_has_created_at = 0,
  'ALTER TABLE `user_cabinets` ADD COLUMN `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE user_cabinets_add_created_at_stmt FROM @user_cabinets_add_created_at_sql;
EXECUTE user_cabinets_add_created_at_stmt;
DEALLOCATE PREPARE user_cabinets_add_created_at_stmt;

SET @user_cabinets_has_updated_at = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'user_cabinets'
    AND COLUMN_NAME = 'updatedAt'
);
SET @user_cabinets_add_updated_at_sql = IF(
  @user_cabinets_has_updated_at = 0,
  'ALTER TABLE `user_cabinets` ADD COLUMN `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE user_cabinets_add_updated_at_stmt FROM @user_cabinets_add_updated_at_sql;
EXECUTE user_cabinets_add_updated_at_stmt;
DEALLOCATE PREPARE user_cabinets_add_updated_at_stmt;

CREATE TABLE IF NOT EXISTS `user_cabinet_permissions` (
  `userId` varchar(36) NOT NULL,
  `cabinetId` int NOT NULL,
  `permissionId` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`userId`, `cabinetId`, `permissionId`),
  KEY `IDX_user_cabinet_permissions_user_cabinet` (`userId`, `cabinetId`),
  KEY `IDX_user_cabinet_permissions_permission` (`permissionId`),
  CONSTRAINT `FK_user_cabinet_permissions_membership`
    FOREIGN KEY (`userId`, `cabinetId`)
    REFERENCES `user_cabinets` (`userId`, `cabinetId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `FK_user_cabinet_permissions_permission`
    FOREIGN KEY (`permissionId`)
    REFERENCES `permissions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

UPDATE `user_cabinets` membership
JOIN `users` users
  ON users.`id` = membership.`userId`
LEFT JOIN `roles` roles
  ON roles.`id` = users.`roleId`
SET membership.`roleType` = CASE
    WHEN LOWER(COALESCE(roles.`label`, '')) IN ('admin', 'owner', 'proprietaire', 'propriétaire') THEN 'ADMIN'
    WHEN LOWER(COALESCE(roles.`label`, '')) IN ('standard-user', 'collaborator', 'collaborateur') THEN 'COLLABORATOR'
    WHEN roles.`id` IS NOT NULL THEN 'CUSTOM'
    ELSE membership.`roleType`
  END;

INSERT IGNORE INTO `user_cabinet_permissions` (`userId`, `cabinetId`, `permissionId`)
SELECT membership.`userId`, membership.`cabinetId`, role_permissions.`permissionId`
FROM `user_cabinets` membership
JOIN `users` users
  ON users.`id` = membership.`userId`
JOIN `roles` roles
  ON roles.`id` = users.`roleId`
JOIN `role_permissions` role_permissions
  ON role_permissions.`roleId` = roles.`id`
JOIN `permissions` permissions
  ON permissions.`id` = role_permissions.`permissionId`
WHERE membership.`roleType` = 'CUSTOM';

UPDATE `user_cabinets`
SET `isPrincipalAdmin` = 0
WHERE `roleType` = 'ADMIN';

CREATE TEMPORARY TABLE IF NOT EXISTS `tmp_principal_admins` (
  `userId` varchar(36) NOT NULL,
  `cabinetId` int NOT NULL,
  PRIMARY KEY (`userId`, `cabinetId`)
);

TRUNCATE TABLE `tmp_principal_admins`;

INSERT INTO `tmp_principal_admins` (`userId`, `cabinetId`)
SELECT membership.`userId`, membership.`cabinetId`
FROM `user_cabinets` membership
JOIN `users` users
  ON users.`id` = membership.`userId`
WHERE membership.`roleType` = 'ADMIN'
  AND membership.`isActive` = 1
  AND users.`isActive` = 1
  AND NOT EXISTS (
    SELECT 1
    FROM `user_cabinets` earlier_membership
    JOIN `users` earlier_users
      ON earlier_users.`id` = earlier_membership.`userId`
    WHERE earlier_membership.`cabinetId` = membership.`cabinetId`
      AND earlier_membership.`roleType` = 'ADMIN'
      AND earlier_membership.`isActive` = 1
      AND earlier_users.`isActive` = 1
      AND (
        earlier_users.`createdAt` < users.`createdAt`
        OR (
          earlier_users.`createdAt` = users.`createdAt`
          AND earlier_users.`id` < users.`id`
        )
      )
  );

UPDATE `user_cabinets` membership
JOIN `tmp_principal_admins` principal_admins
  ON principal_admins.`userId` = membership.`userId`
  AND principal_admins.`cabinetId` = membership.`cabinetId`
SET membership.`isPrincipalAdmin` = 1;

DROP TEMPORARY TABLE IF EXISTS `tmp_principal_admins`;
