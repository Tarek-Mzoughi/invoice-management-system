import { CustomerOrderPortal } from '@/components/buying/supplier-order/CustomerOrderPortal';

interface SupplierOrderPortalProps {
  className?: string;
}

export const SupplierOrderPortal = ({ className = 'py-6' }: SupplierOrderPortalProps) => (
  <CustomerOrderPortal
    className={className}
    rootPath="/buying"
    listPath="/buying/commandes-fournisseurs"
    newPath="/buying/nouvelle-commande-fournisseur"
    detailPathPrefix="/buying/commande-fournisseur"
    linkedInvoicePathPrefix="/buying/facture-achat"
  />
);
