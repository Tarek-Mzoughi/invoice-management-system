import React from 'react';
import { GenericDuplicateDialog } from '@/features/invoicing/shared/dialogs';
interface DeliveryNoteDuplicateDialogProps {
  className?: string;
  id: number;
  sequential: string;
  open: boolean;
  duplicateDeliveryNote: (includeFiles: boolean) => void;
  isDuplicationPending?: boolean;
  scope?: 'selling' | 'buying';
  onClose: () => void;
}
export const DeliveryNoteDuplicateDialog: React.FC<DeliveryNoteDuplicateDialogProps> = ({
  sequential,
  open,
  duplicateDeliveryNote,
  isDuplicationPending,
  scope = 'buying',
  onClose,
  className
}) => (
  <GenericDuplicateDialog
    sequential={sequential}
    documentLabel={'le bon de réception'}
    fileDuplicationLabel="Inclure les fichiers joints"
    open={open}
    onDuplicate={duplicateDeliveryNote}
    isPending={isDuplicationPending}
    onClose={onClose}
    className={className}
  />
);
