import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateTemplateCategoryDto {
  @ApiProperty({ example: 'DEVIS', type: String })
  @IsString()
  @MinLength(3)
  label: string;
}
