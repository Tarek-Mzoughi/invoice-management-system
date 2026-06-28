import { CreditNoteCreateForm } from '@/components/buying/supplier-credit-note/CreditNoteCreateForm';

interface SupplierCreditNoteCreateFormProps {
  firmId?: string;
}

export const SupplierCreditNoteCreateForm = ({ firmId }: SupplierCreditNoteCreateFormProps) => (
  <CreditNoteCreateForm firmId={firmId} listPath="/buying/avoirs-fournisseurs" />
);
