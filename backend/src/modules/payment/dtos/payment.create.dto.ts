import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { PAYMENT_MODE } from '../enums/payment-mode.enum';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { CreatePaymentUploadDto } from './payment-upload.create.dto';
import { CreatePaymentInvoiceEntryDto } from './payment-invoice-entry.create.dto';
import { PAYMENT_COLLECTION_STATUS } from '../enums/payment-collection-status.enum';
import { CreatePaymentCreditNoteEntryDto } from './payment-credit-note-entry.create.dto';

export class CreatePaymentDto {
  @ApiProperty({ example: 1, type: Number })
  id?: number;

  @ApiProperty({
    example: ACTIVITY_TYPE.SELLING,
    enum: ACTIVITY_TYPE,
    required: false,
  })
  @IsOptional()
  @IsEnum(ACTIVITY_TYPE)
  activityType?: ACTIVITY_TYPE;

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
  @Transform(({ value }) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
  })
  @IsPositive()
  convertionRate?: number;

  @ApiProperty({ example: faker.date.anytime(), type: Date })
  date?: Date;

  @ApiProperty({
    example: PAYMENT_MODE.Cash,
    enum: PAYMENT_MODE,
  })
  @IsEnum(PAYMENT_MODE)
  @IsOptional()
  mode?: PAYMENT_MODE;

  @ApiProperty({
    example: faker.hacker.phrase(),
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  notes?: string;

  @ApiProperty({
    example: faker.finance.transactionType(),
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;

  @ApiProperty({
    example: faker.date.future().toISOString(),
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  currencyId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  firmId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
    required: false,
    description:
      'Internal tenant context for server-side workflows. Authenticated requests are resolved from the user cabinet.',
  })
  @IsOptional()
  @IsInt()
  cabinetId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsInt()
  treasuryAccountId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsInt()
  originTreasuryAccountId?: number;

  @ApiProperty({
    example: PAYMENT_COLLECTION_STATUS.PENDING,
    enum: PAYMENT_COLLECTION_STATUS,
    required: false,
  })
  @IsOptional()
  @IsEnum(PAYMENT_COLLECTION_STATUS)
  collectionStatus?: PAYMENT_COLLECTION_STATUS;

  @ApiProperty({
    example: faker.date.recent().toISOString(),
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  depositedAt?: Date;

  @ApiProperty({
    example: faker.date.recent().toISOString(),
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  paidAt?: Date;

  @ApiProperty({
    example: faker.date.recent().toISOString(),
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  rejectedAt?: Date;

  @ApiProperty({
    example: faker.lorem.sentence(),
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  rejectionReason?: string;

  @ApiProperty({
    example: 1,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsInt()
  encashmentMovementId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsInt()
  taxWithholdingId?: number;

  @ApiProperty({
    example: faker.date.recent().toISOString(),
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  taxWithholdingDate?: Date;

  @ApiProperty({
    example: '15.0',
    type: Number,
    required: false,
  })
  @IsOptional()
  taxWithholdingAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  uploads?: CreatePaymentUploadDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  invoices?: CreatePaymentInvoiceEntryDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  creditNotes?: CreatePaymentCreditNoteEntryDto[];
}
