import React from 'react';
import { GenericDownloadDialog } from '@/features/invoicing/shared/dialogs';

interface CreditNoteDownloadDialogProps {
  className?: string;
  id: number;
  open: boolean;
  downloadCreditNote: (template: string) => void;
  isDownloadPending: boolean;
  onClose: () => void;
}

export const CreditNoteDownloadDialog: React.FC<CreditNoteDownloadDialogProps> = ({
  open,
  downloadCreditNote,
  isDownloadPending,
  onClose,
  className
}) => (
  <GenericDownloadDialog
    open={open}
    onDownload={downloadCreditNote}
    isPending={isDownloadPending}
    onClose={onClose}
    className={className}
  />
);
