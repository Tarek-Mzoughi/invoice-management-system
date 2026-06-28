import React from 'react';
import { GenericDownloadDialog } from '@/features/invoicing/shared/dialogs';

interface DeliveryNoteDownloadDialogProps {
  className?: string;
  id: number;
  open: boolean;
  downloadDeliveryNote: (template: string) => void;
  isDownloadPending: boolean;
  onClose: () => void;
}

export const DeliveryNoteDownloadDialog: React.FC<DeliveryNoteDownloadDialogProps> = ({
  open,
  downloadDeliveryNote,
  isDownloadPending,
  onClose,
  className
}) => (
  <GenericDownloadDialog
    open={open}
    onDownload={downloadDeliveryNote}
    isPending={isDownloadPending}
    onClose={onClose}
    className={className}
  />
);
