import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { DateFormat } from 'src/modules/sequence/enums/date-format.enum';

export class UpdateInvoiceSequenceDto {
  @ApiProperty({ example: 'INV', type: String })
  @IsOptional()
  prefix: string;

  @ApiProperty({ enum: DateFormat })
  @IsOptional()
  dateFormat: DateFormat;

  @ApiProperty({ example: 1, type: String })
  @IsOptional()
  @IsNumber()
  next: number;
}
