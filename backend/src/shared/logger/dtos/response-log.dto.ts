import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ResponseDtoHelper } from 'src/shared/database/dtos/database.response.dto';
import { ResponseUserDto } from 'src/modules/user-management/dtos/user/response-user.dto';
import { EVENT_TYPE } from '../enums/event-type.enum';

export class ResponseLogDto extends ResponseDtoHelper {
  @ApiProperty({ type: Number, example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ type: String, enum: EVENT_TYPE })
  @Expose()
  event: EVENT_TYPE;

  @ApiProperty({ type: String, example: '/api/v1/user/list' })
  @Expose()
  api?: string;

  @ApiProperty({ type: String, example: 'GET' })
  @Expose()
  method?: string;

  @ApiProperty({ type: String, example: '1' })
  @Expose()
  userId?: string;

  @ApiProperty({ type: ResponseUserDto })
  @Expose()
  @Type(() => ResponseUserDto)
  user: ResponseUserDto;

  @ApiProperty({ type: Object })
  @Expose()
  logInfo?: unknown;
}
