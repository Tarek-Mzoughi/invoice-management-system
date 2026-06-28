import React from 'react';
import { Currency, CREDIT_NOTE_STATUS, Tax, TaxWithholding } from '@/types';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useCreditNoteArticleManager } from '../hooks/useCreditNoteArticleManager';
import { useCreditNoteManager } from '../hooks/useCreditNoteManager';
import { useCreditNoteControlManager } from '../hooks/useCreditNoteControlManager';
import { ciel } from '@/utils/number.utils';

interface CreditNoteFinancialInformationProps {
  className?: string;
  status: CREDIT_NOTE_STATUS;
  subTotal?: number;
  currency?: Currency;
  taxes: Tax[];
  taxWithholdings?: TaxWithholding[];
  loading?: boolean;
  edit?: boolean;
}

export const CreditNoteFinancialInformation = ({
  className,
  subTotal,
  status,
  currency,
  taxes,
  taxWithholdings,
  loading,
  edit = true
}: CreditNoteFinancialInformationProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const creditNoteArticleManager = useCreditNoteArticleManager();
  const creditNoteManager = useCreditNoteManager();
  const controlManager = useCreditNoteControlManager();
  const currencySymbol = currency?.symbol || '$';
  const digitAfterComma = currency?.digitAfterComma || 3;
  const discount = creditNoteManager.discount ?? 0;
  const discountType = creditNoteManager.discountType;

  const taxStamp = React.useMemo(
    () => taxes.find((tax) => tax.id === creditNoteManager.taxStampId),
    [taxes, creditNoteManager.taxStampId]
  );

  const taxWithholdingAmount = React.useMemo(() => {
    if (creditNoteManager.taxWithholdingId) {
      const taxWithholding = taxWithholdings?.find(
        (t) => t.id === creditNoteManager.taxWithholdingId
      );
      const withholdingAmount = creditNoteManager.total * ((taxWithholding?.rate || 0) / 100);
      return ciel(withholdingAmount, digitAfterComma);
    }

    return 0;
  }, [
    digitAfterComma,
    creditNoteManager.taxWithholdingId,
    creditNoteManager.total,
    taxWithholdings
  ]);

  const remainingAmount =
    (creditNoteManager.total || 0) - (creditNoteManager.amountPaid || 0) - taxWithholdingAmount;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="flex items-center gap-3 py-1 text-sm">
          <Label className="mr-auto text-zinc-600 dark:text-zinc-300">
            {tInvoicing('creditNote.attributes.sub_total')}
          </Label>
          <Label className="ml-auto text-right" isPending={loading || false}>
            {subTotal?.toFixed(digitAfterComma)} {currencySymbol}
          </Label>
        </div>

        {creditNoteArticleManager.taxSummary.map((ts) => (
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
                {tInvoicing('creditNote.attributes.discount')}
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
              {tInvoicing('creditNote.attributes.tax_stamp')}
            </Label>
            <Label className="ml-auto text-right" isPending={loading || false}>
              {(taxStamp.value || 0).toFixed(digitAfterComma)} {currencySymbol}
            </Label>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <Label className="mr-auto text-base font-semibold">
          {tInvoicing('creditNote.attributes.total')}
        </Label>
        <Label className="ml-auto text-right text-lg font-semibold" isPending={loading || false}>
          {creditNoteManager.total?.toFixed(digitAfterComma)} {currencySymbol}
        </Label>
      </div>

      {!controlManager.isTaxWithholdingHidden && creditNoteManager.taxWithholdingId && (
        <div className="flex items-center gap-3 text-sm">
          <Label className="mr-auto text-zinc-600 dark:text-zinc-300">
            {tInvoicing('creditNote.attributes.withholding')}
          </Label>
          <Label className="ml-auto text-right" isPending={loading || false}>
            {taxWithholdingAmount.toFixed(digitAfterComma)} {currencySymbol}
          </Label>
        </div>
      )}

      {[
        CREDIT_NOTE_STATUS.PartiallyPaid,
        CREDIT_NOTE_STATUS.Unpaid,
        CREDIT_NOTE_STATUS.Paid
      ].includes(status) && (
        <>
          <div className="flex items-center gap-3 text-sm">
            <Label className="mr-auto text-zinc-600 dark:text-zinc-300">
              {tInvoicing('creditNote.attributes.amount_paid')}
            </Label>
            <Label className="ml-auto text-right" isPending={loading || false}>
              {creditNoteManager.amountPaid?.toFixed(digitAfterComma)} {currencySymbol}
            </Label>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Label className="mr-auto text-zinc-600 dark:text-zinc-300">
              {tInvoicing('creditNote.attributes.remaining_amount')}
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
