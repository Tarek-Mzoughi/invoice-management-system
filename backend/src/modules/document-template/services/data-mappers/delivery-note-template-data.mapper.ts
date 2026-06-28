import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../../enums/document-template-document-type.enum';
import { BaseDocumentTemplateDataMapper } from './base-document-template-data.mapper';
import { DeliveryNoteService } from 'src/modules/delivery-note/services/delivery-note.service';

@Injectable()
export class DeliveryNoteTemplateDataMapper extends BaseDocumentTemplateDataMapper {
  readonly documentType = DOCUMENT_TEMPLATE_DOCUMENT_TYPE.DELIVERY_NOTE;
  readonly defaultTitle = 'BON DE LIVRAISON';
  readonly entriesKey = 'articleDeliveryNoteEntries';
  readonly metaDataKey = 'deliveryNoteMetaData';

  constructor(
    @Inject(forwardRef(() => DeliveryNoteService))
    deliveryNoteService: DeliveryNoteService,
  ) {
    super(deliveryNoteService);
  }

  protected getEntrySuffix(): string {
    return 'DeliveryNoteEntry';
  }
}
