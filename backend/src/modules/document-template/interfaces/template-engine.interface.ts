import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../enums/document-template-document-type.enum';

export interface GenericDocumentTemplateData {
  company?: Record<string, unknown>;
  client?: Record<string, unknown>;
  supplier?: Record<string, unknown>;
  document?: Record<string, unknown>;
  totals?: Record<string, unknown>;
  items?: Record<string, unknown>[];
  payments?: Record<string, unknown>[];
  bank?: Record<string, unknown>;
  signature?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TemplateRenderOptions {
  templateId?: number;
  documentType?: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;
  filename?: string;
}

export abstract class TemplateEngineService {
  abstract createTemplate(
    schema: Record<string, unknown>,
  ): Record<string, unknown>;
  abstract updateTemplate(
    schema: Record<string, unknown>,
    patch: Record<string, unknown>,
  ): Record<string, unknown>;
  abstract validateTemplateSchema(schema: Record<string, unknown>): void;
  abstract renderPreview(
    schema: Record<string, unknown>,
    data: GenericDocumentTemplateData,
    options?: TemplateRenderOptions,
  ): Promise<Buffer>;
  abstract generatePdf(
    schema: Record<string, unknown>,
    data: GenericDocumentTemplateData,
    options?: TemplateRenderOptions,
  ): Promise<Buffer>;
  abstract mapVariables(
    data: GenericDocumentTemplateData,
  ): Record<string, unknown>;
  abstract exportTemplate(
    schema: Record<string, unknown>,
  ): Record<string, unknown>;
  abstract importTemplate(
    schema: Record<string, unknown>,
  ): Record<string, unknown>;
}
