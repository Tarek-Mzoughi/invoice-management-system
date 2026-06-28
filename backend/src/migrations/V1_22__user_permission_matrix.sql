INSERT INTO `permissions` (`id`, `label`, `description`)
SELECT
    seed.`id`,
    seed.`label`,
    seed.`description`
FROM (
    SELECT
        CONCAT(actions.`action`, '-', entities.`entity`) AS `id`,
        UPPER(REPLACE(CONCAT(actions.`action`, '_', entities.`entity`), '-', '_')) AS `label`,
        CONCAT('Permission to ', actions.`action`, ' ', REPLACE(entities.`entity`, '_', ' ')) AS `description`
    FROM (
        SELECT 'read' AS `action`
        UNION ALL SELECT 'create'
        UNION ALL SELECT 'update'
        UNION ALL SELECT 'delete'
    ) AS actions
    CROSS JOIN (
        SELECT 'dashboard' AS `entity`
        UNION ALL SELECT 'enterprise'
        UNION ALL SELECT 'selling_documents'
        UNION ALL SELECT 'buying_documents'
        UNION ALL SELECT 'payments'
        UNION ALL SELECT 'suppliers'
        UNION ALL SELECT 'clients'
        UNION ALL SELECT 'products'
        UNION ALL SELECT 'treasury'
        UNION ALL SELECT 'stock'
        UNION ALL SELECT 'warehouses'
        UNION ALL SELECT 'projects'
        UNION ALL SELECT 'price_lists'
        UNION ALL SELECT 'taxes'
        UNION ALL SELECT 'stock_settings'
        UNION ALL SELECT 'document_settings'
    ) AS entities
 ) AS seed
LEFT JOIN `permissions` existing_permissions
    ON existing_permissions.`id` = seed.`id`
WHERE existing_permissions.`id` IS NULL;

INSERT INTO `role_permissions` (`roleId`, `permissionId`)
SELECT
    roles.`id`,
    permissions.`id`
FROM `roles` roles
JOIN `permissions` permissions
    ON permissions.`id` IN (
        SELECT
            CONCAT(actions.`action`, '-', entities.`entity`) AS `permissionId`
        FROM (
            SELECT 'read' AS `action`
            UNION ALL SELECT 'create'
            UNION ALL SELECT 'update'
            UNION ALL SELECT 'delete'
        ) AS actions
        CROSS JOIN (
            SELECT 'dashboard' AS `entity`
            UNION ALL SELECT 'enterprise'
            UNION ALL SELECT 'selling_documents'
            UNION ALL SELECT 'buying_documents'
            UNION ALL SELECT 'payments'
            UNION ALL SELECT 'suppliers'
            UNION ALL SELECT 'clients'
            UNION ALL SELECT 'products'
            UNION ALL SELECT 'treasury'
            UNION ALL SELECT 'stock'
            UNION ALL SELECT 'warehouses'
            UNION ALL SELECT 'projects'
            UNION ALL SELECT 'price_lists'
            UNION ALL SELECT 'taxes'
            UNION ALL SELECT 'stock_settings'
            UNION ALL SELECT 'document_settings'
        ) AS entities
    )
LEFT JOIN `role_permissions` existing_role_permissions
    ON existing_role_permissions.`roleId` = roles.`id`
    AND existing_role_permissions.`permissionId` = permissions.`id`
WHERE roles.`label` = 'admin'
  AND existing_role_permissions.`id` IS NULL;

DELETE role_permissions
FROM `role_permissions` role_permissions
JOIN `roles` roles
    ON roles.`id` = role_permissions.`roleId`
WHERE roles.`label` = 'standard-user'
  AND role_permissions.`permissionId` IN (
      SELECT
          CONCAT(actions.`action`, '-', entities.`entity`) AS `permissionId`
      FROM (
          SELECT 'read' AS `action`
          UNION ALL SELECT 'create'
          UNION ALL SELECT 'update'
          UNION ALL SELECT 'delete'
      ) AS actions
      CROSS JOIN (
          SELECT 'dashboard' AS `entity`
          UNION ALL SELECT 'enterprise'
          UNION ALL SELECT 'selling_documents'
          UNION ALL SELECT 'buying_documents'
          UNION ALL SELECT 'payments'
          UNION ALL SELECT 'suppliers'
          UNION ALL SELECT 'clients'
          UNION ALL SELECT 'products'
          UNION ALL SELECT 'treasury'
          UNION ALL SELECT 'stock'
          UNION ALL SELECT 'warehouses'
          UNION ALL SELECT 'projects'
          UNION ALL SELECT 'price_lists'
          UNION ALL SELECT 'taxes'
          UNION ALL SELECT 'stock_settings'
          UNION ALL SELECT 'document_settings'
      ) AS entities
  );

INSERT INTO `role_permissions` (`roleId`, `permissionId`)
SELECT
    roles.`id`,
    permissions.`id`
FROM `roles` roles
JOIN `permissions` permissions
    ON permissions.`id` IN (
        SELECT CONCAT('read', '-', entities.`entity`) AS `permissionId`
        FROM (
            SELECT 'dashboard' AS `entity`
            UNION ALL SELECT 'enterprise'
            UNION ALL SELECT 'selling_documents'
            UNION ALL SELECT 'buying_documents'
            UNION ALL SELECT 'payments'
            UNION ALL SELECT 'suppliers'
            UNION ALL SELECT 'clients'
            UNION ALL SELECT 'products'
            UNION ALL SELECT 'treasury'
            UNION ALL SELECT 'stock'
            UNION ALL SELECT 'warehouses'
            UNION ALL SELECT 'projects'
            UNION ALL SELECT 'price_lists'
            UNION ALL SELECT 'taxes'
            UNION ALL SELECT 'stock_settings'
            UNION ALL SELECT 'document_settings'
        ) AS entities
        UNION ALL
        SELECT CONCAT(actions.`action`, '-', entities.`entity`) AS `permissionId`
        FROM (
            SELECT 'create' AS `action`
            UNION ALL SELECT 'update'
        ) AS actions
        CROSS JOIN (
            SELECT 'selling_documents' AS `entity`
            UNION ALL SELECT 'buying_documents'
            UNION ALL SELECT 'payments'
            UNION ALL SELECT 'suppliers'
            UNION ALL SELECT 'clients'
            UNION ALL SELECT 'products'
            UNION ALL SELECT 'stock'
            UNION ALL SELECT 'warehouses'
            UNION ALL SELECT 'projects'
            UNION ALL SELECT 'price_lists'
        ) AS entities
    )
LEFT JOIN `role_permissions` existing_role_permissions
    ON existing_role_permissions.`roleId` = roles.`id`
    AND existing_role_permissions.`permissionId` = permissions.`id`
WHERE roles.`label` = 'standard-user'
  AND existing_role_permissions.`id` IS NULL;
