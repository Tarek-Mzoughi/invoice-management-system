import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../../enums/document-template-document-type.enum';
import { BaseDocumentTemplateDataMapper } from './base-document-template-data.mapper';
import { GoodsIssueNoteService } from 'src/modules/goods-issue-note/services/goods-issue-note.service';

@Injectable()
export class GoodsIssueNoteTemplateDataMapper extends BaseDocumentTemplateDataMapper {
  readonly documentType = DOCUMENT_TEMPLATE_DOCUMENT_TYPE.GOODS_ISSUE_NOTE;
  readonly defaultTitle = 'BON DE SORTIE';
  readonly entriesKey = 'articleGoodsIssueNoteEntries';
  readonly metaDataKey = 'goodsIssueNoteMetaData';

  constructor(
    @Inject(forwardRef(() => GoodsIssueNoteService))
    goodsIssueNoteService: GoodsIssueNoteService,
  ) {
    super(goodsIssueNoteService);
  }

  protected getEntrySuffix(): string {
    return 'GoodsIssueNoteEntry';
  }
}
