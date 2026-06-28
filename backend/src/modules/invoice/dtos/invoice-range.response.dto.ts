import { ApiProperty } from '@nestjs/swagger';
import { ResponseInvoiceDto } from './invoice.response.dto';

export class ResponseInvoiceRangeDto {
  @ApiProperty({ type: ResponseInvoiceDto, nullable: true })
  next: ResponseInvoiceDto | null;

  @ApiProperty({ type: ResponseInvoiceDto, nullable: true })
  previous: ResponseInvoiceDto | null;
}
