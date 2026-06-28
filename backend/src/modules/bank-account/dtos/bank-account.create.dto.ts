import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsBIC,
  IsBoolean,
  IsIBAN,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { BANK_ACCOUNT_TYPE } from '../enums/bank-account-type.enum';

export class CreateBankAccountDto {
  @ApiProperty({
    required: false,
    example: faker.name.firstName(),
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    required: false,
    enum: BANK_ACCOUNT_TYPE,
    example: BANK_ACCOUNT_TYPE.BANK,
  })
  @IsOptional()
  @IsEnum(BANK_ACCOUNT_TYPE)
  type?: BANK_ACCOUNT_TYPE;

  @ApiProperty({
    required: false,
    example: faker.finance.bic(),
  })
  @ValidateIf(
    (o) => (o.type ?? BANK_ACCOUNT_TYPE.BANK) === BANK_ACCOUNT_TYPE.BANK,
  )
  @IsBIC()
  bic?: string;

  @ApiProperty({
    required: false,
    example: faker.finance.account(20),
  })
  @ValidateIf(
    (o) => (o.type ?? BANK_ACCOUNT_TYPE.BANK) === BANK_ACCOUNT_TYPE.BANK,
  )
  @IsString()
  @MaxLength(20)
  rib?: string;

  @ApiProperty({
    required: false,
    example: faker.finance.iban(),
  })
  @ValidateIf(
    (o) => (o.type ?? BANK_ACCOUNT_TYPE.BANK) === BANK_ACCOUNT_TYPE.BANK,
  )
  @IsIBAN()
  iban?: string;

  @ApiProperty({
    required: false,
    example: faker.location.city(),
  })
  @ValidateIf(
    (o) => (o.type ?? BANK_ACCOUNT_TYPE.BANK) === BANK_ACCOUNT_TYPE.BANK,
  )
  @IsString()
  @MaxLength(255)
  agency?: string;

  @ApiProperty({
    required: false,
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  currencyId: number;

  @ApiProperty({
    required: false,
    example: faker.datatype.boolean(),
  })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}
