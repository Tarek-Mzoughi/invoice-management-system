import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../../enums/document-template-document-type.enum';
import { BaseDocumentTemplateDataMapper } from './base-document-template-data.mapper';
import { CreditNoteService } from 'src/modules/credit-note/services/credit-note.service';

@Injectable()
export class CreditNoteTemplateDataMapper extends BaseDocumentTemplateDataMapper {
  readonly documentType = DOCUMENT_TEMPLATE_DOCUMENT_TYPE.CREDIT_NOTE;
  readonly defaultTitle = 'AVOIR';
  readonly entriesKey = 'articleCreditNoteEntries';
  readonly metaDataKey = 'creditNoteMetaData';

  constructor(
    @Inject(forwardRef(() => CreditNoteService))
    creditNoteService: CreditNoteService,
  ) {
    super(creditNoteService);
  }

  protected getEntrySuffix(): string {
    return 'CreditNoteEntry';
  }
}
