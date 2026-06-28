import { InvoiceCreateForm } from '@/components/buying/purchase-invoice/InvoiceCreateForm';

interface PurchaseInvoiceCreateFormProps {
  firmId?: string;
}

export const PurchaseInvoiceCreateForm = ({ firmId }: PurchaseInvoiceCreateFormProps) => (
  <InvoiceCreateForm firmId={firmId} listPath="/buying/factures-achat" />
);
