import React from 'react';
import { GenericDeleteDialog } from '@/features/invoicing/shared/dialogs';

interface GoodsIssueNoteDeleteDialogProps {
  className?: string;
  id?: number;
  sequential: string;
  open: boolean;
  deleteGoodsIssueNote: () => void;
  isDeletionPending?: boolean;
  onClose: () => void;
}

export const GoodsIssueNoteDeleteDialog: React.FC<GoodsIssueNoteDeleteDialogProps> = ({
  id,
  sequential,
  open,
  deleteGoodsIssueNote,
  isDeletionPending,
  onClose,
  className
}) => (
  <GenericDeleteDialog
    id={id}
    sequential={sequential}
    documentLabel="le bon de sortie"
    open={open}
    onDelete={deleteGoodsIssueNote}
    isPending={isDeletionPending}
    onClose={onClose}
    className={className}
  />
);
