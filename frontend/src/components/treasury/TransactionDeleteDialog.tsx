import React from 'react';
import { useTranslation } from 'react-i18next';
import { TreasuryDeleteDialog } from './TreasuryDeleteDialog';

interface TransactionDeleteDialogProps {
  open: boolean;
  reference?: string;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const TransactionDeleteDialog: React.FC<TransactionDeleteDialogProps> = ({
  open,
  reference,
  isPending,
  onClose,
  onConfirm
}) => {
  const { t: tSettings } = useTranslation('settings');

  return (
    <TreasuryDeleteDialog
      open={open}
      title={tSettings('treasury_transaction.delete_dialog.title')}
      description={tSettings('treasury_transaction.delete_dialog.description')}
      contextLabel={tSettings('treasury_transaction.delete_dialog.reference_label')}
      contextValue={reference}
      isPending={isPending}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
};
