import { CreditNotePortal } from '@/components/buying/supplier-credit-note/CreditNotePortal';

interface SupplierCreditNotePortalProps {
  className?: string;
}

export const SupplierCreditNotePortal = ({ className = 'py-6' }: SupplierCreditNotePortalProps) => (
  <CreditNotePortal
    className={className}
    rootPath="/buying"
    listPath="/buying/avoirs-fournisseurs"
    newPath="/buying/nouvel-avoir-fournisseur"
    detailPathPrefix="/buying/avoir-fournisseur"
  />
);
