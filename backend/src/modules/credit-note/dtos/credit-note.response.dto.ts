import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { CREDIT_NOTE_STATUS } from '../enums/credit-note-status.enum';
import { DISCOUNT_TYPES } from 'src/app/enums/discount-types.enum';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { ResponseCurrencyDto } from 'src/modules/currency/dtos/currency.response.dto';
import { ResponseBankAccountDto } from 'src/modules/bank-account/dtos/bank-account.response.dto';
import { ResponseFirmDto } from 'src/modules/firm/dtos/firm.response.dto';
import { ResponseInterlocutorDto } from 'src/modules/interlocutor/dtos/interlocutor.response.dto';
import { ResponseCabinetDto } from 'src/modules/cabinet/dtos/cabinet.response.dto';
import { ResponseArticleCreditNoteEntryDto } from './article-credit-note-entry.response.dto';
import { ResponseCreditNoteMetaDataDto } from './credit-note-meta-data.response.dto';
import { ResponseCreditNoteUploadDto } from './credit-note-upload.response.dto';

class ResponseCreditNoteLinkedDocumentDto {
  @ApiProperty({ example: 1, type: Number })
  id: number;

  @ApiProperty({
    example: faker.finance.transactionDescription(),
    type: String,
  })
  sequential?: string;

  @ApiProperty({ example: 'FAC-FOURN-2026-001', type: String, required: false })
  reference?: string;

  @ApiProperty({ example: faker.date.anytime(), type: Date, required: false })
  date?: Date;

  @ApiProperty({ example: CREDIT_NOTE_STATUS.Draft, required: false })
  status?: string;
}

export class ResponseCreditNoteDto {
  @ApiProperty({ example: 1, type: Number })
  id: number;

  @ApiProperty({
    example: ACTIVITY_TYPE.SELLING,
    enum: ACTIVITY_TYPE,
  })
  activityType: ACTIVITY_TYPE;

  @ApiProperty({
    example: faker.finance.transactionDescription(),
    type: String,
  })
  sequential: string;

  @ApiProperty({
    example: '1',
    type: Number,
    required: false,
  })
  sourceInvoiceId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
    required: false,
  })
  sourceReturnNoteId?: number;

  @ApiProperty({
    example: 'FAC-FOURN-2026-001',
    type: String,
    required: false,
  })
  reference?: string;

  @ApiProperty({ example: faker.date.anytime(), type: Date })
  date?: Date;

  @ApiProperty({ example: faker.date.anytime(), type: Date })
  dueDate?: Date;

  @ApiProperty({
    example: faker.finance.transactionDescription(),
    type: String,
  })
  object?: string;

  @ApiProperty({
    example: faker.hacker.phrase(),
    type: String,
  })
  generalConditions?: string;

  @ApiProperty({
    example: CREDIT_NOTE_STATUS.Unpaid,
    enum: CREDIT_NOTE_STATUS,
  })
  status?: CREDIT_NOTE_STATUS;

  @ApiProperty({
    example: '0.1',
    type: Number,
  })
  discount?: number;

  @ApiProperty({ example: DISCOUNT_TYPES.PERCENTAGE, enum: DISCOUNT_TYPES })
  discount_type: DISCOUNT_TYPES;

  @ApiProperty({
    example: '125.35',
    type: Number,
  })
  subTotal?: number;

  @ApiProperty({
    example: '150.0',
    type: Number,
  })
  total?: number;

  @ApiProperty({
    example: '120.0',
    type: Number,
  })
  amountPaid: number;

  @ApiProperty({ type: () => ResponseCurrencyDto })
  currency?: ResponseCurrencyDto;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  currencyId?: number;

  @ApiProperty({ type: () => ResponseBankAccountDto })
  bankAccount?: ResponseBankAccountDto;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  bankAccountId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  firmId?: number;

  @ApiProperty({ type: () => ResponseFirmDto })
  firm?: ResponseFirmDto;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  interlocutorId?: number;

  @ApiProperty({ type: () => ResponseInterlocutorDto })
  interlocutor?: ResponseInterlocutorDto;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  cabinetId?: number;

  @ApiProperty({ type: () => ResponseCabinetDto })
  cabinet?: ResponseCabinetDto;

  @ApiProperty({
    example: faker.hacker.phrase(),
    type: String,
  })
  notes?: string;

  @ApiProperty({
    example: '1',
    type: Number,
    required: false,
  })
  deliveryNoteId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
    required: false,
  })
  goodsIssueNoteId?: number;

  @ApiProperty({ type: () => ResponseArticleCreditNoteEntryDto, isArray: true })
  articleCreditNoteEntries?: ResponseArticleCreditNoteEntryDto[];

  @ApiProperty({ type: () => ResponseCreditNoteMetaDataDto })
  creditNoteMetaData?: ResponseCreditNoteMetaDataDto;

  @ApiProperty({ required: false })
  uploads?: ResponseCreditNoteUploadDto[];

  @ApiProperty({
    required: false,
    type: () => ResponseCreditNoteLinkedDocumentDto,
  })
  sourceInvoice?: ResponseCreditNoteLinkedDocumentDto;

  @ApiProperty({
    required: false,
    type: () => ResponseCreditNoteLinkedDocumentDto,
  })
  sourceReturnNote?: ResponseCreditNoteLinkedDocumentDto;

  @ApiProperty({
    example: '1',
    type: Number,
    required: false,
  })
  quotationId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  taxStampId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  taxWithholdingId?: number;

  @ApiProperty({
    example: '12.5',
    type: Number,
    required: false,
  })
  taxWithholdingAmount?: number;
}
