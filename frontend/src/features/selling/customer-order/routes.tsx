import React from 'react';
import { CustomerOrderCreateForm } from '@/components/selling/customer-order/CustomerOrderCreateForm';
import { CustomerOrderPortal } from '@/components/selling/customer-order/CustomerOrderPortal';
import { CustomerOrderUpdateForm } from '@/components/selling/customer-order/CustomerOrderUpdateForm';
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

const customerOrderRouteConfig: SellingDocumentRouteConfig = {
  listPath: '/selling/customer-orders',
  createPath: '/selling/new-customer-order',
  detailPath: '/selling/customer-order'
};

const customerOrderPortalConfig: SellingPortalConfig = {
  listPath: customerOrderRouteConfig.listPath,
  portalClassName: 'py-6'
};

export const SellingCustomerOrderListRoute = () => (
  <SellingPortalRouteFrame>
    <CustomerOrderPortal className={customerOrderPortalConfig.portalClassName} />
  </SellingPortalRouteFrame>
);

export const SellingCustomerOrderCreateRoute = () => {
  const firmId = useSellingFirmId();

  return (
    <SellingDocumentRouteFrame>
      <CustomerOrderCreateForm firmId={firmId} listPath={customerOrderRouteConfig.listPath} />
    </SellingDocumentRouteFrame>
  );
};

export const SellingCustomerOrderUpdateRoute = () => {
  const customerOrderId = useSellingRouteId();

  return (
    <SellingDocumentRouteFrame>
      <CustomerOrderUpdateForm
        customerOrderId={customerOrderId}
        listPath={customerOrderRouteConfig.listPath}
      />
    </SellingDocumentRouteFrame>
  );
};
