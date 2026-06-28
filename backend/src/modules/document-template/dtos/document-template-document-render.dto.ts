import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../enums/document-template-document-type.enum';

export class DocumentTemplateDocumentRenderDto {
  @ApiProperty({ enum: DOCUMENT_TEMPLATE_DOCUMENT_TYPE })
  @IsEnum(DOCUMENT_TEMPLATE_DOCUMENT_TYPE)
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  documentId: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  templateId?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  cabinetId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  storeGeneratedDocument?: boolean;
}
