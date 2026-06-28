import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../../enums/document-template-document-type.enum';
import { BaseDocumentTemplateDataMapper } from './base-document-template-data.mapper';
import { ReturnNoteService } from 'src/modules/return-note/services/return-note.service';

@Injectable()
export class ReturnNoteTemplateDataMapper extends BaseDocumentTemplateDataMapper {
  readonly documentType = DOCUMENT_TEMPLATE_DOCUMENT_TYPE.RETURN_NOTE;
  readonly defaultTitle = 'BON DE RETOUR';
  readonly entriesKey = 'articleReturnNoteEntries';
  readonly metaDataKey = 'returnNoteMetaData';

  constructor(
    @Inject(forwardRef(() => ReturnNoteService))
    returnNoteService: ReturnNoteService,
  ) {
    super(returnNoteService);
  }

  protected getEntrySuffix(): string {
    return 'ReturnNoteEntry';
  }
}
