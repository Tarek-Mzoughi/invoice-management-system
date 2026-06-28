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
  scope = 'selling',
  onClose,
  className
}) => (
  <GenericDuplicateDialog
    sequential={sequential}
    documentLabel={'le bon de livraison'}
    fileDuplicationLabel="Inclure les fichiers joints"
    open={open}
    onDuplicate={duplicateDeliveryNote}
    isPending={isDuplicationPending}
    onClose={onClose}
    className={className}
  />
);
