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
import { CreateArticleGoodsIssueNoteEntryDto } from 'src/modules/goods-issue-note/dtos/article-goods-issue-note-entry.create.dto';
import { GOODS_ISSUE_NOTE_STATUS } from '../enums/goods-issue-note-status.enum';
import { CreateGoodsIssueNoteMetaDataDto } from './goods-issue-note-meta-data.create.dto';
import { CreateGoodsIssueNoteUploadDto } from './goods-issue-note-upload.create.dto';

export class CreateGoodsIssueNoteDto {
  @ApiProperty({
    example: ACTIVITY_TYPE.SELLING,
    enum: ACTIVITY_TYPE,
    required: false,
  })
  @IsOptional()
  @IsEnum(ACTIVITY_TYPE)
  activityType?: ACTIVITY_TYPE;

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
    example: GOODS_ISSUE_NOTE_STATUS.Draft,
    enum: GOODS_ISSUE_NOTE_STATUS,
  })
  @IsOptional()
  @IsEnum(GOODS_ISSUE_NOTE_STATUS)
  status?: GOODS_ISSUE_NOTE_STATUS;

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
  quotationId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  customerOrderId?: number;

  @ApiProperty({
    example: '1',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  invoiceId?: number;

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

  @ApiProperty({
    type: () => CreateArticleGoodsIssueNoteEntryDto,
    isArray: true,
  })
  @IsOptional()
  articleGoodsIssueNoteEntries?: CreateArticleGoodsIssueNoteEntryDto[];

  @ApiProperty({ type: () => CreateGoodsIssueNoteMetaDataDto })
  @IsOptional()
  goodsIssueNoteMetaData?: CreateGoodsIssueNoteMetaDataDto;

  @ApiProperty({ required: false })
  @IsOptional()
  uploads?: CreateGoodsIssueNoteUploadDto[];
}
