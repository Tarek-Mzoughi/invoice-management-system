import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { DISCOUNT_TYPES } from 'src/app/enums/discount-types.enum';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { ResponseArticleDeliveryNoteEntryDto } from 'src/modules/delivery-note/dtos/article-delivery-note-entry.response.dto';
import { ResponseFirmDto } from 'src/modules/firm/dtos/firm.response.dto';
import { ResponseInterlocutorDto } from 'src/modules/interlocutor/dtos/interlocutor.response.dto';
import { DELIVERY_NOTE_STATUS } from '../enums/delivery-note-status.enum';
import { ResponseCabinetDto } from 'src/modules/cabinet/dtos/cabinet.response.dto';
import { ResponseDeliveryNoteMetaDataDto } from './delivery-note-meta-data.response.dto';
import { ResponseCurrencyDto } from 'src/modules/currency/dtos/currency.response.dto';
import { ResponseBankAccountDto } from 'src/modules/bank-account/dtos/bank-account.response.dto';
import { ResponseDeliveryNoteUploadDto } from './delivery-note-upload.response.dto';
import { ResponseCustomerOrderDto } from 'src/modules/customer-order/dtos/customer-order.response.dto';
import { ResponseReturnNoteDto } from 'src/modules/return-note/dtos/return-note.response.dto';

export class ResponseDeliveryNoteDto {
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
    example: DELIVERY_NOTE_STATUS.Draft,
    enum: DELIVERY_NOTE_STATUS,
  })
  status?: DELIVERY_NOTE_STATUS;

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

  @ApiProperty({ type: () => ResponseFirmDto })
  cabinet?: ResponseCabinetDto;

  @ApiProperty({
    example: faker.hacker.phrase(),
    type: String,
  })
  notes?: string;

  @ApiProperty({
    type: () => ResponseArticleDeliveryNoteEntryDto,
    isArray: true,
  })
  articleDeliveryNoteEntries?: ResponseArticleDeliveryNoteEntryDto[];

  @ApiProperty({ type: () => ResponseDeliveryNoteMetaDataDto })
  deliveryNoteMetaData?: ResponseDeliveryNoteMetaDataDto;

  @ApiProperty({ required: false })
  uploads?: ResponseDeliveryNoteUploadDto[];

  @ApiProperty({ required: false })
  invoiceId?: number;

  @ApiProperty({ required: false, type: Number })
  customerOrderId?: number;

  @ApiProperty({ required: false, type: () => ResponseCustomerOrderDto })
  customerOrder?: ResponseCustomerOrderDto;

  @ApiProperty({
    required: false,
    type: () => ResponseReturnNoteDto,
    isArray: true,
  })
  returnNotes?: ResponseReturnNoteDto[];
}
