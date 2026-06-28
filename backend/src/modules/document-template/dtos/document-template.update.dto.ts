import { PartialType } from '@nestjs/swagger';
import { CreateDocumentTemplateDto } from './document-template.create.dto';

export class UpdateDocumentTemplateDto extends PartialType(
  CreateDocumentTemplateDto,
) {}
