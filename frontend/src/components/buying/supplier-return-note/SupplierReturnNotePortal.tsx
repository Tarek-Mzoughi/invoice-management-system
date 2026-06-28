import { ReturnNotePortal } from '@/components/buying/supplier-return-note/ReturnNotePortal';

interface SupplierReturnNotePortalProps {
  className?: string;
}

export const SupplierReturnNotePortal = ({ className = 'py-6' }: SupplierReturnNotePortalProps) => (
  <ReturnNotePortal
    className={className}
    rootPath="/buying"
    listPath="/buying/retours-fournisseurs"
    newPath="/buying/nouveau-retour-fournisseur"
    detailPathPrefix="/buying/retour-fournisseur"
    linkedInvoicePathPrefix="/buying/facture-achat"
  />
);
