import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { CreateAddressDto } from 'src/modules/address/dtos/address.create.dto';
import { lowerCaseTransformer } from 'src/utils/transformers/lower-case.transformer';
import { CABINET_INVOICE_DISPLAY_TYPE } from '../enums/cabinet-invoice-display-type.enum';

export class CreateCabinetDto {
  @ApiProperty({ example: faker.company.name(), type: String })
  @IsNotEmpty()
  enterpriseName?: string;

  @ApiProperty({ example: faker.internet.email(), type: String })
  @Transform(lowerCaseTransformer)
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: faker.internet.url(), type: String, required: false })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ example: false, type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  isPerson?: boolean;

  @ApiProperty({ example: faker.phone.number(), type: String })
  @IsOptional()
  phone?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phoneNumbers?: string[];

  @ApiProperty({ example: faker.finance.routingNumber(), type: String })
  @IsOptional()
  taxIdNumber?: string;

  @ApiProperty({ example: 'Service', type: String, required: false })
  @IsOptional()
  @IsString()
  activityType?: string;

  @ApiProperty({ example: 'moral', type: String, required: false })
  @IsOptional()
  @IsString()
  personType?: string;

  @ApiProperty({ type: Object, required: false })
  @IsOptional()
  taxSettings?: Record<string, unknown>;

  @ApiProperty({ type: () => CreateAddressDto, required: false })
  @IsOptional()
  address: CreateAddressDto;

  @ApiProperty({ type: () => CreateAddressDto, required: false })
  @IsOptional()
  invoicingAddress?: CreateAddressDto;

  @ApiProperty({ type: () => CreateAddressDto, required: false })
  @IsOptional()
  deliveryAddress?: CreateAddressDto;

  @ApiProperty({ example: 1, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  activityId?: number;

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  activityIds?: number[];

  @ApiProperty({ example: 1, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  currencyId?: number;

  @ApiProperty({ example: 1, type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  countryId?: number;

  @ApiProperty({
    enum: CABINET_INVOICE_DISPLAY_TYPE,
    required: false,
  })
  @IsOptional()
  @IsEnum(CABINET_INVOICE_DISPLAY_TYPE)
  invoiceDisplayType?: CABINET_INVOICE_DISPLAY_TYPE;

  @ApiProperty({
    example: 1,
    type: Number,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  addressId?: number;

  @ApiProperty({
    example: 1,
    type: Number,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  deliveryAddressId?: number;

  @ApiProperty({
    example: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  logoId?: number;

  @ApiProperty({
    example: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  signatureId?: number;

  @ApiProperty({
    example: 1,
    type: Number,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stampId?: number;
}
