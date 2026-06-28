import React from 'react';
import { useTranslation } from 'react-i18next';
import { GenericStatusDialog } from '@/features/invoicing/shared/dialogs';
import { QUOTATION_STATUS, Quotation } from '@/types';
import type { StatusOption } from '@/features/invoicing/shared/dialogs';

const STATUS_OPTIONS: StatusOption[] = [
  { value: QUOTATION_STATUS.Draft, labelKey: 'quotation.status.draft' },
  { value: QUOTATION_STATUS.Validated, labelKey: 'quotation.status.validated' },
  { value: QUOTATION_STATUS.Accepted, labelKey: 'quotation.status.accepted' },
  { value: QUOTATION_STATUS.Rejected, labelKey: 'quotation.status.rejected' }
];

const getStatusBadgeClassName = (status?: string) => {
  switch (status) {
    case QUOTATION_STATUS.Accepted:
      return 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    case QUOTATION_STATUS.Validated:
      return 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    case QUOTATION_STATUS.Draft:
      return 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400';
    case QUOTATION_STATUS.Rejected:
      return 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400';
  }
};

interface QuotationStatusDialogProps {
  className?: string;
  quotation: Partial<Quotation> | null;
  open: boolean;
  callback: (status: QUOTATION_STATUS) => void;
  isPending?: boolean;
  onClose: () => void;
}

export const QuotationStatusDialog: React.FC<QuotationStatusDialogProps> = ({
  className,
  quotation,
  open,
  callback,
  isPending,
  onClose
}) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  return (
    <GenericStatusDialog
      className={className}
      sequential={quotation?.sequential}
      currentStatus={quotation?.status}
      open={open}
      onConfirm={(status) => callback(status as QUOTATION_STATUS)}
      isPending={isPending}
      onClose={onClose}
      title={tInvoicing('quotation.change_status', { defaultValue: 'Changer le statut' })}
      documentLabel={tInvoicing('quotation.document', { defaultValue: 'DOCUMENT' })}
      statuses={STATUS_OPTIONS}
      getStatusBadgeClassName={getStatusBadgeClassName}
      translateStatus={(s) => tInvoicing(s)}
    />
  );
};
