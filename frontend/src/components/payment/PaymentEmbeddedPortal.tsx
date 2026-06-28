import React from 'react';
import { useTranslation } from 'react-i18next';

import type { BreadcrumbRoute } from '@/context/BreadcrumbContext';
import { PaymentPortal } from './PaymentPortal';
import { getPaymentNewPath } from './utils/payment-navigation';

interface PaymentEmbeddedPortalProps {
  className?: string;
  firmId?: number;
  interlocutorId?: number;
  routes?: BreadcrumbRoute[];
}

export const PaymentEmbeddedPortal: React.FC<PaymentEmbeddedPortalProps> = ({
  className,
  firmId,
  interlocutorId,
  routes
}) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const firmPaymentPath = firmId ? `/contacts/firm/${firmId}/payments` : '/payments';
  const breadcrumbRoutes = routes
    ? [...routes, { title: tInvoicing('payment.plural'), href: firmPaymentPath }]
    : undefined;

  return (
    <PaymentPortal
      className={className}
      firmId={firmId}
      interlocutorId={interlocutorId}
      listPath={firmPaymentPath}
      rootPath="/contacts/firms"
      newPath={getPaymentNewPath(undefined, firmId)}
      detailPathPrefix="/payments"
      scope="all"
      managePageChrome={false}
      breadcrumbRoutes={breadcrumbRoutes}
    />
  );
};
