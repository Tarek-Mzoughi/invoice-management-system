import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsObject, IsOptional } from 'class-validator';

export class DocumentTemplatePreviewDto {
  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  sampleData?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  templateSchema?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  documentId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  cabinetId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  persist?: boolean;
}
