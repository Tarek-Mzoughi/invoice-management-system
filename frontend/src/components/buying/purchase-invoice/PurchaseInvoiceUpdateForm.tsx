import { InvoiceUpdateForm } from '@/components/buying/purchase-invoice/InvoiceUpdateForm';

interface PurchaseInvoiceUpdateFormProps {
  invoiceId: string;
}

export const PurchaseInvoiceUpdateForm = ({ invoiceId }: PurchaseInvoiceUpdateFormProps) => (
  <InvoiceUpdateForm invoiceId={invoiceId} listPath="/buying/factures-achat" />
);
