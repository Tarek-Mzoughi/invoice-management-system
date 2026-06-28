import { BadRequestException, Injectable } from '@nestjs/common';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../../enums/document-template-document-type.enum';
import { GenericDocumentTemplateData } from '../../interfaces/template-engine.interface';
import { TemplateDocumentDataMapper } from '../../interfaces/template-document-data-mapper.interface';
import { DeliveryNoteTemplateDataMapper } from './delivery-note-template-data.mapper';
import { getSampleTemplateData } from './sample-template-data';
import { InvoiceTemplateDataMapper } from './invoice-template-data.mapper';
import { PaymentReceiptTemplateDataMapper } from './payment-receipt-template-data.mapper';
import { QuoteTemplateDataMapper } from './quote-template-data.mapper';
import { CustomerOrderTemplateDataMapper } from './customer-order-template-data.mapper';
import { GoodsIssueNoteTemplateDataMapper } from './goods-issue-note-template-data.mapper';
import { CreditNoteTemplateDataMapper } from './credit-note-template-data.mapper';
import { ReturnNoteTemplateDataMapper } from './return-note-template-data.mapper';

@Injectable()
export class TemplateDataMapperRegistry {
  private readonly mappers: Map<
    DOCUMENT_TEMPLATE_DOCUMENT_TYPE,
    TemplateDocumentDataMapper
  >;

  constructor(
    invoiceMapper: InvoiceTemplateDataMapper,
    quoteMapper: QuoteTemplateDataMapper,
    deliveryNoteMapper: DeliveryNoteTemplateDataMapper,
    paymentReceiptMapper: PaymentReceiptTemplateDataMapper,
    customerOrderMapper: CustomerOrderTemplateDataMapper,
    goodsIssueNoteMapper: GoodsIssueNoteTemplateDataMapper,
    creditNoteMapper: CreditNoteTemplateDataMapper,
    returnNoteMapper: ReturnNoteTemplateDataMapper,
  ) {
    this.mappers = new Map(
      [
        invoiceMapper,
        quoteMapper,
        deliveryNoteMapper,
        paymentReceiptMapper,
        customerOrderMapper,
        goodsIssueNoteMapper,
        creditNoteMapper,
        returnNoteMapper,
      ].map((mapper) => [mapper.documentType, mapper]),
    );
  }

  async map(
    documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE,
    documentId?: number,
    cabinetId?: number,
  ): Promise<GenericDocumentTemplateData> {
    const mapper = this.mappers.get(documentType);
    if (!mapper) {
      if (documentId) {
        throw new BadRequestException(
          `No document template data mapper configured for ${documentType}`,
        );
      }
      return getSampleTemplateData(documentType);
    }
    return mapper.map(documentId, cabinetId);
  }
}
