import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { DISCOUNT_TYPES } from 'src/app/enums/discount-types.enum';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { ResponseArticleCustomerOrderEntryDto } from 'src/modules/customer-order/dtos/article-customer-order-entry.response.dto';
import { ResponseFirmDto } from 'src/modules/firm/dtos/firm.response.dto';
import { ResponseInterlocutorDto } from 'src/modules/interlocutor/dtos/interlocutor.response.dto';
import { CUSTOMER_ORDER_STATUS } from '../enums/customer-order-status.enum';
import { ResponseCabinetDto } from 'src/modules/cabinet/dtos/cabinet.response.dto';
import { ResponseCustomerOrderMetaDataDto } from './customer-order-meta-data.response.dto';
import { ResponseCurrencyDto } from 'src/modules/currency/dtos/currency.response.dto';
import { ResponseBankAccountDto } from 'src/modules/bank-account/dtos/bank-account.response.dto';
import { ResponseCustomerOrderUploadDto } from './customer-order-upload.response.dto';
import { ResponseInvoiceDto } from 'src/modules/invoice/dtos/invoice.response.dto';
import { ResponseDeliveryNoteDto } from 'src/modules/delivery-note/dtos/delivery-note.response.dto';

export class ResponseCustomerOrderDto {
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
    example: CUSTOMER_ORDER_STATUS.Draft,
    enum: CUSTOMER_ORDER_STATUS,
  })
  status?: CUSTOMER_ORDER_STATUS;

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
    type: () => ResponseArticleCustomerOrderEntryDto,
    isArray: true,
  })
  articleCustomerOrderEntries?: ResponseArticleCustomerOrderEntryDto[];

  @ApiProperty({ type: () => ResponseCustomerOrderMetaDataDto })
  customerOrderMetaData?: ResponseCustomerOrderMetaDataDto;

  @ApiProperty({ required: false })
  uploads?: ResponseCustomerOrderUploadDto[];

  @ApiProperty({
    required: false,
    type: () => ResponseInvoiceDto,
    isArray: true,
  })
  invoices?: ResponseInvoiceDto[];

  @ApiProperty({
    required: false,
    type: () => ResponseDeliveryNoteDto,
    isArray: true,
  })
  deliveryNotes?: ResponseDeliveryNoteDto[];

  @ApiProperty({ required: false })
  invoiceId?: number;
}
