import React from 'react';
import { GenericDeleteDialog } from '@/features/invoicing/shared/dialogs';
interface CreditNoteDeleteDialogProps {
  className?: string;
  id?: number;
  sequential: string;
  open: boolean;
  deleteCreditNote: () => void;
  isDeletionPending?: boolean;
  onClose: () => void;
  scope?: 'selling' | 'buying';
}
export const CreditNoteDeleteDialog: React.FC<CreditNoteDeleteDialogProps> = ({
  id,
  sequential,
  open,
  deleteCreditNote,
  isDeletionPending,
  onClose,
  className,
  scope = 'buying'
}) => (
  <GenericDeleteDialog
    id={id}
    sequential={sequential}
    documentLabel={"l'avoir fournisseur"}
    open={open}
    onDelete={deleteCreditNote}
    isPending={isDeletionPending}
    onClose={onClose}
    className={className}
  />
);
