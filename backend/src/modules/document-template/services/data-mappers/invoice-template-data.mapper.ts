import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../../enums/document-template-document-type.enum';
import { BaseDocumentTemplateDataMapper } from './base-document-template-data.mapper';
import { InvoiceService } from 'src/modules/invoice/services/invoice.service';

@Injectable()
export class InvoiceTemplateDataMapper extends BaseDocumentTemplateDataMapper {
  readonly documentType = DOCUMENT_TEMPLATE_DOCUMENT_TYPE.INVOICE;
  readonly defaultTitle = 'FACTURE';
  readonly entriesKey = 'articleInvoiceEntries';
  readonly metaDataKey = 'invoiceMetaData';

  constructor(
    @Inject(forwardRef(() => InvoiceService))
    invoiceService: InvoiceService,
  ) {
    super(invoiceService);
  }

  protected getEntrySuffix(): string {
    return 'InvoiceEntry';
  }
}
