import { Injectable, NotFoundException } from '@nestjs/common';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from 'src/modules/document-template/enums/document-template-document-type.enum';
import {
  GenericDocumentTemplateData,
  TemplateEngineService,
} from 'src/modules/document-template/interfaces/template-engine.interface';
import { PaymentReceiptTemplateDataMapper } from 'src/modules/document-template/services/data-mappers/payment-receipt-template-data.mapper';
import { DocumentTemplateRendererService } from 'src/modules/document-template/services/document-template-renderer.service';
import { DocumentTemplateService } from 'src/modules/document-template/services/document-template.service';
import { TemplateImageResolverService } from 'src/modules/document-template/services/template-image-resolver.service';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { createDefaultPaymentReceiptTemplateSchema } from '../templates/payment-receipt-default-template';

export interface PaymentReceiptPdfResult {
  pdfBuffer: Buffer;
  filename: string;
}

@Injectable()
export class PaymentReceiptPdfService {
  constructor(
    private readonly documentTemplateService: DocumentTemplateService,
    private readonly documentTemplateRendererService: DocumentTemplateRendererService,
    private readonly templateEngineService: TemplateEngineService,
    private readonly templateImageResolverService: TemplateImageResolverService,
    private readonly paymentReceiptMapper: PaymentReceiptTemplateDataMapper,
    private readonly tenantContext: TenantContextService,
  ) {}

  async generateReceiptPdf(
    paymentId: number,
    userId?: string,
  ): Promise<PaymentReceiptPdfResult> {
    const authenticatedCabinetId = userId
      ? await this.tenantContext.getCurrentCabinetIdOrFail(userId)
      : undefined;
    const data = await this.paymentReceiptMapper.map(
      paymentId,
      authenticatedCabinetId,
    );
    const cabinetId = this.resolveCabinetId(data);
    const filename = this.buildFilename(data, paymentId);
    const defaultTemplate =
      await this.documentTemplateService.findDefaultByDocumentType(
        DOCUMENT_TEMPLATE_DOCUMENT_TYPE.RECEIPT,
        cabinetId,
      );

    if (defaultTemplate?.templateSchema) {
      const pdfBuffer =
        await this.documentTemplateRendererService.generateDocument(
          {
            documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.RECEIPT,
            documentId: paymentId,
            cabinetId,
            storeGeneratedDocument: false,
          },
          userId,
        );
      return { pdfBuffer, filename };
    }

    const schema = createDefaultPaymentReceiptTemplateSchema();
    const resolved =
      await this.templateImageResolverService.resolveTemplateImages(
        schema,
        data,
        {
          documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.RECEIPT,
          filename,
        },
      );
    const pdfBuffer = await this.templateEngineService.generatePdf(
      resolved.schema,
      resolved.data,
      {
        documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.RECEIPT,
        filename,
      },
    );

    return { pdfBuffer, filename };
  }

  private resolveCabinetId(data: GenericDocumentTemplateData): number {
    const company = data.company as Record<string, unknown> | undefined;
    const parsed = Number(company?.id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new NotFoundException('Payment not found');
    }
    return parsed;
  }

  private buildFilename(
    data: GenericDocumentTemplateData,
    paymentId: number,
  ): string {
    const payment = data.payment as Record<string, unknown> | undefined;
    const reference = String(payment?.reference || payment?.number || paymentId)
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `RECU-PAIEMENT-${reference || paymentId}.pdf`;
  }
}
