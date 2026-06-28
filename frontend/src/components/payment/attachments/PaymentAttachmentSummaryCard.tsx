import React from 'react';
import { format, parseISO } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Download, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ACTIVITY_TYPE, Payment, PAYMENT_MODE } from '@/types';
import { cn } from '@/lib/utils';
import {
  getPaymentStatusClassName,
  getPaymentStatusTranslationKey
} from '@/utils/payment.utils';

interface PaymentAttachmentSummaryCardProps {
  payment: Payment | null;
  receiptActionPending?: boolean;
  scope?: 'selling' | 'buying';
  onDownloadReceipt?: (payment: Payment) => void;
  onPreviewReceipt?: (payment: Payment) => void;
}

const isBuyingPayment = (payment: Payment | null, scope?: 'selling' | 'buying') =>
  payment?.activityType === ACTIVITY_TYPE.BUYING || scope === 'buying';

const formatAmount = (
  payment: Payment | null,
  localeCode: string,
  scope?: 'selling' | 'buying'
) => {
  const digits = payment?.currency?.digitAfterComma ?? 2;
  const amount = Number(payment?.amount || 0);
  const value = Math.abs(amount).toLocaleString(localeCode, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
  const sign = amount === 0 ? '' : isBuyingPayment(payment, scope) ? '- ' : '+ ';
  return `${sign}${value} ${payment?.currency?.symbol || ''}`.trim();
};

const getDirectionLabel = (
  payment: Payment | null,
  scope: 'selling' | 'buying' | undefined,
  tInvoicing: (key: string) => string
) => {
  if (payment?.mode === PAYMENT_MODE.CreditNoteSettlement) {
    return tInvoicing('payment.attachments.direction_credit_note');
  }

  return isBuyingPayment(payment, scope)
    ? tInvoicing('payment.attachments.direction_buying')
    : tInvoicing('payment.attachments.direction_selling');
};

const getAmountClassName = (payment: Payment | null, scope?: 'selling' | 'buying') => {
  if (payment?.mode === PAYMENT_MODE.CreditNoteSettlement) {
    return 'text-emerald-600 dark:text-emerald-400';
  }
  return isBuyingPayment(payment, scope)
    ? 'text-rose-600 dark:text-rose-400'
    : 'text-emerald-600 dark:text-emerald-400';
};

export const PaymentAttachmentSummaryCard: React.FC<PaymentAttachmentSummaryCardProps> = ({
  payment,
  receiptActionPending,
  scope,
  onDownloadReceipt,
  onPreviewReceipt
}) => {
  const { t: tInvoicing, i18n } = useTranslation('invoicing');
  const { t: tSettings } = useTranslation('settings');
  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  const numberLocale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const paymentDate = payment?.date ? parseISO(payment.date) : null;
  const formattedDate = paymentDate
    ? format(paymentDate, 'dd MMM yyyy', { locale: dateLocale })
    : '-';

  return (
    <section className="space-y-5 border-b border-zinc-200 pb-5 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {tInvoicing('payment.attributes.amount')}
          </p>
          <p className={cn('mt-1 text-xl font-semibold', getAmountClassName(payment, scope))}>
            {formatAmount(payment, numberLocale, scope)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            {getDirectionLabel(payment, scope, tInvoicing)}
          </Badge>
          {payment?.collectionStatus && (
            <Badge
              variant="outline"
              className={cn('w-fit', getPaymentStatusClassName(payment.collectionStatus))}
            >
              {tSettings(getPaymentStatusTranslationKey(payment.collectionStatus))}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {tInvoicing('payment.attachments.partner')}
          </p>
          <p className="mt-1 truncate font-medium text-zinc-950 dark:text-zinc-50">
            {payment?.firm?.name || '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {tInvoicing('payment.attributes.mode')}
          </p>
          <p className="mt-1 truncate font-medium text-zinc-950 dark:text-zinc-50">
            {payment?.mode ? tInvoicing(payment.mode) : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {tInvoicing('payment.attributes.date')}
          </p>
          <p className="mt-1 font-medium text-zinc-950 dark:text-zinc-50">{formattedDate}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {tInvoicing('payment.attributes.treasury_account')}
          </p>
          <p className="mt-1 truncate font-medium text-zinc-950 dark:text-zinc-50">
            {payment?.treasuryAccount?.name || '-'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!payment?.id || receiptActionPending}
          onClick={() => payment && onPreviewReceipt?.(payment)}
        >
          <FileText className="h-4 w-4" />
          {tInvoicing('payment.receipt.view')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!payment?.id || receiptActionPending}
          onClick={() => payment && onDownloadReceipt?.(payment)}
        >
          <Download className="h-4 w-4" />
          {tInvoicing('payment.receipt.download')}
        </Button>
      </div>
    </section>
  );
};
