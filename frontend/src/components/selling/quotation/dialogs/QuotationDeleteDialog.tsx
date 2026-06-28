import React from 'react';
import { GenericDeleteDialog } from '@/features/invoicing/shared/dialogs';

interface QuotationDeleteDialogProps {
  className?: string;
  id?: number;
  sequential: string;
  open: boolean;
  deleteQuotation: () => void;
  isDeletionPending?: boolean;
  onClose: () => void;
}

export const QuotationDeleteDialog: React.FC<QuotationDeleteDialogProps> = ({
  id,
  sequential,
  open,
  deleteQuotation,
  isDeletionPending,
  onClose,
  className
}) => (
  <GenericDeleteDialog
    id={id}
    sequential={sequential}
    documentLabel="le devis"
    open={open}
    onDelete={deleteQuotation}
    isPending={isDeletionPending}
    onClose={onClose}
    className={className}
  />
);
