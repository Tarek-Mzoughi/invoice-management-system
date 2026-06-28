import React from 'react';
import {
  SupplierReturnNoteCreateForm,
  SupplierReturnNotePortal,
  SupplierReturnNoteUpdateForm
} from '@/components/buying/supplier-return-note';
import {
  BuyingDocumentRouteFrame,
  BuyingPortalRouteFrame,
  useBuyingFirmId,
  useBuyingRouteId
} from '@/features/buying/shared/navigation';

export const BuyingSupplierReturnNoteListRoute = () => (
  <BuyingPortalRouteFrame>
    <SupplierReturnNotePortal />
  </BuyingPortalRouteFrame>
);

export const BuyingSupplierReturnNoteCreateRoute = () => {
  const firmId = useBuyingFirmId();

  return (
    <BuyingDocumentRouteFrame>
      <SupplierReturnNoteCreateForm firmId={firmId} />
    </BuyingDocumentRouteFrame>
  );
};

export const BuyingSupplierReturnNoteUpdateRoute = () => {
  const supplierReturnNoteId = useBuyingRouteId();

  return (
    <BuyingDocumentRouteFrame>
      <SupplierReturnNoteUpdateForm supplierReturnNoteId={supplierReturnNoteId} />
    </BuyingDocumentRouteFrame>
  );
};
