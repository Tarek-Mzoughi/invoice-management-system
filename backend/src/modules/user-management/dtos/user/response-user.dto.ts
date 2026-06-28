import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ResponseDtoHelper } from 'src/shared/database/dtos/database.response.dto';
import { ResponseRoleDto } from '../role/response-role.dto';
import { ResponseProfileDto } from '../profile/response-profile.dto';
import { ResponseCabinetDto } from 'src/modules/cabinet/dtos/cabinet.response.dto';
import {
  ALL_PERMISSION_IDS,
  CabinetUserRoleType,
} from '../../rbac/permission.constants';
import {
  getEffectivePermissionIds,
  getRolePermissionIds,
  getStoredPermissionIds,
  isAdminRole,
} from '../../rbac/rbac.utils';

const resolveCurrentCabinet = (obj: {
  currentCabinet?: ResponseCabinetDto;
  cabinetMemberships?: any[];
  cabinets?: ResponseCabinetDto[];
}): ResponseCabinetDto | null =>
  obj.currentCabinet ??
  obj.cabinetMemberships?.[0]?.cabinet ??
  obj.cabinets?.[0] ??
  null;

export class ResponseUserDto extends ResponseDtoHelper {
  @ApiProperty({ type: String })
  @Expose()
  id: string;

  @ApiProperty({ type: String })
  @Expose()
  firstName?: string;

  @ApiProperty({ type: String })
  @Expose()
  lastName?: string;

  @ApiProperty({ type: Date })
  @Expose()
  dateOfBirth?: Date;

  @ApiProperty({ type: Boolean, default: false })
  @Expose()
  isActive?: boolean;

  @ApiProperty({ type: Boolean, default: false })
  @Expose()
  isApproved?: boolean;

  @Exclude()
  password?: string;

  @ApiProperty({ type: String })
  @Expose()
  username: string;

  @ApiProperty({ type: String })
  @Expose()
  email: string;

  @ApiProperty({ type: Date, default: false })
  @Expose()
  emailVerified?: Date;

  @ApiProperty({ type: Boolean, default: false })
  @Expose()
  @Transform(({ obj }) => Boolean(obj.mustChangePassword))
  mustChangePassword?: boolean;

  @ApiProperty({ type: () => ResponseRoleDto })
  @Expose()
  @Type(() => ResponseRoleDto)
  role: ResponseRoleDto;

  @ApiProperty({ type: String })
  @Expose()
  roleId: string;

  @ApiProperty({ type: () => ResponseProfileDto })
  @Expose()
  @Type(() => ResponseProfileDto)
  profile?: ResponseProfileDto;

  @ApiProperty({ type: Number })
  @Expose()
  profileId: number;

  @ApiProperty({ type: () => [ResponseCabinetDto], nullable: true })
  @Expose()
  @Type(() => ResponseCabinetDto)
  @Transform(
    ({ value, obj }) =>
      value ??
      (obj.cabinetMemberships?.map((m) => m.cabinet).filter(Boolean) || []),
  )
  cabinets?: ResponseCabinetDto[];

  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  @Transform(({ value, obj }) => value ?? (obj.cabinetMemberships?.length || 0))
  cabinetCount?: number;

  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  @Transform(
    ({ obj }) => obj.currentCabinetId ?? resolveCurrentCabinet(obj)?.id ?? null,
  )
  currentCabinetId?: number | null;

  @ApiProperty({ type: () => ResponseCabinetDto, nullable: true })
  @Expose()
  @Type(() => ResponseCabinetDto)
  @Transform(({ obj }) => resolveCurrentCabinet(obj))
  currentCabinet?: ResponseCabinetDto | null;

  @ApiProperty({ type: Boolean })
  @Expose()
  @Transform(({ obj }) => {
    const currentCabinet = resolveCurrentCabinet(obj);
    return !currentCabinet || currentCabinet.onboardingCompleted !== true;
  })
  onboardingRequired?: boolean;

  @ApiProperty({ enum: CabinetUserRoleType, nullable: true })
  @Expose()
  @Transform(({ obj }) => obj.roleType ?? null)
  roleType?: CabinetUserRoleType | null;

  @ApiProperty({
    type: [String],
    description: 'Raw stored permissions (for UI visibility)',
  })
  @Expose()
  @Transform(
    ({ obj }) =>
      obj.permissions ||
      getStoredPermissionIds(obj) ||
      (isAdminRole(obj.role)
        ? ALL_PERMISSION_IDS
        : getRolePermissionIds(obj.role)),
  )
  permissions?: string[];

  @ApiProperty({
    type: [String],
    description:
      'Effective permissions with expanded dependencies (for functional access)',
  })
  @Expose()
  @Transform(
    ({ obj }) =>
      obj.effectivePermissions ||
      getEffectivePermissionIds(obj) ||
      (isAdminRole(obj.role)
        ? ALL_PERMISSION_IDS
        : getRolePermissionIds(obj.role)),
  )
  effectivePermissions?: string[];

  @ApiProperty({ type: Boolean })
  @Expose()
  @Transform(({ obj }) => Boolean(obj.isCabinetPrincipalAdmin))
  isCabinetPrincipalAdmin?: boolean;
}
