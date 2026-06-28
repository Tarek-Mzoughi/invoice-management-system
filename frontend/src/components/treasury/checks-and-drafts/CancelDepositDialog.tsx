import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Payment, PAYMENT_COLLECTION_STATUS } from '@/types';
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
import { getPaymentTypeTranslationKey } from './utils';

interface CancelDepositDialogProps {
  open: boolean;
  payment: Payment | null;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelDepositDialog: React.FC<CancelDepositDialogProps> = ({
  open,
  payment,
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

  const effectiveStatus =
    payment.collectionStatus ?? PAYMENT_COLLECTION_STATUS.Pending;
  const isPaid = effectiveStatus === PAYMENT_COLLECTION_STATUS.Paid;
  const descriptionKey = isPaid
    ? 'treasury_checks_and_drafts.cancel_deposit_dialog.description_paid'
    : 'treasury_checks_and_drafts.cancel_deposit_dialog.description_deposited';

  const body = (
    <div className="space-y-5">
      <p className="text-base leading-7 text-zinc-500 dark:text-zinc-400">
        {tSettings(descriptionKey, {
          type: tSettings(getPaymentTypeTranslationKey(payment.mode)),
          reference: payment.reference || '-'
        })}
      </p>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          {tCommon('commands.cancel')}
        </Button>
        <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
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
              <div className="flex items-start gap-3 text-left">
                <div className="rounded-full bg-red-50 p-2 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <DialogTitle>
                    {tSettings('treasury_checks_and_drafts.cancel_deposit_dialog.title')}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    {tSettings(descriptionKey, {
                      type: tSettings(getPaymentTypeTranslationKey(payment.mode)),
                      reference: payment.reference || '-'
                    })}
                  </DialogDescription>
                </div>
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
            {tSettings('treasury_checks_and_drafts.cancel_deposit_dialog.title')}
          </DrawerTitle>
          <DrawerDescription>
            {tSettings(descriptionKey, {
              type: tSettings(getPaymentTypeTranslationKey(payment.mode)),
              reference: payment.reference || '-'
            })}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4">{body}</div>
        <DrawerFooter className="sr-only" />
      </DrawerContent>
    </Drawer>
  );
};
