import React from 'react';
import { GenericDuplicateDialog } from '@/features/invoicing/shared/dialogs';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';

interface InvoiceDuplicateDialogProps {
  className?: string;
  id: number;
  sequential: string;
  open: boolean;
  duplicateInvoice: (includeFiles: boolean) => void;
  isDuplicationPending?: boolean;
  onClose: () => void;
}

export const InvoiceDuplicateDialog: React.FC<InvoiceDuplicateDialogProps> = ({
  sequential,
  open,
  duplicateInvoice,
  isDuplicationPending,
  onClose,
  className
}) => {
  const invoiceLabels = useSellingInvoiceLabels();

  return (
    <GenericDuplicateDialog
      sequential={sequential}
      documentLabel={`la ${invoiceLabels.singular.toLowerCase()}`}
      fileDuplicationLabel="Inclure les fichiers joints"
      open={open}
      onDuplicate={duplicateInvoice}
      isPending={isDuplicationPending}
      onClose={onClose}
      className={className}
    />
  );
};
