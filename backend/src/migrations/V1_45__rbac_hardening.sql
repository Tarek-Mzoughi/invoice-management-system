SET @schema_name = DATABASE();

SET @roles_has_cabinet_id = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'roles'
    AND COLUMN_NAME = 'cabinetId'
);
SET @roles_add_cabinet_id_sql = IF(
  @roles_has_cabinet_id = 0,
  'ALTER TABLE `roles` ADD COLUMN `cabinetId` INT DEFAULT NULL',
  'SELECT 1'
);
PREPARE roles_add_cabinet_id_stmt FROM @roles_add_cabinet_id_sql;
EXECUTE roles_add_cabinet_id_stmt;
DEALLOCATE PREPARE roles_add_cabinet_id_stmt;

SET @roles_label_unique_index = (
  SELECT INDEX_NAME
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'roles'
    AND COLUMN_NAME = 'label'
    AND NON_UNIQUE = 0
  ORDER BY INDEX_NAME
  LIMIT 1
);
SET @roles_drop_label_unique_sql = IF(
  @roles_label_unique_index IS NOT NULL,
  CONCAT('ALTER TABLE `roles` DROP INDEX `', @roles_label_unique_index, '`'),
  'SELECT 1'
);
PREPARE roles_drop_label_unique_stmt FROM @roles_drop_label_unique_sql;
EXECUTE roles_drop_label_unique_stmt;
DEALLOCATE PREPARE roles_drop_label_unique_stmt;

SET @roles_label_cabinet_index_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'roles'
    AND INDEX_NAME = 'IDX_roles_label_cabinet'
);
SET @roles_add_label_cabinet_index_sql = IF(
  @roles_label_cabinet_index_exists = 0,
  'CREATE INDEX `IDX_roles_label_cabinet` ON `roles` (`label`, `cabinetId`)',
  'SELECT 1'
);
PREPARE roles_add_label_cabinet_index_stmt FROM @roles_add_label_cabinet_index_sql;
EXECUTE roles_add_label_cabinet_index_stmt;
DEALLOCATE PREPARE roles_add_label_cabinet_index_stmt;

