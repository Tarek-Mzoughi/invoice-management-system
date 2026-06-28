import { RoleEntity } from '../entities/role.entity';
import { UserEntity } from '../entities/user.entity';
import {
  ADMIN_ROLE_LABELS,
  ALL_PERMISSION_IDS,
  CabinetUserRoleType,
  COLLABORATOR_ROLE_LABELS,
  COLLABORATOR_DEFAULT_PERMISSION_IDS,
  OFFICIAL_PERMISSION_IDS,
  PERMISSION_DEPENDENCIES,
  SYSTEM_ROLE_LABELS,
} from './permission.constants';
import { UserCabinetEntity } from '../entities/user-cabinet.entity';

export const normalizeRoleLabel = (label?: string | null) =>
  (label || '').trim().toLowerCase();

export const isAdminRoleLabel = (label?: string | null) =>
  ADMIN_ROLE_LABELS.includes(
    normalizeRoleLabel(label) as (typeof ADMIN_ROLE_LABELS)[number],
  );

export const isCollaboratorRoleLabel = (label?: string | null) =>
  COLLABORATOR_ROLE_LABELS.includes(
    normalizeRoleLabel(label) as (typeof COLLABORATOR_ROLE_LABELS)[number],
  );

export const isSystemRoleLabel = (label?: string | null) =>
  SYSTEM_ROLE_LABELS.includes(
    normalizeRoleLabel(label) as (typeof SYSTEM_ROLE_LABELS)[number],
  );

export const isAdminRole = (role?: RoleEntity | null) =>
  isAdminRoleLabel(role?.label);

export const isCustomRole = (role?: RoleEntity | null) =>
  Boolean(role?.id && !isSystemRoleLabel(role.label));

export const isAdminRoleType = (roleType?: string | null) =>
  roleType === CabinetUserRoleType.ADMIN;

export const isCollaboratorRoleType = (roleType?: string | null) =>
  roleType === CabinetUserRoleType.COLLABORATOR;

export const isCustomRoleType = (roleType?: string | null) =>
  roleType === CabinetUserRoleType.CUSTOM;

export const getActiveCabinetMemberships = (user?: UserEntity | null) =>
  (user?.cabinetMemberships || []).filter(
    (membership) => membership.isActive !== false,
  );

export const resolveCabinetMembership = (
  user?: UserEntity | null,
  cabinetId?: number | null,
): UserCabinetEntity | undefined => {
  const memberships = getActiveCabinetMemberships(user);
  if (cabinetId) {
    return memberships.find(
      (membership) => Number(membership.cabinetId) === Number(cabinetId),
    );
  }

  return memberships[0];
};

export const getRolePermissionIds = (role?: RoleEntity | null): string[] => {
  if (!role) return [];
  if (isAdminRole(role)) return [...ALL_PERMISSION_IDS];

  return Array.from(
    new Set(
      (role.permissions || [])
        .map((rolePermission) => rolePermission.permissionId)
        .filter(Boolean),
    ),
  );
};

/**
 * Returns the RAW permissions stored in the database for a membership.
 * No dynamic expansion is applied. Used for UI visibility decisions.
 */
export const getStoredMembershipPermissionIds = (
  membership?: UserCabinetEntity | null,
): string[] => {
  if (!membership) return [];
  if (membership.roleType === CabinetUserRoleType.ADMIN) {
    return [...ALL_PERMISSION_IDS];
  }
  if (membership.roleType === CabinetUserRoleType.COLLABORATOR) {
    return [...COLLABORATOR_DEFAULT_PERMISSION_IDS];
  }

  return Array.from(
    new Set(
      (membership.permissions || [])
        .map((permission) => permission.permissionId)
        .filter(Boolean),
    ),
  );
};

/**
 * Returns the EFFECTIVE permissions for a membership (with dynamic expansion).
 * Includes all functional dependencies needed for granted features to work.
 * Used for backend authorization checks (guards).
 */
export const getMembershipPermissionIds = (
  membership?: UserCabinetEntity | null,
): string[] => {
  const storedIds = getStoredMembershipPermissionIds(membership);
  if (
    !membership ||
    membership.roleType === CabinetUserRoleType.ADMIN ||
    membership.roleType === CabinetUserRoleType.COLLABORATOR
  ) {
    return storedIds;
  }

  return expandPermissionDependencies(storedIds);
};

/**
 * Returns the RAW stored permissions for the user in the given cabinet.
 * No dynamic expansion. Used for frontend UI visibility (sidebar, module access).
 */
export const getStoredPermissionIds = (
  user?: UserEntity | null,
  cabinetId?: number | null,
): string[] => {
  const membership = resolveCabinetMembership(user, cabinetId);
  if (membership) {
    return getStoredMembershipPermissionIds(membership);
  }

  return getRolePermissionIds(user?.role);
};

/**
 * Returns the EFFECTIVE permissions (with dynamic expansion of dependencies).
 * Used for backend authorization checks (guards, services).
 */
export const getEffectivePermissionIds = (
  user?: UserEntity | null,
  cabinetId?: number | null,
) => {
  const membership = resolveCabinetMembership(user, cabinetId);
  if (membership) {
    return getMembershipPermissionIds(membership);
  }

  return getRolePermissionIds(user?.role);
};

export const hasPermission = (
  user: UserEntity | null | undefined,
  permissionId: string,
  cabinetId?: number | null,
) =>
  getEffectivePermissionIds(user, cabinetId).includes(permissionId) ||
  (!resolveCabinetMembership(user, cabinetId) && isAdminRole(user?.role));

/**
 * Dynamically expands a set of permission IDs by adding all functional
 * dependencies defined in PERMISSION_DEPENDENCIES.
 *
 * This is the core function that separates "functional access" from
 * "UI visibility". The expansion is purely in-memory — nothing is persisted.
 *
 * @alias computeEffectivePermissions
 */
export const expandPermissionDependencies = (
  permissionIds: string[],
): string[] => {
  const result = new Set(permissionIds);
  const queue = [...permissionIds];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const dependencies = PERMISSION_DEPENDENCIES[currentId] || [];

    for (const depId of dependencies) {
      if (!result.has(depId)) {
        result.add(depId);
        queue.push(depId);
      }
    }
  }

  return Array.from(result);
};

/** @see expandPermissionDependencies */
export const computeEffectivePermissions = expandPermissionDependencies;

export const normalizePermissionSelection = (permissionIds: string[]) => {
  return Array.from(
    new Set(
      permissionIds.filter((permissionId) =>
        OFFICIAL_PERMISSION_IDS.has(permissionId),
      ),
    ),
  );
};
