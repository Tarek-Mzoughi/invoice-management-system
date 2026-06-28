import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectPaymentDto {
  @ApiProperty({
    required: false,
    example: 'Provision insuffisante',
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  reason?: string;
}
