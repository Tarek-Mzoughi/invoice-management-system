import React from 'react';
import { GenericDownloadDialog } from '@/features/invoicing/shared/dialogs';

interface GoodsIssueNoteDownloadDialogProps {
  className?: string;
  id: number;
  open: boolean;
  downloadGoodsIssueNote: (template: string) => void;
  isDownloadPending: boolean;
  onClose: () => void;
}

export const GoodsIssueNoteDownloadDialog: React.FC<GoodsIssueNoteDownloadDialogProps> = ({
  open,
  downloadGoodsIssueNote,
  isDownloadPending,
  onClose,
  className
}) => (
  <GenericDownloadDialog
    open={open}
    onDownload={downloadGoodsIssueNote}
    isPending={isDownloadPending}
    onClose={onClose}
    className={className}
  />
);
