import React from 'react';
import { Currency, INVOICE_STATUS, Tax, TaxWithholding } from '@/types';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useInvoiceArticleManager } from '../hooks/useInvoiceArticleManager';
import { useInvoiceManager } from '../hooks/useInvoiceManager';
import { useInvoiceControlManager } from '../hooks/useInvoiceControlManager';
import { ciel } from '@/utils/number.utils';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';

interface InvoiceFinancialInformationProps {
  className?: string;
  status: INVOICE_STATUS;
  subTotal?: number;
  currency?: Currency;
  taxes: Tax[];
  taxWithholdings?: TaxWithholding[];
  loading?: boolean;
  edit?: boolean;
}

export const InvoiceFinancialInformation = ({
  className,
  subTotal,
  status,
  currency,
  taxes,
  taxWithholdings,
  loading,
  edit = true
}: InvoiceFinancialInformationProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const tInvoice = useSellingInvoiceLabels().t;
  const invoiceArticleManager = useInvoiceArticleManager();
  const invoiceManager = useInvoiceManager();
  const controlManager = useInvoiceControlManager();
  const currencySymbol = currency?.symbol || '$';
  const digitAfterComma = currency?.digitAfterComma || 3;
  const discount = invoiceManager.discount ?? 0;
  const discountType = invoiceManager.discountType;

  const taxStamp = React.useMemo(
    () => taxes.find((tax) => tax.id === invoiceManager.taxStampId),
    [taxes, invoiceManager.taxStampId]
  );

  const taxWithholdingAmount = React.useMemo(() => {
    if (invoiceManager.taxWithholdingId) {
      const taxWithholding = taxWithholdings?.find((t) => t.id === invoiceManager.taxWithholdingId);
      const withholdingAmount = invoiceManager.total * ((taxWithholding?.rate || 0) / 100);
      return ciel(withholdingAmount, digitAfterComma);
    }

    return 0;
  }, [digitAfterComma, invoiceManager.taxWithholdingId, invoiceManager.total, taxWithholdings]);

  const amountSettled = invoiceManager.amountSettled || 0;

  const remainingAmount =
    (invoiceManager.total || 0) -
    (invoiceManager.amountPaid || 0) -
    amountSettled -
    taxWithholdingAmount;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="flex items-center gap-3 py-1 text-sm">
          <Label className="mr-auto text-zinc-600 dark:text-zinc-300">
            {tInvoice('attributes.sub_total')}
          </Label>
          <Label className="ml-auto text-right" isPending={loading || false}>
            {subTotal?.toFixed(digitAfterComma)} {currencySymbol}
          </Label>
        </div>

        {invoiceArticleManager.taxSummary.map((ts) => (
          <div key={ts.tax.id} className="flex items-center gap-3 py-1 text-sm">
            <Label className="mr-auto text-zinc-600 dark:text-zinc-300">{ts.tax.label}</Label>
            <Label className="ml-auto text-right" isPending={loading || false}>
              {ts.amount?.toFixed(digitAfterComma)} {currencySymbol}
            </Label>
          </div>
        ))}

        {!edit && discount > 0 && (
          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div className="flex items-center gap-3 text-sm">
              <Label className="mr-auto text-zinc-600 dark:text-zinc-300">
                {tInvoice('attributes.discount')}
              </Label>
              <Label className="ml-auto text-right" isPending={loading || false}>
                {discount.toFixed(digitAfterComma)}{' '}
                {discountType === DISCOUNT_TYPE.PERCENTAGE ? '%' : currencySymbol}
              </Label>
            </div>
          </div>
        )}

        {!controlManager.isTaxStampHidden && taxStamp && (
          <div className="flex items-center gap-3 py-1 text-sm">
            <Label className="mr-auto text-zinc-600 dark:text-zinc-300">
              {tInvoice('attributes.tax_stamp')}
            </Label>
            <Label className="ml-auto text-right" isPending={loading || false}>
              {(taxStamp.value || 0).toFixed(digitAfterComma)} {currencySymbol}
            </Label>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <Label className="mr-auto text-base font-semibold">{tInvoice('attributes.total')}</Label>
        <Label className="ml-auto text-right text-lg font-semibold" isPending={loading || false}>
          {invoiceManager.total?.toFixed(digitAfterComma)} {currencySymbol}
        </Label>
      </div>

      {!controlManager.isTaxWithholdingHidden && invoiceManager.taxWithholdingId && (
        <div className="flex items-center gap-3 text-sm">
          <Label className="mr-auto text-zinc-600 dark:text-zinc-300">
            {tInvoice('attributes.withholding')}
          </Label>
          <Label className="ml-auto text-right" isPending={loading || false}>
            {taxWithholdingAmount.toFixed(digitAfterComma)} {currencySymbol}
          </Label>
        </div>
      )}

      {[
        INVOICE_STATUS.PartiallyPaid,
        INVOICE_STATUS.PartiallySettled,
        INVOICE_STATUS.Settled,
        INVOICE_STATUS.Unpaid,
        INVOICE_STATUS.Paid
      ].includes(status) && (
        <>
          <div className="flex items-center gap-3 text-sm">
            <Label className="mr-auto text-zinc-600 dark:text-zinc-300">
              {tInvoice('attributes.amount_paid')}
            </Label>
            <Label className="ml-auto text-right" isPending={loading || false}>
              {invoiceManager.amountPaid?.toFixed(digitAfterComma)} {currencySymbol}
            </Label>
          </div>

          {(amountSettled > 0 ||
            [INVOICE_STATUS.PartiallySettled, INVOICE_STATUS.Settled].includes(status)) && (
            <div className="flex items-center gap-3 text-sm">
              <Label className="mr-auto text-zinc-600 dark:text-zinc-300">
                {tInvoice('attributes.amount_settled')}
              </Label>
              <Label className="ml-auto text-right" isPending={loading || false}>
                {amountSettled.toFixed(digitAfterComma)} {currencySymbol}
              </Label>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm">
            <Label className="mr-auto text-zinc-600 dark:text-zinc-300">
              {tInvoice('attributes.remaining_amount')}
            </Label>
            <Label className="ml-auto text-right" isPending={loading || false}>
              {remainingAmount.toFixed(digitAfterComma)} {currencySymbol}
            </Label>
          </div>
        </>
      )}
    </div>
  );
};
