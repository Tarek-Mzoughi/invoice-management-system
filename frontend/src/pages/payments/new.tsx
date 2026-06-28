import { UnifiedPaymentWorkflowPage } from '@/components/payment/workflow/UnifiedPaymentWorkflowPage';
import { InvoicingDocumentRouteFrame } from '@/features/invoicing/shared/navigation/frames';

export { getInvoicingPageServerSideProps as getServerSideProps } from '@/features/invoicing/shared/navigation/page-props';

export default function NewPaymentPage() {
  return (
    <InvoicingDocumentRouteFrame>
      <UnifiedPaymentWorkflowPage mode="create" />
    </InvoicingDocumentRouteFrame>
  );
}
