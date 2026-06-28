WITH obsolete_permissions AS (
  SELECT id
  FROM permissions
  WHERE id IN (
    'read-user_management',
    'create-user_management',
    'update-user_management',
    'delete-user_management'
  )
)
DELETE FROM role_permissions
WHERE "permissionId" IN (SELECT id FROM obsolete_permissions);

WITH obsolete_permissions AS (
  SELECT id
  FROM permissions
  WHERE id IN (
    'read-user_management',
    'create-user_management',
    'update-user_management',
    'delete-user_management'
  )
)
DELETE FROM user_cabinet_permissions
WHERE "permissionId" IN (SELECT id FROM obsolete_permissions);

DELETE FROM permissions
WHERE id IN (
  'read-user_management',
  'create-user_management',
  'update-user_management',
  'delete-user_management'
);
