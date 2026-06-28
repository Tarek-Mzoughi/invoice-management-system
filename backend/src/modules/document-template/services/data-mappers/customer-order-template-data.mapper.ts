import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../../enums/document-template-document-type.enum';
import { BaseDocumentTemplateDataMapper } from './base-document-template-data.mapper';
import { CustomerOrderService } from 'src/modules/customer-order/services/customer-order.service';

@Injectable()
export class CustomerOrderTemplateDataMapper extends BaseDocumentTemplateDataMapper {
  readonly documentType = DOCUMENT_TEMPLATE_DOCUMENT_TYPE.CUSTOMER_ORDER;
  readonly defaultTitle = 'COMMANDE CLIENT';
  readonly entriesKey = 'articleCustomerOrderEntries';
  readonly metaDataKey = 'customerOrderMetaData';

  constructor(
    @Inject(forwardRef(() => CustomerOrderService))
    customerOrderService: CustomerOrderService,
  ) {
    super(customerOrderService);
  }

  protected getEntrySuffix(): string {
    return 'CustomerOrderEntry';
  }
}
