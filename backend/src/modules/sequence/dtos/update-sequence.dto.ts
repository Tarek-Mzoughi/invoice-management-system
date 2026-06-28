import { ApiProperty } from '@nestjs/swagger';
import { DateFormat } from '../enums/date-format.enum';
import {
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateSequenceDto {
  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(3)
  prefix?: string;

  @ApiProperty({ type: String, enum: DateFormat })
  @IsEnum(DateFormat)
  dateFormat?: DateFormat;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsPositive()
  next: number;
}
