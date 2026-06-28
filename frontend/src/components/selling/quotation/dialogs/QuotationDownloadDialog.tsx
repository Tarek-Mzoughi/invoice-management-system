import React from 'react';
import { GenericDownloadDialog } from '@/features/invoicing/shared/dialogs';

interface QuotationDownloadDialogProps {
  className?: string;
  id: number;
  open: boolean;
  downloadQuotation: (template: string) => void;
  isDownloadPending: boolean;
  onClose: () => void;
}

export const QuotationDownloadDialog: React.FC<QuotationDownloadDialogProps> = ({
  open,
  downloadQuotation,
  isDownloadPending,
  onClose,
  className
}) => (
  <GenericDownloadDialog
    open={open}
    onDownload={downloadQuotation}
    isPending={isDownloadPending}
    onClose={onClose}
    className={className}
  />
);
