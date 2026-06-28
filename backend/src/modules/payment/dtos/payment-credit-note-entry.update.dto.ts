import { ApiProperty } from '@nestjs/swagger';
import { CreatePaymentCreditNoteEntryDto } from './payment-credit-note-entry.create.dto';

export class UpdatePaymentCreditNoteEntryDto extends CreatePaymentCreditNoteEntryDto {
  @ApiProperty({ example: 1, type: Number })
  id?: number;
}
