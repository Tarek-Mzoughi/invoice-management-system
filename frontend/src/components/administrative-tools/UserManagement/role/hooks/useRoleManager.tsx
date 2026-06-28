import { Role } from '@/types';
import { Permission } from '@/types/permission';
import {
  resolvePermissionSelection as resolveRbacPermissionSelection,
  type ResolvePermissionSelectionResult
} from '@/features/rbac/permissionDependencies';
import { create } from 'zustand';

interface RoleManagerData {
  id?: string;
  label?: string;
  description?: string;
  permissions?: Permission[];
}

interface RoleManager extends RoleManagerData {
  set: (name: keyof RoleManagerData, value: any) => void;
  reset: () => void;
  getRole: () => Partial<Role>;
  setRole: (data: Partial<Role>) => void;
  setPermissions: (permissions?: Permission[]) => void;
  resolvePermissionSelection: (params: {
    permissionId?: string;
    checked: boolean;
    availablePermissions?: Permission[];
  }) => ResolvePermissionSelectionResult;
  addPermission: (permission: Permission) => void;
  removePermission: (index?: string) => void;
  isPermissionSelected: (permissionId?: string) => boolean;
}

const initialState: RoleManagerData = {
  id: undefined,
  label: '',
  description: '',
  permissions: []
};

export const useRoleManager = create<RoleManager>((set, get) => ({
  ...initialState,

  set: (name: keyof RoleManagerData, value: any) => {
    set((state) => ({
      ...state,
      [name]: value
    }));
  },

  reset: () => {
    set({ ...initialState });
  },

  getRole: () => {
    const data = get();
    return {
      id: data.id,
      label: data.label,
      description: data.description,
      permissions: data.permissions
    };
  },

  setRole: (data: Partial<Role>) => {
    set((state) => ({
      ...state,
      id: data.id,
      label: data.label,
      description: data.description,
      permissions: data?.permissions?.map((entry) => entry.permission || ({} as Permission))
    }));
  },
  setPermissions: (permissions?: Permission[]) => {
    set((state) => ({
      ...state,
      permissions: permissions || []
    }));
  },
  resolvePermissionSelection: ({ permissionId, checked, availablePermissions = [] }) => {
    const currentPermissions = get().permissions || [];
    const currentPermissionIds = currentPermissions
      .map((permission) => permission.id)
      .filter((id): id is string => Boolean(id));

    if (!permissionId) {
      return {
        nextPermissions: currentPermissionIds,
        autoAddedRequiredPermissions: [],
        blockedRemovedPermissions: [],
        suggestedOptionalPermissions: [],
        warnings: []
      };
    }

    const result = resolveRbacPermissionSelection({
      selectedPermissions: currentPermissionIds,
      toggledPermission: permissionId,
      checked
    });

    if (result.blockedRemovedPermissions.length > 0) return result;

    const permissionsById = new Map<string, Permission>();
    [...availablePermissions, ...currentPermissions].forEach((permission) => {
      if (permission.id) permissionsById.set(permission.id, permission);
    });

    set((state) => ({
      ...state,
      permissions: result.nextPermissions
        .map((nextPermissionId) => permissionsById.get(nextPermissionId))
        .filter((permission): permission is Permission => Boolean(permission))
    }));

    return result;
  },
  addPermission: (permission: Permission) => {
    const { permissions } = get();
    if (!permissions?.some((p) => p.id === permission.id)) {
      set((state) => ({
        ...state,
        permissions: [...(permissions || []), permission]
      }));
    }
  },

  removePermission: (permissionId?: string) => {
    set((state) => ({
      ...state,
      permissions: state?.permissions?.filter((p) => p.id !== permissionId)
    }));
  },

  isPermissionSelected: (permissionId?: string) => {
    const { permissions } = get();
    return permissions?.some((p) => p.id === permissionId) || false;
  }
}));
