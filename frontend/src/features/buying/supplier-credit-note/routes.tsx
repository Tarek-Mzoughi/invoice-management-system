import React from 'react';
import {
  SupplierCreditNoteCreateForm,
  SupplierCreditNotePortal,
  SupplierCreditNoteUpdateForm
} from '@/components/buying/supplier-credit-note';
import {
  BuyingDocumentRouteFrame,
  BuyingPortalRouteFrame,
  useBuyingFirmId,
  useBuyingRouteId
} from '@/features/buying/shared/navigation';

export const BuyingSupplierCreditNoteListRoute = () => (
  <BuyingPortalRouteFrame>
    <SupplierCreditNotePortal />
  </BuyingPortalRouteFrame>
);

export const BuyingSupplierCreditNoteCreateRoute = () => {
  const firmId = useBuyingFirmId();

  return (
    <BuyingDocumentRouteFrame>
      <SupplierCreditNoteCreateForm firmId={firmId} />
    </BuyingDocumentRouteFrame>
  );
};

export const BuyingSupplierCreditNoteUpdateRoute = () => {
  const supplierCreditNoteId = useBuyingRouteId();

  return (
    <BuyingDocumentRouteFrame>
      <SupplierCreditNoteUpdateForm supplierCreditNoteId={supplierCreditNoteId} />
    </BuyingDocumentRouteFrame>
  );
};
