import React from 'react';
import {
  PurchaseInvoiceCreateForm,
  PurchaseInvoicePortal,
  PurchaseInvoiceUpdateForm
} from '@/components/buying/purchase-invoice';
import {
  BuyingDocumentRouteFrame,
  BuyingPortalRouteFrame,
  useBuyingFirmId,
  useBuyingRouteId
} from '@/features/buying/shared/navigation';

export const BuyingPurchaseInvoiceListRoute = () => (
  <BuyingPortalRouteFrame>
    <PurchaseInvoicePortal />
  </BuyingPortalRouteFrame>
);

export const BuyingPurchaseInvoiceCreateRoute = () => {
  const firmId = useBuyingFirmId();

  return (
    <BuyingDocumentRouteFrame>
      <PurchaseInvoiceCreateForm firmId={firmId} />
    </BuyingDocumentRouteFrame>
  );
};

export const BuyingPurchaseInvoiceUpdateRoute = () => {
  const invoiceId = useBuyingRouteId();

  return (
    <BuyingDocumentRouteFrame>
      <PurchaseInvoiceUpdateForm invoiceId={invoiceId} />
    </BuyingDocumentRouteFrame>
  );
};
