import React from 'react';
import { useCurrentPermissions } from './usePermissions';

export const Can = ({
  children,
  fallback = null,
  permission,
  permissions
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  permission?: string;
  permissions?: string[];
}) => {
  const { hasAnyPermission, hasPermission } = useCurrentPermissions();
  const allowed = permissions?.length ? hasAnyPermission(permissions) : hasPermission(permission);

  return <>{allowed ? children : fallback}</>;
};
