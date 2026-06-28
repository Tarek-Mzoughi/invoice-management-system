import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { TREASURY_MOVEMENT_DIRECTION } from '../enums/treasury-movement-direction.enum';
import { TREASURY_MOVEMENT_KIND } from '../enums/treasury-movement-kind.enum';

export class CreateTreasuryMovementDto {
  @ApiProperty({ example: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  accountId: number;

  @ApiProperty({ example: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  currencyId: number;

  @ApiProperty({
    example: TREASURY_MOVEMENT_KIND.EXPENSE,
    enum: TREASURY_MOVEMENT_KIND,
  })
  @IsEnum(TREASURY_MOVEMENT_KIND)
  kind: TREASURY_MOVEMENT_KIND;

  @ApiProperty({
    example: TREASURY_MOVEMENT_DIRECTION.OUT,
    enum: TREASURY_MOVEMENT_DIRECTION,
  })
  @IsEnum(TREASURY_MOVEMENT_DIRECTION)
  direction: TREASURY_MOVEMENT_DIRECTION;

  @ApiProperty({ example: 125.5, type: Number })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: faker.finance.transactionDescription(),
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;

  @ApiProperty({ example: faker.lorem.sentence(), required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  notes?: string;

  @ApiProperty({ example: faker.date.recent().toISOString(), type: String })
  @IsDateString()
  movementDate: string;
}
