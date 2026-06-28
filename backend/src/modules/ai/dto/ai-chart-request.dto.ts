import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AiChartRequestDto {
  @ApiProperty({
    example: 'Génère un chart des factures payées vs non payées par mois',
    type: String,
  })
  @IsString()
  @MaxLength(2000)
  message: string;

  @ApiProperty({ example: 'uuid-string', required: false })
  @IsOptional()
  @IsString()
  conversationId?: string;
}
