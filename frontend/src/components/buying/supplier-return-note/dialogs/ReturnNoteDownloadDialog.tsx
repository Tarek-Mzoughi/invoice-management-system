import React from 'react';
import { GenericDownloadDialog } from '@/features/invoicing/shared/dialogs';

interface ReturnNoteDownloadDialogProps {
  className?: string;
  id: number;
  open: boolean;
  downloadReturnNote: (template: string) => void;
  isDownloadPending: boolean;
  onClose: () => void;
}

export const ReturnNoteDownloadDialog: React.FC<ReturnNoteDownloadDialogProps> = ({
  open,
  downloadReturnNote,
  isDownloadPending,
  onClose,
  className
}) => (
  <GenericDownloadDialog
    open={open}
    onDownload={downloadReturnNote}
    isPending={isDownloadPending}
    onClose={onClose}
    className={className}
  />
);
