import { Permission } from './permission';
import { DatabaseEntity } from './response/DatabaseEntity';

export interface Role extends DatabaseEntity {
  id?: string;
  label?: string;
  description?: string;
  cabinetId?: number | null;
  isSystemRole?: boolean;
  permissions?: RolePermissionEntry[];
}

export interface CreateRoleDto {
  label?: string;
  description?: string;
  cabinetId?: number | null;
  permissions?: { id?: number; permissionId?: string }[];
}

export interface UpdateRoleDto extends CreateRoleDto {}

export interface RolePermissionEntry extends DatabaseEntity {
  role?: Role;
  roleId?: string;
  permission?: Permission;
  permissionId?: string;
}
