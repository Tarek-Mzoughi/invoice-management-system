import { ApiProperty } from '@nestjs/swagger';
import { ResponseDtoHelper } from 'src/shared/database/dtos/database.response.dto';
import { ResponseRolePermissionDto } from '../role-permission/response-role-permission.dto';
import { ResponseUserDto } from '../user/response-user.dto';
import { Expose, Transform, Type } from 'class-transformer';
import { isSystemRoleLabel } from '../../rbac/rbac.utils';

export class ResponseRoleDto extends ResponseDtoHelper {
  @ApiProperty({ type: String })
  @Expose()
  id: string;

  @ApiProperty({ type: String })
  @Expose()
  label: string;

  @ApiProperty({ type: String })
  @Expose()
  description?: string;

  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  cabinetId?: number | null;

  @ApiProperty({ type: Boolean })
  @Expose()
  @Transform(({ obj }) => !obj.cabinetId && isSystemRoleLabel(obj.label))
  isSystemRole?: boolean;

  @ApiProperty({ type: () => [ResponseRolePermissionDto] })
  @Expose()
  @Type(() => ResponseRolePermissionDto)
  permissions?: ResponseRolePermissionDto[];

  @ApiProperty({ type: () => [ResponseUserDto] })
  @Expose()
  @Type(() => ResponseUserDto)
  users?: ResponseUserDto[];
}
