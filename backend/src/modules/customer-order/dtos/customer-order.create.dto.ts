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
import { CreateArticleCustomerOrderEntryDto } from 'src/modules/customer-order/dtos/article-customer-order-entry.create.dto';
import { CUSTOMER_ORDER_STATUS } from '../enums/customer-order-status.enum';
import { CreateCustomerOrderMetaDataDto } from './customer-order-meta-data.create.dto';
import { CreateCustomerOrderUploadDto } from './customer-order-upload.create.dto';

export class CreateCustomerOrderDto {
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
    example: CUSTOMER_ORDER_STATUS.Draft,
    enum: CUSTOMER_ORDER_STATUS,
  })
  @IsOptional()
  @IsEnum(CUSTOMER_ORDER_STATUS)
  status?: CUSTOMER_ORDER_STATUS;

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
    type: () => CreateArticleCustomerOrderEntryDto,
    isArray: true,
  })
  @IsOptional()
  articleCustomerOrderEntries?: CreateArticleCustomerOrderEntryDto[];

  @ApiProperty({ type: () => CreateCustomerOrderMetaDataDto })
  @IsOptional()
  customerOrderMetaData?: CreateCustomerOrderMetaDataDto;

  @ApiProperty({ required: false })
  @IsOptional()
  uploads?: CreateCustomerOrderUploadDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  invoiceId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  quotationId?: number;
}
