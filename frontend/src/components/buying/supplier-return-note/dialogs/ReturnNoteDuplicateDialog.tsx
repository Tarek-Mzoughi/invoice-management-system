import React from 'react';
import { GenericDuplicateDialog } from '@/features/invoicing/shared/dialogs';
interface ReturnNoteDuplicateDialogProps {
  className?: string;
  id: number;
  sequential: string;
  open: boolean;
  duplicateReturnNote: (includeFiles: boolean) => void;
  isDuplicationPending?: boolean;
  onClose: () => void;
  scope?: 'selling' | 'buying';
}
export const ReturnNoteDuplicateDialog: React.FC<ReturnNoteDuplicateDialogProps> = ({
  sequential,
  open,
  duplicateReturnNote,
  isDuplicationPending,
  onClose,
  className,
  scope = 'buying'
}) => (
  <GenericDuplicateDialog
    sequential={sequential}
    documentLabel={'le bon de retour fournisseur'}
    fileDuplicationLabel="Inclure les fichiers joints"
    open={open}
    onDuplicate={duplicateReturnNote}
    isPending={isDuplicationPending}
    onClose={onClose}
    className={className}
  />
);
