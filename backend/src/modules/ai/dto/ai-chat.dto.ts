import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AiChatContextDto {
  @ApiProperty({ example: 'dashboard', required: false })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({ example: 'invoice', required: false })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  entityId?: number;
}

export class AiAttachmentDto {
  @ApiProperty({ example: 'image/jpeg', description: 'MIME type of the file' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'Base64-encoded file content' })
  @IsString()
  data: string;

  @ApiProperty({ example: 'facture.pdf', required: false })
  @IsOptional()
  @IsString()
  fileName?: string;
}

export class AiChatDto {
  @ApiProperty({
    example: 'Quels sont les factures en retard ?',
    type: String,
  })
  @IsString()
  @MaxLength(2000)
  message: string;

  @ApiProperty({ example: 'uuid-string', required: false })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({ type: () => AiChatContextDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => AiChatContextDto)
  context?: AiChatContextDto;

  @ApiProperty({
    type: () => [AiAttachmentDto],
    required: false,
    description: 'File attachments (images, PDFs) as base64',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiAttachmentDto)
  attachments?: AiAttachmentDto[];
}
