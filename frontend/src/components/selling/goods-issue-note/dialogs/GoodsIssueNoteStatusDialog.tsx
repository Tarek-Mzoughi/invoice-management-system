import React from 'react';
import { useTranslation } from 'react-i18next';
import { GenericStatusDialog } from '@/features/invoicing/shared/dialogs';
import type { StatusOption } from '@/features/invoicing/shared/dialogs';
import { GOODS_ISSUE_NOTE_STATUS, GoodsIssueNote } from '@/types';

const getStatusBadgeClassName = (status?: string) => {
  switch (status) {
    case GOODS_ISSUE_NOTE_STATUS.Issued:
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    case GOODS_ISSUE_NOTE_STATUS.Created:
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case GOODS_ISSUE_NOTE_STATUS.Draft:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
    case GOODS_ISSUE_NOTE_STATUS.Cancelled:
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
  }
};

interface GoodsIssueNoteStatusDialogProps {
  className?: string;
  goodsIssueNote: Partial<GoodsIssueNote> | null;
  open: boolean;
  callback: (status: GOODS_ISSUE_NOTE_STATUS) => void;
  isPending?: boolean;
  onClose: () => void;
}

export const GoodsIssueNoteStatusDialog: React.FC<GoodsIssueNoteStatusDialogProps> = ({
  className,
  goodsIssueNote,
  open,
  callback,
  isPending,
  onClose
}) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const statusOptions = React.useMemo<StatusOption[]>(
    () => [
      {
        value: GOODS_ISSUE_NOTE_STATUS.Draft,
        labelKey: 'goodsIssueNote.status.draft'
      },
      {
        value: GOODS_ISSUE_NOTE_STATUS.Created,
        labelKey: 'goodsIssueNote.status.created'
      },
      {
        value: GOODS_ISSUE_NOTE_STATUS.Issued,
        labelKey: 'goodsIssueNote.status.issued'
      },
      {
        value: GOODS_ISSUE_NOTE_STATUS.Cancelled,
        labelKey: 'goodsIssueNote.status.cancelled'
      }
    ],
    []
  );

  return (
    <GenericStatusDialog
      className={className}
      sequential={goodsIssueNote?.sequential}
      currentStatus={goodsIssueNote?.status}
      open={open}
      onConfirm={(status) => callback(status as GOODS_ISSUE_NOTE_STATUS)}
      isPending={isPending}
      onClose={onClose}
      title={tInvoicing('goodsIssueNote.change_status', { defaultValue: 'Changer le statut' })}
      documentLabel={tInvoicing('goodsIssueNote.document', { defaultValue: 'BON DE SORTIE' })}
      statuses={statusOptions}
      getStatusBadgeClassName={getStatusBadgeClassName}
      translateStatus={(status) => tInvoicing(status)}
    />
  );
};
