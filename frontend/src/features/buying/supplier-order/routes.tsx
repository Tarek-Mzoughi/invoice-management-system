import React from 'react';
import {
  SupplierOrderCreateForm,
  SupplierOrderPortal,
  SupplierOrderUpdateForm
} from '@/components/buying/supplier-order';
import {
  BuyingDocumentRouteFrame,
  BuyingPortalRouteFrame,
  useBuyingFirmId,
  useBuyingRouteId
} from '@/features/buying/shared/navigation';

export const BuyingSupplierOrderListRoute = () => (
  <BuyingPortalRouteFrame>
    <SupplierOrderPortal />
  </BuyingPortalRouteFrame>
);

export const BuyingSupplierOrderCreateRoute = () => {
  const firmId = useBuyingFirmId();

  return (
    <BuyingDocumentRouteFrame>
      <SupplierOrderCreateForm firmId={firmId} />
    </BuyingDocumentRouteFrame>
  );
};

export const BuyingSupplierOrderUpdateRoute = () => {
  const supplierOrderId = useBuyingRouteId();

  return (
    <BuyingDocumentRouteFrame>
      <SupplierOrderUpdateForm supplierOrderId={supplierOrderId} />
    </BuyingDocumentRouteFrame>
  );
};
