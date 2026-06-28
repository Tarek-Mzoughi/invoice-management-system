import { DatabaseEntity } from './response/DatabaseEntity';
import { Role } from './role';
import { Upload } from './upload';
import { Cabinet } from './cabinet';

export type CabinetUserRoleType = 'ADMIN' | 'COLLABORATOR' | 'CUSTOM';

export enum Gender {
  Male = 'Male',
  Female = 'Female'
}

export interface UserProfile extends DatabaseEntity {
  id?: number;
  phone?: string;
  cin?: string;
  bio?: string;
  gender?: Gender;
  isPrivate?: boolean;
  regionId?: number;
  pictureId?: number;
  picture?: Upload;
}

//abstract user dtos *****************************************************************************

export interface ResponseAbstractUserDto extends DatabaseEntity {
  id: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  isActive?: boolean;
  isApproved?: boolean;
  username: string;
  email: string;
  emailVerified?: Date;
  // role: ResponseRoleDto;
  // roleId: string;
}

export interface CreateAbstractUserDto {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  isActive?: boolean;
  isApproved?: boolean;
  password?: string;
  username?: string;
  email: string;
  roleId?: string;
  roleType?: CabinetUserRoleType;
  permissionIds?: string[];
  cabinetIds?: number[];
  profile?: Partial<UserProfile>;
}

export interface UpdateAbstractUserDto extends Partial<CreateAbstractUserDto> { }

export interface UpdateCurrentProfileDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  dateOfBirth?: Date | string;
  profile?: Partial<UserProfile>;
}

export interface ChangeCurrentPasswordDto {
  currentPassword: string;
  newPassword: string;
}

//***********************************************************************************************

export interface UserPreferences {
  font?: string;
  theme?: string;
}

export interface ResponseUserDto {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;
  role?: Role;
  roleId?: string;
  roleType?: CabinetUserRoleType | null;
  profile?: UserProfile;
  cabinets?: Cabinet[];
  cabinetCount?: number;
  currentCabinetId?: number | null;
  currentCabinet?: Cabinet | null;
  onboardingRequired?: boolean;
  /** Raw stored permissions — used for UI visibility (sidebar, module access) */
  permissions?: string[];
  /** Expanded effective permissions — used for functional access (route authorization) */
  effectivePermissions?: string[];
  isCabinetPrincipalAdmin?: boolean;
  picture?: Upload;
  pictureId?: number;
  isActive?: boolean;
  isApproved?: boolean;
  emailVerified?: Date | string | null;
  mustChangePassword?: boolean;
}
