import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { DateFormat } from 'src/modules/sequence/enums/date-format.enum';

export class UpdateQuotationSequenceDto {
  @ApiProperty({ example: 'EST', type: String })
  @IsOptional()
  prefix: string;

  @ApiProperty({ enum: DateFormat })
  @IsOptional()
  dynamic_sequence: DateFormat;

  @ApiProperty({ example: 'EST', type: String })
  @IsOptional()
  @IsNumber()
  next: number;
}
