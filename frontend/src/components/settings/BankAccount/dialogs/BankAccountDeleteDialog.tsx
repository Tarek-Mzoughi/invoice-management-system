import React from 'react';
import { useTranslation } from 'react-i18next';
import { TreasuryDeleteDialog } from '@/components/treasury/TreasuryDeleteDialog';

interface BankAccountDeleteDialogProps {
  className?: string;
  label?: string;
  open: boolean;
  deleteBankAccount: () => void;
  isDeletionPending?: boolean;
  onClose: () => void;
}

export const BankAccountDeleteDialog: React.FC<BankAccountDeleteDialogProps> = ({
  className,
  label,
  open,
  deleteBankAccount,
  isDeletionPending,
  onClose
}) => {
  const { t: tSettings } = useTranslation('settings');

  return (
    <TreasuryDeleteDialog
      className={className}
      open={open}
      title={tSettings('bank_account.delete_dialog.title')}
      description={tSettings('bank_account.delete_dialog.description')}
      contextLabel={tSettings('bank_account.delete_dialog.account_label')}
      contextValue={label}
      isPending={isDeletionPending}
      onClose={onClose}
      onConfirm={() => {
        deleteBankAccount?.();
      }}
    />
  );
};
