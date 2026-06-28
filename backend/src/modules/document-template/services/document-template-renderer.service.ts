import { Injectable } from '@nestjs/common';
import { DocumentTemplateDocumentRenderDto } from '../dtos/document-template-document-render.dto';
import { DocumentTemplatePreviewDto } from '../dtos/document-template-preview.dto';
import { DocumentTemplateEntity } from '../entities/document-template.entity';
import { DocumentTemplateRepository } from '../repositories/document-template.repository';
import { DocumentTemplateService } from './document-template.service';
import { GeneratedDocumentService } from './generated-document.service';
import { TemplateDataMapperRegistry } from './data-mappers/template-data-mapper.registry';
import {
  GenericDocumentTemplateData,
  TemplateRenderOptions,
  TemplateEngineService,
} from '../interfaces/template-engine.interface';
import { getSampleTemplateData } from './data-mappers/sample-template-data';
import { TemplateImageResolverService } from './template-image-resolver.service';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { createDefaultDocumentTemplateSchema } from '../templates/document-default-template';

@Injectable()
export class DocumentTemplateRendererService {
  constructor(
    private readonly templateRepository: DocumentTemplateRepository,
    private readonly templateService: DocumentTemplateService,
    private readonly mapperRegistry: TemplateDataMapperRegistry,
    private readonly engineService: TemplateEngineService,
    private readonly generatedDocumentService: GeneratedDocumentService,
    private readonly imageResolver: TemplateImageResolverService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async preview(
    id: number,
    dto: DocumentTemplatePreviewDto,
    userId?: string,
  ): Promise<Buffer> {
    const template = await this.templateService.findOneById(id, userId);
    const data = await this.resolveData(template, dto, template.cabinetId);
    const schema = dto.templateSchema || template.templateSchema;
    const options = {
      templateId: template.id,
      documentType: template.documentType,
      filename: `${template.slug || 'template'}-preview.pdf`,
    };
    const resolved = await this.resolveImages(schema, data, options);
    return this.engineService.renderPreview(
      resolved.schema,
      resolved.data,
      options,
    );
  }

  async generate(
    id: number,
    dto: DocumentTemplatePreviewDto,
    userId?: string,
  ): Promise<Buffer> {
    const template = await this.templateService.findOneById(id, userId);
    const data = await this.resolveData(template, dto, template.cabinetId);
    const filename = `${template.slug || 'document'}-${Date.now()}.pdf`;
    const options = {
      templateId: template.id,
      documentType: template.documentType,
      filename,
    };
    const resolved = await this.resolveImages(
      template.templateSchema,
      data,
      options,
    );
    const pdfBuffer = await this.engineService.generatePdf(
      resolved.schema,
      resolved.data,
      options,
    );

    if (dto.persist !== false) {
      await this.generatedDocumentService.savePdf({
        pdfBuffer,
        templateId: template.id,
        documentType: template.documentType,
        sourceDocumentId: dto.documentId,
        cabinetId: template.cabinetId,
        filename,
        generatedById: userId,
      });
    }

    return pdfBuffer;
  }

  async generateDefault(
    documentType: string,
    dto: DocumentTemplatePreviewDto,
    userId?: string,
  ): Promise<Buffer | null> {
    const template = await this.templateService.findDefaultByDocumentType(
      documentType,
      userId || dto.cabinetId,
    );
    if (!template) return null;

    const reloadedTemplate = await this.templateRepository.findOne({
      where: { id: template.id },
    });
    if (!reloadedTemplate) return null;
    return this.generate(reloadedTemplate.id, dto, userId);
  }

  async previewDocument(
    dto: DocumentTemplateDocumentRenderDto,
    userId?: string,
  ): Promise<Buffer> {
    const { template, data } = await this.resolveDocumentTemplateAndData(
      dto,
      userId,
    );
    const options = {
      templateId: template.id,
      documentType: template.documentType,
      filename: `${template.slug || 'document'}-preview.pdf`,
    };
    const resolved = await this.resolveImages(
      template.templateSchema,
      data,
      options,
    );
    return this.engineService.renderPreview(
      resolved.schema,
      resolved.data,
      options,
    );
  }

  async generateDocument(
    dto: DocumentTemplateDocumentRenderDto,
    userId?: string,
  ): Promise<Buffer> {
    const { template, data, cabinetId } =
      await this.resolveDocumentTemplateAndData(dto, userId);
    const filename = `${template.slug || 'document'}-${dto.documentId}.pdf`;
    const options = {
      templateId: template.id,
      documentType: template.documentType,
      filename,
    };
    const resolved = await this.resolveImages(
      template.templateSchema,
      data,
      options,
    );
    const pdfBuffer = await this.engineService.generatePdf(
      resolved.schema,
      resolved.data,
      options,
    );

    if (dto.storeGeneratedDocument === true) {
      await this.generatedDocumentService.savePdf({
        pdfBuffer,
        templateId: template.id,
        documentType: template.documentType,
        sourceDocumentId: dto.documentId,
        cabinetId,
        filename,
        generatedById: userId,
      });
    }

    return pdfBuffer;
  }

  private async resolveData(
    template: DocumentTemplateEntity,
    dto: DocumentTemplatePreviewDto,
    cabinetId: number,
  ): Promise<GenericDocumentTemplateData> {
    if (dto.sampleData) return dto.sampleData;
    if (dto.documentId) {
      return this.mapperRegistry.map(
        template.documentType,
        dto.documentId,
        cabinetId,
      );
    }
    return getSampleTemplateData(template.documentType);
  }

  private async resolveDocumentTemplateAndData(
    dto: DocumentTemplateDocumentRenderDto,
    userId?: string,
  ): Promise<{
    template: DocumentTemplateEntity;
    data: GenericDocumentTemplateData;
    cabinetId: number;
  }> {
    let template = dto.templateId
      ? await this.templateService.findUsableTemplate(
          dto.templateId,
          dto.documentType,
          userId || dto.cabinetId,
        )
      : await this.templateService.findDefaultByDocumentType(
          dto.documentType,
          userId || dto.cabinetId,
        );

    let cabinetId = template?.cabinetId || dto.cabinetId;
    if (!cabinetId && userId) {
      try {
        cabinetId =
          await this.tenantContextService.getCurrentCabinetIdOrFail(userId);
      } catch {}
    }

    if (!template || !template.templateSchema) {
      const title = this.getDefaultTitleForDocumentType(dto.documentType);
      template = {
        id: 0,
        documentType: dto.documentType,
        templateSchema: createDefaultDocumentTemplateSchema(title),
        cabinetId: cabinetId || 1,
        slug: 'default',
      } as any;
    }

    const data = await this.mapperRegistry.map(
      template.documentType,
      dto.documentId,
      cabinetId,
    );

    return { template, data, cabinetId: cabinetId || 1 };
  }

  private getDefaultTitleForDocumentType(documentType: string): string {
    const titles: Record<string, string> = {
      INVOICE: 'FACTURE',
      QUOTE: 'DEVIS',
      CUSTOMER_ORDER: 'COMMANDE CLIENT',
      DELIVERY_NOTE: 'BON DE LIVRAISON',
      GOODS_ISSUE_NOTE: 'BON DE SORTIE',
      CREDIT_NOTE: 'AVOIR',
      RETURN_NOTE: 'BON DE RETOUR',
      RECEIPT: 'RECU',
    };
    return titles[documentType] || 'DOCUMENT';
  }

  private async resolveImages(
    schema: Record<string, unknown>,
    data: GenericDocumentTemplateData,
    options: TemplateRenderOptions,
  ): Promise<{
    schema: Record<string, unknown>;
    data: GenericDocumentTemplateData;
  }> {
    return this.imageResolver.resolveTemplateImages(schema, data, options);
  }
}
