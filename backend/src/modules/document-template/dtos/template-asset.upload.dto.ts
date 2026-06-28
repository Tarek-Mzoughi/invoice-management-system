import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import { DOCUMENT_TEMPLATE_ASSET_TYPE } from '../enums/document-template-asset-type.enum';

export class UploadTemplateAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  templateId?: number;

  @ApiPropertyOptional({ enum: DOCUMENT_TEMPLATE_ASSET_TYPE })
  @IsOptional()
  @IsEnum(DOCUMENT_TEMPLATE_ASSET_TYPE)
  assetType?: DOCUMENT_TEMPLATE_ASSET_TYPE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
