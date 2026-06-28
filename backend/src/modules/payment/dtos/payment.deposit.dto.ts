import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class DepositPaymentDto {
  @ApiProperty({ example: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  bankAccountId: number;
}
