import { useCurrentUser } from '@/hooks/content/user/useCurrentUser';
import { hasAnyPermission, hasPermission } from './permissions';

/**
 * Hook providing the current user's permission state with a clean separation:
 *
 * - `permissions` / `hasPermission` / `hasAnyPermission`:
 *   Based on RAW stored permissions (what the admin explicitly granted).
 *   Use for **UI visibility** — sidebar items, module access, showing/hiding sections.
 *
 * - `effectivePermissions` / `hasEffectivePermission`:
 *   Based on EXPANDED permissions (includes functional dependencies).
 *   Use for **actions and functional checks**. Read permissions stay a frontend
 *   visibility switch and are checked from the raw stored permissions.
 */
export const useCurrentPermissions = () => {
  const { user, isFetchUserPending } = useCurrentUser();

  // RAW permissions — only what was explicitly assigned (for UI visibility)
  const permissions = user?.permissions || user?.effectivePermissions || [];

  // EFFECTIVE permissions — expanded with functional dependencies (for route access)
  const effectivePermissions = user?.effectivePermissions || permissions;
  const normalizedRoleLabel = (user?.role?.label || '').trim().toLowerCase();
  const isAdmin =
    user?.roleType === 'ADMIN' ||
    user?.isCabinetPrincipalAdmin === true ||
    ['admin', 'owner', 'proprietaire', 'propriétaire'].includes(normalizedRoleLabel);

  return {
    user,
    isAdmin,
    isPending: isFetchUserPending,

    // UI visibility (raw stored permissions)
    permissions,
    hasPermission: (permissionId?: string) => hasPermission(permissions, permissionId),
    hasAnyPermission: (perms: string[]) => hasAnyPermission(permissions, perms),

    // Route / functional authorization (expanded permissions)
    effectivePermissions,
    hasEffectivePermission: (permissionId?: string) =>
      hasPermission(effectivePermissions, permissionId),
  };
};
