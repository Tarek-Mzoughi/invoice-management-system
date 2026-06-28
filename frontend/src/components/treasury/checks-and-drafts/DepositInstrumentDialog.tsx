import React from 'react';
import { Check, Landmark, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BankAccount, Payment } from '@/types';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/other/useMediaQuery';
import { cn } from '@/lib/utils';
import {
  formatMoney,
  getConvertedPaymentAmount,
  getPaymentTypeTranslationKey,
  getValidPaymentConversionRate
} from './utils';

interface DepositInstrumentDialogProps {
  open: boolean;
  payment: Payment | null;
  bankAccounts: BankAccount[];
  locale: string;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: (bankAccountId: number) => void;
}

export const DepositInstrumentDialog: React.FC<DepositInstrumentDialogProps> = ({
  open,
  payment,
  bankAccounts,
  locale,
  isPending,
  onClose,
  onConfirm
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const isDesktop = useMediaQuery('(min-width: 900px)');
  const conversionRate = React.useMemo(
    () => getValidPaymentConversionRate(payment),
    [payment]
  );

  const isCrossCurrencyAccount = React.useCallback(
    (account: BankAccount) =>
      Boolean(
        payment?.currencyId &&
          account.currencyId &&
          payment.currencyId !== account.currencyId
      ),
    [payment?.currencyId]
  );

  const canUseBankAccount = React.useCallback(
    (account: BankAccount) => !isCrossCurrencyAccount(account) || Boolean(conversionRate),
    [conversionRate, isCrossCurrencyAccount]
  );

  const [selectedBankAccountId, setSelectedBankAccountId] = React.useState<number | undefined>(
    undefined
  );

  React.useEffect(() => {
    const firstAvailableBankAccount = bankAccounts.find((account) => canUseBankAccount(account));
    setSelectedBankAccountId(firstAvailableBankAccount?.id);
  }, [bankAccounts, canUseBankAccount, payment?.id]);

  if (!payment) {
    return null;
  }

  const selectedBankAccount = bankAccounts.find(
    (account) => account.id === selectedBankAccountId
  );
  const selectedConvertedAmount = getConvertedPaymentAmount(
    payment,
    selectedBankAccount?.currency
  );
  const selectedIsCrossCurrency = selectedBankAccount
    ? isCrossCurrencyAccount(selectedBankAccount)
    : false;
  const canSubmit = Boolean(
    selectedBankAccountId &&
      selectedBankAccount &&
      canUseBankAccount(selectedBankAccount)
  );

  const body = (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-base text-zinc-500 dark:text-zinc-400">
          {tSettings('treasury_checks_and_drafts.deposit_dialog.description')}
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {tSettings('treasury_checks_and_drafts.deposit_dialog.bank_account')}
        </label>

        {bankAccounts.length ? (
          <div className="space-y-3">
            {bankAccounts.map((account) => {
              const isSelected = account.id === selectedBankAccountId;
              const crossCurrency = isCrossCurrencyAccount(account);
              const isSelectable = canUseBankAccount(account);
              const convertedAmount = getConvertedPaymentAmount(payment, account.currency);

              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => isSelectable && setSelectedBankAccountId(account.id)}
                  disabled={!isSelectable}
                  className={cn(
                    'flex w-full items-start gap-4 rounded-xl border p-4 text-left transition',
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 shadow-sm dark:bg-blue-950/20'
                      : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700',
                    !isSelectable && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <div className="rounded-lg bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                    <Landmark className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          {account.name}
                        </p>
                        <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                          {formatMoney(account.balance || 0, locale, account.currency)}
                        </p>
                      </div>

                      {isSelected ? <Check className="h-5 w-5 text-blue-500" /> : null}
                    </div>

                    {account.bic ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {tSettings('treasury_checks_and_drafts.deposit_dialog.bank')} {account.bic}
                      </p>
                    ) : null}
                    {account.agency ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {tSettings('treasury_checks_and_drafts.deposit_dialog.agency')} {account.agency}
                      </p>
                    ) : null}
                    {account.iban ? (
                      <p className="break-all text-sm text-zinc-500 dark:text-zinc-400">
                        {tSettings('treasury_checks_and_drafts.deposit_dialog.iban')} {account.iban}
                      </p>
                    ) : null}
                    {account.rib ? (
                      <p className="break-all text-sm text-zinc-500 dark:text-zinc-400">
                        {tSettings('treasury_checks_and_drafts.deposit_dialog.rib')} {account.rib}
                      </p>
                    ) : null}
                    {crossCurrency && convertedAmount && conversionRate ? (
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {tSettings('treasury_checks_and_drafts.deposit_dialog.conversion_notice', {
                          amount: formatMoney(convertedAmount, locale, account.currency),
                          rate: conversionRate
                        })}
                      </p>
                    ) : null}
                    {crossCurrency && !conversionRate ? (
                      <p className="text-sm text-rose-600 dark:text-rose-400">
                        {tSettings('treasury_checks_and_drafts.deposit_dialog.missing_rate_notice')}
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400">
            {tSettings('treasury_checks_and_drafts.deposit_dialog.empty_bank_accounts')}
          </div>
        )}
      </div>

      {selectedIsCrossCurrency && selectedConvertedAmount && conversionRate ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300">
          {tSettings('treasury_checks_and_drafts.deposit_dialog.conversion_notice', {
            amount: formatMoney(selectedConvertedAmount, locale, selectedBankAccount?.currency),
            rate: conversionRate
          })}
        </div>
      ) : null}

      {selectedIsCrossCurrency && !conversionRate ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
          {tSettings('treasury_checks_and_drafts.deposit_dialog.missing_rate_notice')}
        </div>
      ) : null}

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          {tCommon('commands.cancel')}
        </Button>
        <Button
          type="button"
          onClick={() => selectedBankAccount && onConfirm(selectedBankAccount.id!)}
          disabled={!canSubmit || isPending}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Spinner show={isPending} />
          {tSettings('treasury_checks_and_drafts.deposit_dialog.confirm')}
        </Button>
      </DialogFooter>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent hideCloseButton className="max-w-[42rem] p-0">
          <DialogHeader className="border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 text-left">
                <DialogTitle className="text-[2rem] leading-none tracking-[-0.02em]">
                  {tSettings('treasury_checks_and_drafts.deposit_dialog.title', {
                    type: tSettings(getPaymentTypeTranslationKey(payment.mode)),
                    reference: payment.reference || '-'
                  })}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {tSettings('treasury_checks_and_drafts.deposit_dialog.description')}
                </DialogDescription>
              </div>

              <Button type="button" variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="px-6 py-6">{body}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>
            {tSettings('treasury_checks_and_drafts.deposit_dialog.title', {
              type: tSettings(getPaymentTypeTranslationKey(payment.mode)),
              reference: payment.reference || '-'
            })}
          </DrawerTitle>
          <DrawerDescription>
            {tSettings('treasury_checks_and_drafts.deposit_dialog.description')}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4">{body}</div>
        <DrawerFooter className="sr-only" />
      </DrawerContent>
    </Drawer>
  );
};
