import React from 'react';
import { useTranslation } from 'react-i18next';
import { GenericStatusDialog } from '@/features/invoicing/shared/dialogs';
import { DELIVERY_NOTE_STATUS, DeliveryNote } from '@/types';
import type { StatusOption } from '@/features/invoicing/shared/dialogs';
import useScopedDocumentLabels from '@/hooks/content/useScopedDocumentLabels';

const getStatusBadgeClassName = (status?: string) => {
  switch (status) {
    case DELIVERY_NOTE_STATUS.Delivered:
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case DELIVERY_NOTE_STATUS.Created:
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case DELIVERY_NOTE_STATUS.Draft:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
    case DELIVERY_NOTE_STATUS.Cancelled:
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
  }
};

interface DeliveryNoteStatusDialogProps {
  className?: string;
  deliveryNote: Partial<DeliveryNote> | null;
  open: boolean;
  callback: (status: DELIVERY_NOTE_STATUS) => void;
  isPending?: boolean;
  scope?: 'selling' | 'buying';
  onClose: () => void;
}

export const DeliveryNoteStatusDialog: React.FC<DeliveryNoteStatusDialogProps> = ({
  className,
  deliveryNote,
  open,
  callback,
  isPending,
  scope = 'selling',
  onClose
}) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const documentLabels = useScopedDocumentLabels('deliveryNote', scope);
  const statusOptions = React.useMemo<StatusOption[]>(
    () => [
      {
        value: DELIVERY_NOTE_STATUS.Draft,
        labelKey: 'deliveryNote.status.draft'
      },
      {
        value: DELIVERY_NOTE_STATUS.Created,
        labelKey: 'deliveryNote.status.created'
      },
      {
        value: DELIVERY_NOTE_STATUS.Delivered,
        labelKey: 'deliveryNote.status.delivered'
      },
      {
        value: DELIVERY_NOTE_STATUS.Cancelled,
        labelKey: 'deliveryNote.status.cancelled'
      }
    ],
    []
  );

  return (
    <GenericStatusDialog
      className={className}
      sequential={documentLabels.displayNumber(deliveryNote)}
      currentStatus={deliveryNote?.status}
      open={open}
      onConfirm={(status) => callback(status as DELIVERY_NOTE_STATUS)}
      isPending={isPending}
      onClose={onClose}
      title={documentLabels.changeStatusTitle}
      documentLabel={documentLabels.document}
      statuses={statusOptions}
      getStatusBadgeClassName={getStatusBadgeClassName}
      translateStatus={(s) => tInvoicing(s)}
    />
  );
};
