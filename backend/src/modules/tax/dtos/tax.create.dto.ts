import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTaxDto {
  @ApiProperty({ example: 'FODEC', type: String })
  @IsString()
  @MinLength(3)
  label: string;

  @ApiProperty({ example: '0.05', type: Number })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ example: 'true', type: Boolean })
  @IsBoolean()
  isRate: boolean;

  @ApiProperty({ example: 'true', type: Boolean })
  @IsBoolean()
  isSpecial: boolean;

  @ApiProperty({ example: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  currencyId?: number;

  @ApiProperty({ example: true, type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
