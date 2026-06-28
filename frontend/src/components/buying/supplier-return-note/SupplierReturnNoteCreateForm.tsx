import { ReturnNoteCreateForm } from '@/components/buying/supplier-return-note/ReturnNoteCreateForm';

interface SupplierReturnNoteCreateFormProps {
  firmId?: string;
}

export const SupplierReturnNoteCreateForm = ({ firmId }: SupplierReturnNoteCreateFormProps) => (
  <ReturnNoteCreateForm firmId={firmId} listPath="/buying/retours-fournisseurs" />
);
