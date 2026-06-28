import { CreditNoteUpdateForm } from '@/components/buying/supplier-credit-note/CreditNoteUpdateForm';

interface SupplierCreditNoteUpdateFormProps {
  supplierCreditNoteId: string;
}

export const SupplierCreditNoteUpdateForm = ({
  supplierCreditNoteId
}: SupplierCreditNoteUpdateFormProps) => (
  <CreditNoteUpdateForm
    creditNoteId={supplierCreditNoteId}
    listPath="/buying/avoirs-fournisseurs"
  />
);
