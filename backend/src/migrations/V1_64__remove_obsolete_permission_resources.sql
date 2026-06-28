WITH obsolete_permissions AS (
  SELECT id
  FROM permissions
  WHERE id IN (
    'read-stock',
    'create-stock',
    'update-stock',
    'delete-stock',
    'read-warehouses',
    'create-warehouses',
    'update-warehouses',
    'delete-warehouses',
    'read-projects',
    'create-projects',
    'update-projects',
    'delete-projects',
    'read-stock_settings',
    'create-stock_settings',
    'update-stock_settings',
    'delete-stock_settings'
  )
)
DELETE FROM role_permissions
WHERE "permissionId" IN (SELECT id FROM obsolete_permissions);

WITH obsolete_permissions AS (
  SELECT id
  FROM permissions
  WHERE id IN (
    'read-stock',
    'create-stock',
    'update-stock',
    'delete-stock',
    'read-warehouses',
    'create-warehouses',
    'update-warehouses',
    'delete-warehouses',
    'read-projects',
    'create-projects',
    'update-projects',
    'delete-projects',
    'read-stock_settings',
    'create-stock_settings',
    'update-stock_settings',
    'delete-stock_settings'
  )
)
DELETE FROM user_cabinet_permissions
WHERE "permissionId" IN (SELECT id FROM obsolete_permissions);

DELETE FROM permissions
WHERE id IN (
  'read-stock',
  'create-stock',
  'update-stock',
  'delete-stock',
  'read-warehouses',
  'create-warehouses',
  'update-warehouses',
  'delete-warehouses',
  'read-projects',
  'create-projects',
  'update-projects',
  'delete-projects',
  'read-stock_settings',
  'create-stock_settings',
  'update-stock_settings',
  'delete-stock_settings'
);
