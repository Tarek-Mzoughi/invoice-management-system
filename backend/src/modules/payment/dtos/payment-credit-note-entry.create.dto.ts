import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class CreatePaymentCreditNoteEntryDto {
  @ApiProperty({
    example: 1,
    type: Number,
  })
  creditNoteId?: number;

  @ApiProperty({
    example: '150.0',
    type: Number,
  })
  @IsPositive()
  amount?: number;

  @ApiProperty({
    example: 1,
    type: Number,
    required: false,
  })
  digitAfterComma?: number;

  @ApiProperty({
    example: 1,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsInt()
  originalCurrencyId?: number;

  @ApiProperty({
    example: 3.35,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsPositive()
  exchangeRateToPaymentCurrency?: number;

  @ApiProperty({
    example: '502.5',
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsPositive()
  convertedAmount?: number;

  @ApiProperty({
    example: 1,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsInt()
  convertedCurrencyId?: number;
}
