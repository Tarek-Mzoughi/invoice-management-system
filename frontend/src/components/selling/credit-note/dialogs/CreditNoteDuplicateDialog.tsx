import React from 'react';
import { GenericDuplicateDialog } from '@/features/invoicing/shared/dialogs';
interface CreditNoteDuplicateDialogProps {
  className?: string;
  id: number;
  sequential: string;
  open: boolean;
  duplicateCreditNote: (includeFiles: boolean) => void;
  isDuplicationPending?: boolean;
  onClose: () => void;
  scope?: 'selling' | 'buying';
}
export const CreditNoteDuplicateDialog: React.FC<CreditNoteDuplicateDialogProps> = ({
  sequential,
  open,
  duplicateCreditNote,
  isDuplicationPending,
  onClose,
  className,
  scope = 'selling'
}) => (
  <GenericDuplicateDialog
    sequential={sequential}
    documentLabel={'la note de crédit'}
    fileDuplicationLabel="Inclure les fichiers joints"
    open={open}
    onDuplicate={duplicateCreditNote}
    isPending={isDuplicationPending}
    onClose={onClose}
    className={className}
  />
);
