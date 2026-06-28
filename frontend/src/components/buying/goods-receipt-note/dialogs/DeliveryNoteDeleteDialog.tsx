import React from 'react';
import { GenericDeleteDialog } from '@/features/invoicing/shared/dialogs';
interface DeliveryNoteDeleteDialogProps {
  className?: string;
  id?: number;
  sequential: string;
  open: boolean;
  deleteDeliveryNote: () => void;
  isDeletionPending?: boolean;
  scope?: 'selling' | 'buying';
  onClose: () => void;
}
export const DeliveryNoteDeleteDialog: React.FC<DeliveryNoteDeleteDialogProps> = ({
  id,
  sequential,
  open,
  deleteDeliveryNote,
  isDeletionPending,
  scope = 'buying',
  onClose,
  className
}) => (
  <GenericDeleteDialog
    id={id}
    sequential={sequential}
    documentLabel={'le bon de réception'}
    open={open}
    onDelete={deleteDeliveryNote}
    isPending={isDeletionPending}
    onClose={onClose}
    className={className}
  />
);
