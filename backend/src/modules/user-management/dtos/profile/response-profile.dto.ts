import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../../enums/gender.enum';
import { Expose, Type } from 'class-transformer';
import { ResponseUserDto } from 'src/modules/user-management/dtos/user/response-user.dto';
import { ResponseStorageDto } from 'src/shared/storage/dtos/response-storage.dto';

export class ResponseProfileDto {
  @ApiProperty({ type: Number })
  @Expose()
  id: number;

  @ApiProperty({ type: String })
  @Expose()
  phone?: string;

  @ApiProperty({ type: String })
  @Expose()
  cin?: string;

  @ApiProperty({ type: String })
  @Expose()
  bio?: string;

  @ApiProperty({ type: String, enum: Gender, example: Gender.Male })
  @Expose()
  gender?: Gender;

  @ApiProperty({ type: Boolean, example: false })
  @Expose()
  isPrivate?: boolean;

  @ApiProperty({ type: Number })
  @Expose()
  pictureId?: number;

  @ApiProperty({ type: ResponseStorageDto })
  @Expose()
  @Type(() => ResponseStorageDto)
  picture?: ResponseStorageDto;

  @ApiProperty({ type: () => ResponseUserDto })
  @Expose()
  @Type(() => ResponseUserDto)
  user: ResponseUserDto;
}
