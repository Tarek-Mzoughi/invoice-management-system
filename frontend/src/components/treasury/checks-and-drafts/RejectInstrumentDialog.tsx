import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useMediaQuery } from '@/hooks/other/useMediaQuery';
import { getPaymentTypeTranslationKey } from './utils';

interface RejectInstrumentDialogProps {
  open: boolean;
  payment: Payment | null;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

export const RejectInstrumentDialog: React.FC<RejectInstrumentDialogProps> = ({
  open,
  payment,
  isPending,
  onClose,
  onConfirm
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const isDesktop = useMediaQuery('(min-width: 900px)');
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setReason(payment?.rejectionReason || '');
    }
  }, [open, payment?.id, payment?.rejectionReason]);

  if (!payment) {
    return null;
  }

  const body = (
    <div className="space-y-5">
      <p className="text-base leading-7 text-zinc-500 dark:text-zinc-400">
        {tSettings('treasury_checks_and_drafts.reject_dialog.description', {
          type: tSettings(getPaymentTypeTranslationKey(payment.mode)),
          reference: payment.reference || '-'
        })}
      </p>

      <div className="space-y-2">
        <label className="text-base font-medium text-zinc-900 dark:text-zinc-100">
          {tSettings('treasury_checks_and_drafts.reject_dialog.reason_label')}
        </label>
        <Textarea
          rows={5}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={tSettings('treasury_checks_and_drafts.reject_dialog.reason_placeholder')}
          className="resize-none"
        />
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          {tCommon('commands.cancel')}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => onConfirm(reason.trim() || undefined)}
          disabled={isPending}
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
              <div className="flex items-start gap-3 text-left">
                <div className="rounded-full bg-red-50 p-2 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <DialogTitle>{tSettings('treasury_checks_and_drafts.reject_dialog.title')}</DialogTitle>
                  <DialogDescription className="sr-only">
                    {tSettings('treasury_checks_and_drafts.reject_dialog.description', {
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
          <DrawerTitle>{tSettings('treasury_checks_and_drafts.reject_dialog.title')}</DrawerTitle>
          <DrawerDescription>
            {tSettings('treasury_checks_and_drafts.reject_dialog.description', {
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
