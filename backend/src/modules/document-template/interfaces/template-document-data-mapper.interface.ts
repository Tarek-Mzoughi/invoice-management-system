import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../enums/document-template-document-type.enum';
import { GenericDocumentTemplateData } from './template-engine.interface';

export interface TemplateDocumentDataMapper {
  readonly documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;
  map(
    documentId?: number,
    cabinetId?: number,
  ): Promise<GenericDocumentTemplateData>;
}
