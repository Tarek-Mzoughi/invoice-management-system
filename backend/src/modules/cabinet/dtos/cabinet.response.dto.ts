import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ResponseDtoHelper } from 'src/shared/database/dtos/database.response.dto';
import { ResponseActivityDto } from 'src/modules/activity/dtos/activity.response.dto';
import { ResponseAddressDto } from 'src/modules/address/dtos/address.response.dto';
import { ResponseCountryDto } from 'src/modules/country/dtos/country.response.dto';
import { ResponseCurrencyDto } from 'src/modules/currency/dtos/currency.response.dto';
import { CABINET_INVOICE_DISPLAY_TYPE } from '../enums/cabinet-invoice-display-type.enum';

export class ResponseCabinetDto extends ResponseDtoHelper {
  @ApiProperty({ example: 1, type: Number })
  @Expose()
  id?: number;

  @ApiProperty({ example: faker.company.name(), type: String })
  @Expose()
  enterpriseName?: string;

  @ApiProperty({ example: faker.internet.email(), type: String })
  @Expose()
  email?: string;

  @ApiProperty({ example: faker.internet.url(), type: String, nullable: true })
  @Expose()
  website?: string;

  @ApiProperty({ example: false, type: Boolean })
  @Expose()
  isPerson?: boolean;

  @ApiProperty({ example: faker.phone.number(), type: String })
  @Expose()
  phone?: string;

  @ApiProperty({ type: [String], nullable: true })
  @Expose()
  phoneNumbers?: string[];

  @ApiProperty({ example: faker.finance.routingNumber(), type: String })
  @Expose()
  taxIdNumber?: string;

  @ApiProperty({ example: 'Service', type: String, nullable: true })
  @Expose()
  activityType?: string;

  @ApiProperty({ example: 'moral', type: String, nullable: true })
  @Expose()
  personType?: string;

  @ApiProperty({ type: Object, nullable: true })
  @Expose()
  taxSettings?: Record<string, unknown>;

  @ApiProperty({ example: false, type: Boolean })
  @Expose()
  onboardingCompleted?: boolean;

  @ApiProperty({ type: Date, nullable: true })
  @Expose()
  onboardingCompletedAt?: Date;

  @ApiProperty({ type: () => ResponseAddressDto, nullable: true })
  @Expose()
  address?: ResponseAddressDto;

  @ApiProperty({ type: () => ResponseAddressDto, nullable: true })
  @Expose()
  invoicingAddress?: ResponseAddressDto;

  @ApiProperty({ type: () => ResponseAddressDto, nullable: true })
  @Expose()
  deliveryAddress?: ResponseAddressDto;

  @ApiProperty({ type: () => ResponseActivityDto, nullable: true })
  @Expose()
  activity?: ResponseActivityDto;

  @ApiProperty({ type: [ResponseActivityDto], nullable: true })
  @Expose()
  activities?: ResponseActivityDto[];

  @ApiProperty({ type: () => ResponseCurrencyDto, nullable: true })
  @Expose()
  currency?: ResponseCurrencyDto;

  @ApiProperty({ type: () => ResponseCountryDto, nullable: true })
  @Expose()
  country?: ResponseCountryDto;

  @ApiProperty({ example: 1, type: Number, nullable: true })
  @Expose()
  countryId?: number;

  @ApiProperty({
    enum: CABINET_INVOICE_DISPLAY_TYPE,
    nullable: true,
  })
  @Expose()
  invoiceDisplayType?: CABINET_INVOICE_DISPLAY_TYPE;

  @ApiProperty({ example: 1, type: Number })
  @Expose()
  logoId?: number;

  @ApiProperty({ example: 1, type: Number })
  @Expose()
  signatureId?: number;

  @ApiProperty({ example: 1, type: Number })
  @Expose()
  stampId?: number;
}
