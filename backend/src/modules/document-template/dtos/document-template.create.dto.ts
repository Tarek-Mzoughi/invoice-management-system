import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../enums/document-template-document-type.enum';
import { DOCUMENT_TEMPLATE_STATUS } from '../enums/document-template-status.enum';

export class CreateDocumentTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: DOCUMENT_TEMPLATE_DOCUMENT_TYPE })
  @IsEnum(DOCUMENT_TEMPLATE_DOCUMENT_TYPE)
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;

  @ApiPropertyOptional({ enum: DOCUMENT_TEMPLATE_STATUS })
  @IsOptional()
  @IsEnum(DOCUMENT_TEMPLATE_STATUS)
  status?: DOCUMENT_TEMPLATE_STATUS;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  templateSchema?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  pageSettings?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  variablesConfig?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  thumbnailStorageId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  cabinetId?: number;
}
