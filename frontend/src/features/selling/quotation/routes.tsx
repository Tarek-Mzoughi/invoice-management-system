import React from 'react';
import { QuotationCreateForm } from '@/components/selling/quotation/QuotationCreateForm';
import { QuotationPortal } from '@/components/selling/quotation/QuotationPortal';
import { QuotationUpdateForm } from '@/components/selling/quotation/QuotationUpdateForm';
import {
  SellingDocumentRouteFrame,
  SellingPortalRouteFrame,
  useSellingFirmId,
  useSellingRouteId
} from '@/features/selling/shared/navigation';
import type {
  SellingDocumentRouteConfig,
  SellingPortalConfig
} from '@/features/invoicing/shared/models';

const quotationRouteConfig: SellingDocumentRouteConfig = {
  listPath: '/selling/quotations',
  createPath: '/selling/new-quotation',
  detailPath: '/selling/quotation'
};

const quotationPortalConfig: SellingPortalConfig = {
  listPath: quotationRouteConfig.listPath,
  portalClassName: 'py-6'
};

export const SellingQuotationListRoute = () => (
  <SellingPortalRouteFrame>
    <QuotationPortal className={quotationPortalConfig.portalClassName} />
  </SellingPortalRouteFrame>
);

export const SellingQuotationCreateRoute = () => {
  const firmId = useSellingFirmId();

  return (
    <SellingDocumentRouteFrame>
      <QuotationCreateForm firmId={firmId} listPath={quotationRouteConfig.listPath} />
    </SellingDocumentRouteFrame>
  );
};

export const SellingQuotationUpdateRoute = () => {
  const quotationId = useSellingRouteId();

  return (
    <SellingDocumentRouteFrame>
      <QuotationUpdateForm quotationId={quotationId} listPath={quotationRouteConfig.listPath} />
    </SellingDocumentRouteFrame>
  );
};
