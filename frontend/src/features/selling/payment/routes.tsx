import React from 'react';
import { PaymentPortal } from '@/components/payment/PaymentPortal';
import { PaymentWorkflowForm } from '@/components/payment/workflow/PaymentWorkflowForm';
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
import { ACTIVITY_TYPE } from '@/types';

const paymentRouteConfig: SellingDocumentRouteConfig = {
  listPath: '/selling/payments',
  createPath: '/selling/new-payment',
  detailPath: '/payments'
};

const paymentPortalConfig: SellingPortalConfig = {
  listPath: paymentRouteConfig.listPath,
  portalClassName: 'p-8'
};

export const SellingPaymentListRoute = () => (
  <SellingPortalRouteFrame className={paymentPortalConfig.portalClassName}>
    <PaymentPortal
      detailPathPrefix="/payments"
      listPath={paymentRouteConfig.listPath}
      newPath="/payments/new?type=selling"
      rootPath="/selling"
      scope="selling"
    />
  </SellingPortalRouteFrame>
);

export const SellingPaymentCreateRoute = () => {
  const firmId = useSellingFirmId();

  return (
    <SellingDocumentRouteFrame>
      <PaymentWorkflowForm
        activityType={ACTIVITY_TYPE.SELLING}
        firmId={firmId}
        listPath={paymentRouteConfig.listPath}
        mode="create"
      />
    </SellingDocumentRouteFrame>
  );
};

export const SellingPaymentUpdateRoute = () => {
  const paymentId = useSellingRouteId();

  return (
    <SellingDocumentRouteFrame>
      <PaymentWorkflowForm
        activityType={ACTIVITY_TYPE.SELLING}
        listPath={paymentRouteConfig.listPath}
        mode="update"
        paymentId={paymentId}
      />
    </SellingDocumentRouteFrame>
  );
};
