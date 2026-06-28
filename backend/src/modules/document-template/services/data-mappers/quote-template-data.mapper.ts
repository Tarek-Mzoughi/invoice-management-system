import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../../enums/document-template-document-type.enum';
import { BaseDocumentTemplateDataMapper } from './base-document-template-data.mapper';
import { QuotationService } from 'src/modules/quotation/services/quotation.service';

@Injectable()
export class QuoteTemplateDataMapper extends BaseDocumentTemplateDataMapper {
  readonly documentType = DOCUMENT_TEMPLATE_DOCUMENT_TYPE.QUOTE;
  readonly defaultTitle = 'DEVIS';
  readonly entriesKey = 'articleQuotationEntries';
  readonly metaDataKey = 'quotationMetaData';

  constructor(
    @Inject(forwardRef(() => QuotationService))
    quotationService: QuotationService,
  ) {
    super(quotationService);
  }

  protected getEntrySuffix(): string {
    return 'QuotationEntry';
  }
}
