import { ReturnNoteUpdateForm } from '@/components/buying/supplier-return-note/ReturnNoteUpdateForm';

interface SupplierReturnNoteUpdateFormProps {
  supplierReturnNoteId: string;
}

export const SupplierReturnNoteUpdateForm = ({
  supplierReturnNoteId
}: SupplierReturnNoteUpdateFormProps) => (
  <ReturnNoteUpdateForm
    returnNoteId={supplierReturnNoteId}
    listPath="/buying/retours-fournisseurs"
  />
);
