import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePriceListDto {
  @ApiProperty({ example: 'Prix de gros', type: String })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: true, type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
