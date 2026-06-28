import React from 'react';
import { GenericDeleteDialog } from '@/features/invoicing/shared/dialogs';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';

interface InvoiceDeleteDialogProps {
  className?: string;
  id?: number;
  sequential: string;
  open: boolean;
  deleteInvoice: () => void;
  isDeletionPending?: boolean;
  onClose: () => void;
}

export const InvoiceDeleteDialog: React.FC<InvoiceDeleteDialogProps> = ({
  id,
  sequential,
  open,
  deleteInvoice,
  isDeletionPending,
  onClose,
  className
}) => {
  const invoiceLabels = useSellingInvoiceLabels();

  return (
    <GenericDeleteDialog
      id={id}
      sequential={sequential}
      documentLabel={`la ${invoiceLabels.singular.toLowerCase()}`}
      open={open}
      onDelete={deleteInvoice}
      isPending={isDeletionPending}
      onClose={onClose}
      className={className}
    />
  );
};
