import React from 'react';
import { GenericDownloadDialog } from '@/features/invoicing/shared/dialogs';

interface CustomerOrderDownloadDialogProps {
  className?: string;
  id: number;
  open: boolean;
  downloadCustomerOrder: (template: string) => void;
  isDownloadPending: boolean;
  onClose: () => void;
}

export const CustomerOrderDownloadDialog: React.FC<CustomerOrderDownloadDialogProps> = ({
  open,
  downloadCustomerOrder,
  isDownloadPending,
  onClose,
  className
}) => (
  <GenericDownloadDialog
    open={open}
    onDownload={downloadCustomerOrder}
    isPending={isDownloadPending}
    onClose={onClose}
    className={className}
  />
);
