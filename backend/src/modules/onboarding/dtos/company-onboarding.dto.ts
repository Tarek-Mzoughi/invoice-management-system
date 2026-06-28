import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CompanyOnboardingAddressDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  city: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  postalCode: string;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  countryId: number;
}

export class CompanyTaxSettingsDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  vatRates: number[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  additionalTaxes: string[];
}

export class CompleteCompanyOnboardingDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  activityType?: string;

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  activityId?: number;

  @ApiProperty({ type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  createNewCabinet?: boolean;

  @ApiProperty({ enum: ['physical', 'moral'] })
  @IsIn(['physical', 'moral'])
  personType: 'physical' | 'moral';

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  enterpriseName: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxIdNumber?: string;

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  logoId?: number;

  @ApiProperty({ type: () => CompanyOnboardingAddressDto })
  @ValidateNested()
  @Type(() => CompanyOnboardingAddressDto)
  address: CompanyOnboardingAddressDto;

  @ApiProperty({ type: () => CompanyTaxSettingsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyTaxSettingsDto)
  taxSettings?: CompanyTaxSettingsDto;

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  selectedTaxTemplateIds?: number[];
}
