import React from 'react';
import { PaymentPortal } from '@/components/payment/PaymentPortal';
import { PaymentWorkflowForm } from '@/components/payment/workflow/PaymentWorkflowForm';
import {
  BuyingDocumentRouteFrame,
  BuyingPortalRouteFrame,
  useBuyingFirmId,
  useBuyingRouteId
} from '@/features/buying/shared/navigation';
import { ACTIVITY_TYPE } from '@/types';

export const BuyingPaymentListRoute = () => (
  <BuyingPortalRouteFrame className="p-8">
    <PaymentPortal
      detailPathPrefix="/payments"
      listPath="/buying/payments"
      newPath="/payments/new?type=buying"
      rootPath="/buying"
      scope="buying"
    />
  </BuyingPortalRouteFrame>
);

export const BuyingPaymentCreateRoute = () => {
  const firmId = useBuyingFirmId();

  return (
    <BuyingDocumentRouteFrame>
      <PaymentWorkflowForm
        activityType={ACTIVITY_TYPE.BUYING}
        firmId={firmId}
        listPath="/buying/payments"
        mode="create"
      />
    </BuyingDocumentRouteFrame>
  );
};

export const BuyingPaymentUpdateRoute = () => {
  const paymentId = useBuyingRouteId();

  return (
    <BuyingDocumentRouteFrame>
      <PaymentWorkflowForm
        activityType={ACTIVITY_TYPE.BUYING}
        listPath="/buying/payments"
        mode="update"
        paymentId={paymentId}
      />
    </BuyingDocumentRouteFrame>
  );
};
