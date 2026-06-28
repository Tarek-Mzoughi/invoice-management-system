import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

export interface RequiredPermissionMetadata {
  permissions: string[];
  message?: string;
  mode: 'all' | 'any' | 'admin';
}

export const RequirePermissions = (
  permissions: string | string[],
  message?: string,
) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, {
    permissions: Array.isArray(permissions) ? permissions : [permissions],
    message,
    mode: 'all',
  } satisfies RequiredPermissionMetadata);

export const RequireAnyPermissions = (
  permissions: string[],
  message?: string,
) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, {
    permissions,
    message,
    mode: 'any',
  } satisfies RequiredPermissionMetadata);

export const RequireAdminRole = (
  message = "Vous n'avez pas l'autorisation d'accéder aux outils administratifs.",
) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, {
    permissions: [],
    message,
    mode: 'admin',
  } satisfies RequiredPermissionMetadata);
