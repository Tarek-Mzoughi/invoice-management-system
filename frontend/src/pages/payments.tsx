import { PaymentPortal } from '@/components/payment/PaymentPortal';
import { InvoicingPortalRouteFrame } from '@/features/invoicing/shared/navigation/frames';

export { getInvoicingPageServerSideProps as getServerSideProps } from '@/features/invoicing/shared/navigation/page-props';

export default function PaymentsPage() {
  return (
    <InvoicingPortalRouteFrame className="p-8">
      <PaymentPortal
        scope="all"
        rootPath="/payments"
        listPath="/payments"
        newPath="/payments/new"
        detailPathPrefix="/payments"
      />
    </InvoicingPortalRouteFrame>
  );
}