SET @roles_cabinet_fk_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @schema_name
    AND TABLE_NAME = 'roles'
    AND CONSTRAINT_NAME = 'FK_roles_cabinet'
);
SET @roles_add_cabinet_fk_sql = IF(
  @roles_cabinet_fk_exists = 0,
  'ALTER TABLE `roles` ADD CONSTRAINT `FK_roles_cabinet` FOREIGN KEY (`cabinetId`) REFERENCES `cabinet` (`id`) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE roles_add_cabinet_fk_stmt FROM @roles_add_cabinet_fk_sql;
EXECUTE roles_add_cabinet_fk_stmt;
DEALLOCATE PREPARE roles_add_cabinet_fk_stmt;

INSERT INTO `permissions` (`id`, `label`, `description`)
SELECT seed.`id`, seed.`label`, seed.`description`
FROM (
  SELECT 'read-dashboard' AS `id`, 'READ_DASHBOARD' AS `label`, 'Permission to read dashboard' AS `description`
  UNION ALL SELECT 'read-enterprise', 'READ_ENTERPRISE', 'Permission to read enterprise'
  UNION ALL SELECT 'create-enterprise', 'CREATE_ENTERPRISE', 'Permission to create enterprise'
  UNION ALL SELECT 'update-enterprise', 'UPDATE_ENTERPRISE', 'Permission to update enterprise'
  UNION ALL SELECT 'delete-enterprise', 'DELETE_ENTERPRISE', 'Permission to delete enterprise'
  UNION ALL SELECT 'read-selling_documents', 'READ_SELLING_DOCUMENTS', 'Permission to read selling documents'
  UNION ALL SELECT 'create-selling_documents', 'CREATE_SELLING_DOCUMENTS', 'Permission to create selling documents'
  UNION ALL SELECT 'update-selling_documents', 'UPDATE_SELLING_DOCUMENTS', 'Permission to update selling documents'
  UNION ALL SELECT 'delete-selling_documents', 'DELETE_SELLING_DOCUMENTS', 'Permission to delete selling documents'
  UNION ALL SELECT 'read-buying_documents', 'READ_BUYING_DOCUMENTS', 'Permission to read buying documents'
  UNION ALL SELECT 'create-buying_documents', 'CREATE_BUYING_DOCUMENTS', 'Permission to create buying documents'
  UNION ALL SELECT 'update-buying_documents', 'UPDATE_BUYING_DOCUMENTS', 'Permission to update buying documents'
  UNION ALL SELECT 'delete-buying_documents', 'DELETE_BUYING_DOCUMENTS', 'Permission to delete buying documents'
  UNION ALL SELECT 'read-payments', 'READ_PAYMENTS', 'Permission to read payments'
  UNION ALL SELECT 'create-payments', 'CREATE_PAYMENTS', 'Permission to create payments'
  UNION ALL SELECT 'update-payments', 'UPDATE_PAYMENTS', 'Permission to update payments'
  UNION ALL SELECT 'delete-payments', 'DELETE_PAYMENTS', 'Permission to delete payments'
  UNION ALL SELECT 'read-suppliers', 'READ_SUPPLIERS', 'Permission to read suppliers'
  UNION ALL SELECT 'create-suppliers', 'CREATE_SUPPLIERS', 'Permission to create suppliers'
  UNION ALL SELECT 'update-suppliers', 'UPDATE_SUPPLIERS', 'Permission to update suppliers'
  UNION ALL SELECT 'delete-suppliers', 'DELETE_SUPPLIERS', 'Permission to delete suppliers'
  UNION ALL SELECT 'read-clients', 'READ_CLIENTS', 'Permission to read clients'
  UNION ALL SELECT 'create-clients', 'CREATE_CLIENTS', 'Permission to create clients'
  UNION ALL SELECT 'update-clients', 'UPDATE_CLIENTS', 'Permission to update clients'
  UNION ALL SELECT 'delete-clients', 'DELETE_CLIENTS', 'Permission to delete clients'
  UNION ALL SELECT 'read-products', 'READ_PRODUCTS', 'Permission to read products'
  UNION ALL SELECT 'create-products', 'CREATE_PRODUCTS', 'Permission to create products'
  UNION ALL SELECT 'update-products', 'UPDATE_PRODUCTS', 'Permission to update products'
  UNION ALL SELECT 'delete-products', 'DELETE_PRODUCTS', 'Permission to delete products'
  UNION ALL SELECT 'read-treasury', 'READ_TREASURY', 'Permission to read treasury'
  UNION ALL SELECT 'create-treasury', 'CREATE_TREASURY', 'Permission to create treasury'
  UNION ALL SELECT 'update-treasury', 'UPDATE_TREASURY', 'Permission to update treasury'
  UNION ALL SELECT 'delete-treasury', 'DELETE_TREASURY', 'Permission to delete treasury'
  UNION ALL SELECT 'read-stock', 'READ_STOCK', 'Permission to read stock'
  UNION ALL SELECT 'create-stock', 'CREATE_STOCK', 'Permission to create stock'
  UNION ALL SELECT 'update-stock', 'UPDATE_STOCK', 'Permission to update stock'
  UNION ALL SELECT 'delete-stock', 'DELETE_STOCK', 'Permission to delete stock'
  UNION ALL SELECT 'read-warehouses', 'READ_WAREHOUSES', 'Permission to read warehouses'
  UNION ALL SELECT 'create-warehouses', 'CREATE_WAREHOUSES', 'Permission to create warehouses'
  UNION ALL SELECT 'update-warehouses', 'UPDATE_WAREHOUSES', 'Permission to update warehouses'
  UNION ALL SELECT 'delete-warehouses', 'DELETE_WAREHOUSES', 'Permission to delete warehouses'
  UNION ALL SELECT 'read-projects', 'READ_PROJECTS', 'Permission to read projects'
  UNION ALL SELECT 'create-projects', 'CREATE_PROJECTS', 'Permission to create projects'
  UNION ALL SELECT 'update-projects', 'UPDATE_PROJECTS', 'Permission to update projects'
  UNION ALL SELECT 'delete-projects', 'DELETE_PROJECTS', 'Permission to delete projects'
  UNION ALL SELECT 'read-price_lists', 'READ_PRICE_LISTS', 'Permission to read price lists'
  UNION ALL SELECT 'create-price_lists', 'CREATE_PRICE_LISTS', 'Permission to create price lists'
  UNION ALL SELECT 'update-price_lists', 'UPDATE_PRICE_LISTS', 'Permission to update price lists'
  UNION ALL SELECT 'delete-price_lists', 'DELETE_PRICE_LISTS', 'Permission to delete price lists'
  UNION ALL SELECT 'read-taxes', 'READ_TAXES', 'Permission to read taxes'
  UNION ALL SELECT 'create-taxes', 'CREATE_TAXES', 'Permission to create taxes'
  UNION ALL SELECT 'update-taxes', 'UPDATE_TAXES', 'Permission to update taxes'
  UNION ALL SELECT 'delete-taxes', 'DELETE_TAXES', 'Permission to delete taxes'
  UNION ALL SELECT 'read-stock_settings', 'READ_STOCK_SETTINGS', 'Permission to read stock settings'
  UNION ALL SELECT 'create-stock_settings', 'CREATE_STOCK_SETTINGS', 'Permission to create stock settings'
  UNION ALL SELECT 'update-stock_settings', 'UPDATE_STOCK_SETTINGS', 'Permission to update stock settings'
  UNION ALL SELECT 'delete-stock_settings', 'DELETE_STOCK_SETTINGS', 'Permission to delete stock settings'
  UNION ALL SELECT 'read-document_settings', 'READ_DOCUMENT_SETTINGS', 'Permission to read document settings'
  UNION ALL SELECT 'create-document_settings', 'CREATE_DOCUMENT_SETTINGS', 'Permission to create document settings'
  UNION ALL SELECT 'update-document_settings', 'UPDATE_DOCUMENT_SETTINGS', 'Permission to update document settings'
  UNION ALL SELECT 'delete-document_settings', 'DELETE_DOCUMENT_SETTINGS', 'Permission to delete document settings'
  UNION ALL SELECT 'read-user_management', 'READ_USER_MANAGEMENT', 'Permission to read user management'
  UNION ALL SELECT 'create-user_management', 'CREATE_USER_MANAGEMENT', 'Permission to create user management'
  UNION ALL SELECT 'update-user_management', 'UPDATE_USER_MANAGEMENT', 'Permission to update user management'
  UNION ALL SELECT 'delete-user_management', 'DELETE_USER_MANAGEMENT', 'Permission to delete user management'
) seed
LEFT JOIN `permissions` existing_permissions
  ON existing_permissions.`id` = seed.`id`
WHERE existing_permissions.`id` IS NULL;

INSERT INTO `role_permissions` (`roleId`, `permissionId`)
SELECT roles.`id`, permissions.`id`
FROM `roles` roles
JOIN `permissions` permissions
  ON permissions.`id` IN (
    'read-dashboard',
    'read-enterprise', 'create-enterprise', 'update-enterprise', 'delete-enterprise',
    'read-selling_documents', 'create-selling_documents', 'update-selling_documents', 'delete-selling_documents',
    'read-buying_documents', 'create-buying_documents', 'update-buying_documents', 'delete-buying_documents',
    'read-payments', 'create-payments', 'update-payments', 'delete-payments',
    'read-suppliers', 'create-suppliers', 'update-suppliers', 'delete-suppliers',
    'read-clients', 'create-clients', 'update-clients', 'delete-clients',
    'read-products', 'create-products', 'update-products', 'delete-products',
    'read-treasury', 'create-treasury', 'update-treasury', 'delete-treasury',
    'read-stock', 'create-stock', 'update-stock', 'delete-stock',
    'read-warehouses', 'create-warehouses', 'update-warehouses', 'delete-warehouses',
    'read-projects', 'create-projects', 'update-projects', 'delete-projects',
    'read-price_lists', 'create-price_lists', 'update-price_lists', 'delete-price_lists',
    'read-taxes', 'create-taxes', 'update-taxes', 'delete-taxes',
    'read-stock_settings', 'create-stock_settings', 'update-stock_settings', 'delete-stock_settings',
    'read-document_settings', 'create-document_settings', 'update-document_settings', 'delete-document_settings',
    'read-user_management', 'create-user_management', 'update-user_management', 'delete-user_management'
  )
LEFT JOIN `role_permissions` existing_role_permissions
  ON existing_role_permissions.`roleId` = roles.`id`
  AND existing_role_permissions.`permissionId` = permissions.`id`
WHERE LOWER(roles.`label`) = 'admin'
  AND existing_role_permissions.`id` IS NULL;
