import React from 'react';
import { GenericDeleteDialog } from '@/features/invoicing/shared/dialogs';
interface ReturnNoteDeleteDialogProps {
  className?: string;
  id?: number;
  sequential: string;
  open: boolean;
  deleteReturnNote: () => void;
  isDeletionPending?: boolean;
  onClose: () => void;
  scope?: 'selling' | 'buying';
}
export const ReturnNoteDeleteDialog: React.FC<ReturnNoteDeleteDialogProps> = ({
  id,
  sequential,
  open,
  deleteReturnNote,
  isDeletionPending,
  onClose,
  className,
  scope = 'buying'
}) => (
  <GenericDeleteDialog
    id={id}
    sequential={sequential}
    documentLabel={'le bon de retour fournisseur'}
    open={open}
    onDelete={deleteReturnNote}
    isPending={isDeletionPending}
    onClose={onClose}
    className={className}
  />
);
