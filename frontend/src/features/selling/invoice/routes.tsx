import React from 'react';
import { InvoiceCreateForm } from '@/components/selling/invoice/InvoiceCreateForm';
import { InvoicePortal } from '@/components/selling/invoice/InvoicePortal';
import { InvoiceUpdateForm } from '@/components/selling/invoice/InvoiceUpdateForm';
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

const invoiceRouteConfig: SellingDocumentRouteConfig = {
  listPath: '/selling/invoices',
  createPath: '/selling/new-invoice',
  detailPath: '/selling/invoice'
};

const invoicePortalConfig: SellingPortalConfig = {
  listPath: invoiceRouteConfig.listPath,
  portalClassName: 'py-6'
};

export const SellingInvoiceListRoute = () => (
  <SellingPortalRouteFrame>
    <InvoicePortal className={invoicePortalConfig.portalClassName} />
  </SellingPortalRouteFrame>
);

export const SellingInvoiceCreateRoute = () => {
  const firmId = useSellingFirmId();

  return (
    <SellingDocumentRouteFrame>
      <InvoiceCreateForm firmId={firmId} listPath={invoiceRouteConfig.listPath} />
    </SellingDocumentRouteFrame>
  );
};

export const SellingInvoiceUpdateRoute = () => {
  const invoiceId = useSellingRouteId();

  return (
    <SellingDocumentRouteFrame>
      <InvoiceUpdateForm invoiceId={invoiceId} listPath={invoiceRouteConfig.listPath} />
    </SellingDocumentRouteFrame>
  );
};
