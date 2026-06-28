import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsDateString,
  IsEmail,
  IsOptional,
  IsArray,
  IsString,
  Length,
  MinLength,
  IsEnum,
} from 'class-validator';
import { CreateProfileDto } from 'src/modules/user-management/dtos/profile/create-profile.dto';
import { CabinetUserRoleType } from '../../rbac/permission.constants';

export class CreateUserDto {
  @ApiProperty({ type: String })
  @IsString()
  @Length(3, 50)
  @IsOptional()
  firstName?: string;

  @ApiProperty({ type: String })
  @IsString()
  @Length(3, 50)
  @IsOptional()
  lastName?: string;

  @ApiProperty({ type: Date })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiProperty({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiProperty({ type: String, required: false })
  @IsString()
  @Length(3, 50)
  @IsOptional()
  username?: string;

  @ApiProperty({ type: String })
  @IsEmail()
  email: string;

  @ApiProperty({ type: String })
  @IsOptional()
  roleId?: string;

  @ApiProperty({ enum: CabinetUserRoleType, required: false })
  @IsOptional()
  @IsEnum(CabinetUserRoleType)
  roleType?: CabinetUserRoleType;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  cabinetIds?: number[];

  @ApiProperty({ type: CreateProfileDto })
  @IsOptional()
  profile?: CreateProfileDto;

  @ApiProperty({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}
