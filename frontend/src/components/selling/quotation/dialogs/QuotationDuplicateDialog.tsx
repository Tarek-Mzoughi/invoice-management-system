import React from 'react';
import { GenericDuplicateDialog } from '@/features/invoicing/shared/dialogs';

interface QuotationDuplicateDialogProps {
  className?: string;
  id: number;
  sequential: string;
  open: boolean;
  duplicateQuotation: (includeFiles: boolean) => void;
  isDuplicationPending?: boolean;
  onClose: () => void;
}

export const QuotationDuplicateDialog: React.FC<QuotationDuplicateDialogProps> = ({
  sequential,
  open,
  duplicateQuotation,
  isDuplicationPending,
  onClose,
  className
}) => (
  <GenericDuplicateDialog
    sequential={sequential}
    documentLabel="le devis"
    fileDuplicationLabel="Inclure les fichiers joints"
    open={open}
    onDuplicate={duplicateQuotation}
    isPending={isDuplicationPending}
    onClose={onClose}
    className={className}
  />
);
