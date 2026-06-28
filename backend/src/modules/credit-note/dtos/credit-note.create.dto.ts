import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DISCOUNT_TYPES } from 'src/app/enums/discount-types.enum';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { CREDIT_NOTE_STATUS } from '../enums/credit-note-status.enum';
import { CreateArticleCreditNoteEntryDto } from './article-credit-note-entry.create.dto';
import { CreateCreditNoteMetaDataDto } from './credit-note-meta-data.create.dto';
import { CreateCreditNoteUploadDto } from './credit-note-upload.create.dto';

export class CreateCreditNoteDto {
  @ApiProperty({
    example: ACTIVITY_TYPE.SELLING,
    enum: ACTIVITY_TYPE,
    required: false,
  })
  @IsOptional()
  @IsEnum(ACTIVITY_TYPE)
  activityType?: ACTIVITY_TYPE;

  @ApiProperty({
    example: 'FAC-FOURN-2026-001',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;

  @ApiProperty({ example: faker.date.anytime() })
  date?: Date;

  @ApiProperty({ example: faker.date.anytime() })
  dueDate?: Date;

  @ApiProperty({
    example: faker.finance.transactionDescription(),
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  object?: string;

  @ApiProperty({
    example: faker.hacker.phrase(),
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  generalConditions?: string;

  @ApiProperty({
    example: CREDIT_NOTE_STATUS.Unpaid,
    enum: CREDIT_NOTE_STATUS,
  })
  @IsOptional()
  @IsEnum(CREDIT_NOTE_STATUS)
  status?: CREDIT_NOTE_STATUS;

  @ApiProperty({
    example: '0.1',
    type: Number,
  })
  @IsOptional()
  discount?: number;

  @ApiProperty({ example: DISCOUNT_TYPES.PERCENTAGE, enum: DISCOUNT_TYPES })
  @IsOptional()
  @IsEnum(DISCOUNT_TYPES)
  discount_type?: DISCOUNT_TYPES;

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
  bankAccountId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  sourceInvoiceId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  sourceReturnNoteId?: number;

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
      'Internal tenant context for server-side document transformations. Authenticated requests are resolved from the user cabinet.',
  })
  @IsOptional()
  @IsInt()
  cabinetId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  interlocutorId?: number;

  @ApiProperty({
    example: faker.hacker.phrase(),
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  notes?: string;

  @ApiProperty({ type: () => CreateArticleCreditNoteEntryDto, isArray: true })
  @IsOptional()
  articleCreditNoteEntries?: CreateArticleCreditNoteEntryDto[];

  @ApiProperty({ type: () => CreateCreditNoteMetaDataDto })
  @IsOptional()
  creditNoteMetaData?: CreateCreditNoteMetaDataDto;

  @ApiProperty({ required: false })
  @IsOptional()
  uploads?: CreateCreditNoteUploadDto[];

  @ApiProperty({
    example: '1',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  quotationId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsInt()
  deliveryNoteId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsInt()
  goodsIssueNoteId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  taxStampId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  taxWithholdingId?: number;
}
