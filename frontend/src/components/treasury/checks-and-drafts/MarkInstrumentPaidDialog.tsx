import React from 'react';
import { CircleAlert, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Payment } from '@/types';
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
import {
  formatDateOnly,
  formatMoney,
  getConvertedPaymentAmount,
  getPaymentTypeTranslationKey,
  getValidPaymentConversionRate,
  isDueDateReached
} from './utils';

interface MarkInstrumentPaidDialogProps {
  open: boolean;
  payment: Payment | null;
  locale: string;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const MarkInstrumentPaidDialog: React.FC<MarkInstrumentPaidDialogProps> = ({
  open,
  payment,
  locale,
  isPending,
  onClose,
  onConfirm
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const isDesktop = useMediaQuery('(min-width: 900px)');

  if (!payment) {
    return null;
  }

  const showDueDateNotice = !isDueDateReached(payment);
  const hasCrossCurrencyCollection = Boolean(
    payment.currencyId &&
      payment.treasuryAccount?.currencyId &&
      payment.currencyId !== payment.treasuryAccount.currencyId
  );
  const conversionRate = getValidPaymentConversionRate(payment);
  const convertedAmount = getConvertedPaymentAmount(payment, payment.treasuryAccount?.currency);
  const isMissingConversionRate = hasCrossCurrencyCollection && !conversionRate;
  const canConfirm = !Boolean(isPending || isMissingConversionRate);

  const body = (
    <div className="space-y-5">
      <p className="text-base leading-7 text-zinc-500 dark:text-zinc-400">
        {tSettings('treasury_checks_and_drafts.pay_dialog.description', {
          type: tSettings(getPaymentTypeTranslationKey(payment.mode)),
          reference: payment.reference || '-',
          account: payment.treasuryAccount?.name || '-'
        })}
      </p>

      {hasCrossCurrencyCollection && convertedAmount && conversionRate ? (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-base leading-7">
            {tSettings('treasury_checks_and_drafts.pay_dialog.conversion_notice', {
              amount: formatMoney(convertedAmount, locale, payment.treasuryAccount?.currency),
              rate: conversionRate
            })}
          </p>
        </div>
      ) : null}

      {isMissingConversionRate ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-base leading-7">
            {tSettings('treasury_checks_and_drafts.pay_dialog.missing_rate_notice')}
          </p>
        </div>
      ) : null}

      {showDueDateNotice ? (
        <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-base leading-7">
            {tSettings('treasury_checks_and_drafts.pay_dialog.due_date_notice', {
              dueDate: formatDateOnly(payment.dueDate, locale)
            })}
          </p>
        </div>
      ) : null}

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          {tCommon('commands.cancel')}
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Spinner show={isPending} />
          {tCommon('commands.confirm')}
        </Button>
      </DialogFooter>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent hideCloseButton className="max-w-[32rem] p-0">
          <DialogHeader className="border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 text-left">
                <DialogTitle>{tSettings('treasury_checks_and_drafts.pay_dialog.title')}</DialogTitle>
                <DialogDescription className="sr-only">
                  {tSettings('treasury_checks_and_drafts.pay_dialog.description', {
                    type: tSettings(getPaymentTypeTranslationKey(payment.mode)),
                    reference: payment.reference || '-',
                    account: payment.treasuryAccount?.name || '-'
                  })}
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
          <DrawerTitle>{tSettings('treasury_checks_and_drafts.pay_dialog.title')}</DrawerTitle>
          <DrawerDescription>
            {tSettings('treasury_checks_and_drafts.pay_dialog.description', {
              type: tSettings(getPaymentTypeTranslationKey(payment.mode)),
              reference: payment.reference || '-',
              account: payment.treasuryAccount?.name || '-'
            })}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4">{body}</div>
        <DrawerFooter className="sr-only" />
      </DrawerContent>
    </Drawer>
  );
};
