import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import React from 'react';

export const useDocumentTransformation = (
  setDocument: (doc: any, firms?: any, bankAccounts?: any) => void,
  setArticles: (articles: any) => void,
  setControls: (controls: any) => void,
  firms: any,
  bankAccounts: any
) => {
  const router = useRouter();
  const { sourceId, sourceType } = router.query;

  const { data: sourceData, isLoading } = useQuery({
    queryKey: ['source-document', sourceId, sourceType],
    queryFn: async () => {
      if (!sourceId || !sourceType) return null;
      const id = parseInt(sourceId as string);
      switch (sourceType as DOCUMENT_TYPE) {
        case DOCUMENT_TYPE.QUOTATION:
          return api.quotation.findOne(id);
        case DOCUMENT_TYPE.CUSTOMER_ORDER:
          return api.customerOrder.findOne(id);
        case DOCUMENT_TYPE.INVOICE:
          return api.invoice.findOne(id);
        case DOCUMENT_TYPE.DELIVERY_NOTE:
          return api.deliveryNote.findOne(id);
        case DOCUMENT_TYPE.GOODS_ISSUE_NOTE:
          return api.goodsIssueNote.findOne(id);
        default:
          return null;
      }
    },
    enabled: !!sourceId && !!sourceType
  });

  React.useEffect(() => {
    if (sourceData) {
      // Pre-fill the form with source data
      // Map entries correctly based on source type
      let entries: any[] = [];
      let metaData: any = {};

      if ('articleQuotationEntries' in sourceData) {
        entries = sourceData.articleQuotationEntries || [];
        metaData = sourceData.quotationMetaData;
      } else if ('articleInvoiceEntries' in sourceData) {
        entries = sourceData.articleInvoiceEntries || [];
        metaData = sourceData.invoiceMetaData;
      } else if ('articleCustomerOrderEntries' in sourceData) {
        entries = sourceData.articleCustomerOrderEntries || [];
        metaData = sourceData.customerOrderMetaData;
      } else if ('articleDeliveryNoteEntries' in sourceData) {
        entries = sourceData.articleDeliveryNoteEntries || [];
        metaData = sourceData.deliveryNoteMetaData;
      } else if ('articleGoodsIssueNoteEntries' in sourceData) {
        entries = sourceData.articleGoodsIssueNoteEntries || [];
        metaData = sourceData.goodsIssueNoteMetaData;
      }

      setDocument(
        {
          ...sourceData,
          id: undefined, // It's a new document
          sequential: undefined,
          date: new Date().toISOString(),
          status: undefined, // Will be set by manager factory or onSubmit
          [`${sourceType}Id`]: sourceData.id // Set source ID for transformation
        },
        firms,
        bankAccounts
      );

      setArticles(entries);

      if (metaData) {
        setControls({
          isBankAccountDetailsHidden: !metaData.hasBankingDetails,
          isInvoiceAddressHidden: !metaData.showInvoiceAddress,
          isDeliveryAddressHidden: !metaData.showDeliveryAddress,
          isGeneralConditionsHidden: !metaData.hasGeneralConditions,
          isArticleDescriptionHidden: !metaData.showArticleDescription,
          isPricesHidden: metaData.showPrices === false
        });
      }
    }
  }, [sourceData, firms, bankAccounts]);

  return { isLoading };
};
