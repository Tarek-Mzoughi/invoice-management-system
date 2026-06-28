import React from 'react';
import { GenericDuplicateDialog } from '@/features/invoicing/shared/dialogs';

interface GoodsIssueNoteDuplicateDialogProps {
  className?: string;
  id: number;
  sequential: string;
  open: boolean;
  duplicateGoodsIssueNote: (includeFiles: boolean) => void;
  isDuplicationPending?: boolean;
  onClose: () => void;
}

export const GoodsIssueNoteDuplicateDialog: React.FC<GoodsIssueNoteDuplicateDialogProps> = ({
  sequential,
  open,
  duplicateGoodsIssueNote,
  isDuplicationPending,
  onClose,
  className
}) => (
  <GenericDuplicateDialog
    sequential={sequential}
    documentLabel="le bon de sortie"
    fileDuplicationLabel="Inclure les fichiers joints"
    open={open}
    onDuplicate={duplicateGoodsIssueNote}
    isPending={isDuplicationPending}
    onClose={onClose}
    className={className}
  />
);
