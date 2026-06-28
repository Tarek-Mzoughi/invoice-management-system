import { InvoicePortal } from '@/components/buying/purchase-invoice/InvoicePortal';

interface PurchaseInvoicePortalProps {
  className?: string;
}

export const PurchaseInvoicePortal = ({ className = 'py-6' }: PurchaseInvoicePortalProps) => (
  <InvoicePortal
    className={className}
    rootPath="/buying"
    listPath="/buying/factures-achat"
    newPath="/buying/nouvelle-facture-achat"
    detailPathPrefix="/buying/facture-achat"
  />
);
