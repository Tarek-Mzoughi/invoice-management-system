import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Payment, PAYMENT_COLLECTION_STATUS } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { getPaymentStatusClassName, getPaymentStatusTranslationKey } from '@/utils/payment.utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/other/useMediaQuery';
import { cn } from '@/lib/utils';
import {
  formatDateOnly,
  formatDateTime,
  formatPaymentAmount,
  getDirectionClassName,
  getDirectionTranslationKey,
  getEntityName,
  getPaymentTypeClassName,
  getPaymentTypeTranslationKey,
  getTreasuryAccountName
} from './utils';

interface CheckDraftDetailsSheetProps {
  open: boolean;
  payment: Payment | null;
  companyName?: string;
  locale: string;
  onClose: () => void;
}

const DetailItem = ({
  label,
  value,
  className
}: {
  label: string;
  value?: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('space-y-1.5', className)}>
    <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
    <div className="text-base font-medium text-zinc-900 dark:text-zinc-100">{value || '-'}</div>
  </div>
);

export const CheckDraftDetailsSheet: React.FC<CheckDraftDetailsSheetProps> = ({
  open,
  payment,
  companyName,
  locale,
  onClose
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const isDesktop = useMediaQuery('(min-width: 1200px)');

  if (!payment) {
    return null;
  }

  const directionKey = getDirectionTranslationKey(payment.activityType);
  const collectionStatus =
    payment.collectionStatus ?? PAYMENT_COLLECTION_STATUS.Pending;
  const emitter =
    payment.activityType === 'buying' ? companyName || '-' : getEntityName(payment);
  const beneficiary =
    payment.activityType === 'buying' ? getEntityName(payment) : companyName || '-';
  const paymentDate = payment.paidAt || payment.date;

  const content = (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div>
          <h2 className="text-[1.9rem] font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
            {tSettings('treasury_checks_and_drafts.actions.view_details')}
          </h2>
        </div>

        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          {tCommon('commands.cancel')}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-5">
          <div className="space-y-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <p
              className={cn(
                'text-[2.2rem] font-bold tracking-tight',
                payment.activityType === 'buying' ? 'text-rose-600' : 'text-emerald-600'
              )}
            >
              {formatPaymentAmount(payment, locale, { signed: true })}
            </p>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={cn('border px-2.5 py-1 text-xs font-semibold', getPaymentTypeClassName(payment.mode))}
              >
                {tSettings(getPaymentTypeTranslationKey(payment.mode))}
              </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'border px-2.5 py-1 text-xs font-semibold',
                    getPaymentStatusClassName(collectionStatus)
                  )}
                >
                {tSettings(getPaymentStatusTranslationKey(collectionStatus))}
                </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'border px-2.5 py-1 text-xs font-semibold',
                  getDirectionClassName(payment.activityType)
                )}
              >
                {tSettings(directionKey)}
              </Badge>
            </div>
          </div>

          <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
            <DetailItem
              label={tSettings('treasury_checks_and_drafts.details.entity')}
              value={getEntityName(payment)}
            />
            <DetailItem
              label={tSettings('treasury_checks_and_drafts.details.reference')}
              value={payment.reference || '-'}
            />
            <DetailItem
              label={tSettings('treasury_checks_and_drafts.details.due_date')}
              value={formatDateTime(payment.dueDate, locale)}
            />
            <DetailItem
              label={tSettings('treasury_checks_and_drafts.details.emitter')}
              value={emitter}
            />
            <DetailItem
              label={tSettings('treasury_checks_and_drafts.details.beneficiary')}
              value={beneficiary}
            />
            <DetailItem
              label={tSettings('treasury_checks_and_drafts.details.payment_date')}
              value={formatDateTime(paymentDate, locale)}
            />
            {payment.depositedAt ? (
              <DetailItem
                label={tSettings('treasury_checks_and_drafts.details.deposit_date')}
                value={formatDateTime(payment.depositedAt, locale)}
              />
            ) : null}
            <DetailItem
              label={tSettings('treasury_checks_and_drafts.details.treasury_account')}
              value={getTreasuryAccountName(payment)}
            />
            {payment.originTreasuryAccount?.name ? (
              <DetailItem
                label={tSettings('treasury_checks_and_drafts.details.original_account')}
                value={payment.originTreasuryAccount.name}
              />
            ) : null}
            {payment.rejectedAt ? (
              <DetailItem
                label={tSettings('treasury_checks_and_drafts.details.rejected_at')}
                value={formatDateTime(payment.rejectedAt, locale)}
              />
            ) : null}
            {!payment.paidAt && payment.date ? (
              <DetailItem
                label={tSettings('treasury_checks_and_drafts.details.date')}
                value={formatDateOnly(payment.date, locale)}
              />
            ) : null}
          </div>

          <DetailItem
            label={tSettings('treasury_checks_and_drafts.details.notes')}
            value={<p className="whitespace-pre-wrap text-base font-normal">{payment.notes || '-'}</p>}
          />

          {payment.rejectionReason ? (
            <DetailItem
              label={tSettings('treasury_checks_and_drafts.details.rejection_reason')}
              value={
                <p className="whitespace-pre-wrap text-base font-normal">{payment.rejectionReason}</p>
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <SheetContent
          side="right"
          hideClose
          className="w-full max-w-[37.5rem] border-zinc-200 bg-white p-0 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{tSettings('treasury_checks_and_drafts.actions.view_details')}</SheetTitle>
            <SheetDescription>
              {tSettings('treasury_checks_and_drafts.details.description')}
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DrawerContent className="max-h-[90vh] border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{tSettings('treasury_checks_and_drafts.actions.view_details')}</DrawerTitle>
          <DrawerDescription>
            {tSettings('treasury_checks_and_drafts.details.description')}
          </DrawerDescription>
        </DrawerHeader>
        {content}
        <DrawerFooter className="sr-only" />
      </DrawerContent>
    </Drawer>
  );
};
