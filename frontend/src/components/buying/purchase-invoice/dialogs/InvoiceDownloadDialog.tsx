import React from 'react';
import { GenericDownloadDialog } from '@/features/invoicing/shared/dialogs';

interface InvoiceDownloadDialogProps {
  className?: string;
  id: number;
  open: boolean;
  downloadInvoice: (template: string) => void;
  isDownloadPending: boolean;
  onClose: () => void;
}

export const InvoiceDownloadDialog: React.FC<InvoiceDownloadDialogProps> = ({
  open,
  downloadInvoice,
  isDownloadPending,
  onClose,
  className
}) => (
  <GenericDownloadDialog
    open={open}
    onDownload={downloadInvoice}
    isPending={isDownloadPending}
    onClose={onClose}
    className={className}
  />
);
