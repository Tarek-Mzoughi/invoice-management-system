import { ApiProperty } from '@nestjs/swagger';
import { ResponseCreditNoteDto } from 'src/modules/credit-note/dtos/credit-note.response.dto';
import { ResponseCurrencyDto } from 'src/modules/currency/dtos/currency.response.dto';

export class ResponsePaymentCreditNoteEntryDto {
  @ApiProperty({ example: 1, type: Number })
  id: number;

  @ApiProperty({
    example: 1,
    type: Number,
  })
  paymentId?: number;

  @ApiProperty({
    example: 1,
    type: Number,
  })
  creditNoteId?: number;

  @ApiProperty({
    example: '150.0',
    type: Number,
  })
  amount?: number;

  @ApiProperty({ required: false, type: () => ResponseCreditNoteDto })
  creditNote?: ResponseCreditNoteDto;

  @ApiProperty({ required: false, example: 1, type: Number })
  originalCurrencyId?: number;

  @ApiProperty({ required: false, type: () => ResponseCurrencyDto })
  originalCurrency?: ResponseCurrencyDto;

  @ApiProperty({ required: false, example: 3.35, type: Number })
  exchangeRateToPaymentCurrency?: number;

  @ApiProperty({ required: false, example: '502.5', type: Number })
  convertedAmount?: number;

  @ApiProperty({ required: false, example: 1, type: Number })
  convertedCurrencyId?: number;

  @ApiProperty({ required: false, type: () => ResponseCurrencyDto })
  convertedCurrency?: ResponseCurrencyDto;
}
