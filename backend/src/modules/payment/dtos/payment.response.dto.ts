import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { PAYMENT_MODE } from '../enums/payment-mode.enum';
import { ResponsePaymentUploadDto } from './payment-upload.response.dto';
import { ResponsePaymentInvoiceEntryDto } from './payment-invoice-entry.response.dto';
import { PAYMENT_COLLECTION_STATUS } from '../enums/payment-collection-status.enum';
import { ResponseCurrencyDto } from 'src/modules/currency/dtos/currency.response.dto';
import { ResponseFirmDto } from 'src/modules/firm/dtos/firm.response.dto';
import { ResponseBankAccountDto } from 'src/modules/bank-account/dtos/bank-account.response.dto';
import { ResponseTaxWithholdingDto } from 'src/modules/tax-withholding/dtos/tax-withholding.response.dto';
import { ResponsePaymentCreditNoteEntryDto } from './payment-credit-note-entry.response.dto';

export class ResponsePaymentDto {
  @ApiProperty({ example: 1, type: Number })
  id?: number;

  @ApiProperty({
    example: ACTIVITY_TYPE.SELLING,
    enum: ACTIVITY_TYPE,
  })
  activityType?: ACTIVITY_TYPE;

  @ApiProperty({ required: false, example: 1, type: Number })
  cabinetId?: number;

  @ApiProperty({
    example: '150.0',
    type: Number,
  })
  amount?: number;

  @ApiProperty({
    example: '15.0',
    type: Number,
  })
  fee?: number;

  @ApiProperty({
    example: '150.0',
    type: Number,
  })
  convertionRate?: number;

  @ApiProperty({ example: faker.date.anytime(), type: Date })
  date?: Date;

  @ApiProperty({
    example: PAYMENT_MODE.Cash,
    enum: PAYMENT_MODE,
  })
  mode?: PAYMENT_MODE;

  @ApiProperty({
    example: faker.hacker.phrase(),
    type: String,
  })
  notes?: string;

  @ApiProperty({
    example: faker.finance.transactionType(),
    type: String,
    required: false,
  })
  reference?: string;

  @ApiProperty({ example: faker.date.future(), type: Date, required: false })
  dueDate?: Date;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  currencyId?: number;

  @ApiProperty({ required: false, type: () => ResponseCurrencyDto })
  currency?: ResponseCurrencyDto;

  @ApiProperty({ required: false, example: 1, type: Number })
  firmId?: number;

  @ApiProperty({ required: false, type: () => ResponseFirmDto })
  firm?: ResponseFirmDto;

  @ApiProperty({ required: false, example: 1, type: Number })
  treasuryAccountId?: number;

  @ApiProperty({ required: false, type: () => ResponseBankAccountDto })
  treasuryAccount?: ResponseBankAccountDto;

  @ApiProperty({ required: false, example: 1, type: Number })
  originTreasuryAccountId?: number;

  @ApiProperty({ required: false, type: () => ResponseBankAccountDto })
  originTreasuryAccount?: ResponseBankAccountDto;

  @ApiProperty({
    required: false,
    enum: PAYMENT_COLLECTION_STATUS,
    example: PAYMENT_COLLECTION_STATUS.PENDING,
  })
  collectionStatus?: PAYMENT_COLLECTION_STATUS;

  @ApiProperty({ required: false, example: faker.date.recent(), type: Date })
  depositedAt?: Date;

  @ApiProperty({ required: false, example: faker.date.recent(), type: Date })
  paidAt?: Date;

  @ApiProperty({ required: false, example: faker.date.recent(), type: Date })
  rejectedAt?: Date;

  @ApiProperty({
    required: false,
    example: faker.lorem.sentence(),
    type: String,
  })
  rejectionReason?: string;

  @ApiProperty({ required: false, example: 1, type: Number })
  encashmentMovementId?: number;

  @ApiProperty({ required: false, example: 1, type: Number })
  taxWithholdingId?: number;

  @ApiProperty({ required: false, type: () => ResponseTaxWithholdingDto })
  taxWithholding?: ResponseTaxWithholdingDto;

  @ApiProperty({ required: false, example: faker.date.recent(), type: Date })
  taxWithholdingDate?: Date;

  @ApiProperty({ required: false, example: '15.0', type: Number })
  taxWithholdingAmount?: number;

  @ApiProperty({ required: false })
  uploads?: ResponsePaymentUploadDto[];

  @ApiProperty({ required: false })
  invoices?: ResponsePaymentInvoiceEntryDto[];

  @ApiProperty({ required: false })
  creditNotes?: ResponsePaymentCreditNoteEntryDto[];
}
