import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateDocumentTemplateVersionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  changeDescription?: string;
}
