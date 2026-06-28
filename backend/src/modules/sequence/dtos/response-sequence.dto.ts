import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ResponseDtoHelper } from 'src/shared/database/dtos/database.response.dto';
import { DateFormat } from '../enums/date-format.enum';

export class ResponseSequenceDto extends ResponseDtoHelper {
  @ApiProperty({ type: Number })
  @Expose()
  id: string;

  @ApiProperty({ type: String })
  @Expose()
  label: string;

  @ApiProperty({ type: String })
  @Expose()
  prefix?: string;

  @ApiProperty({ type: String, enum: DateFormat })
  @Expose()
  dateFormat?: DateFormat;

  @ApiProperty({ type: Number })
  @Expose()
  next: number;
}
