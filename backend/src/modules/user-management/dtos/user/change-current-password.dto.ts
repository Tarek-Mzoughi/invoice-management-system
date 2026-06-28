import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class ChangeCurrentPasswordDto {
  @ApiProperty({ type: String })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1, {
    message: 'settings.profile.validation.current_password_required',
  })
  currentPassword: string;

  @ApiProperty({ type: String })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(8, {
    message: 'settings.profile.validation.new_password_min_length',
  })
  newPassword: string;
}
