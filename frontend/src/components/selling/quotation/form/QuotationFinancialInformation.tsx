import React from 'react';
import { Currency } from '@/types';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { Label } from '@/components/ui/label';
import { useQuotationManager } from '@/components/selling/quotation/hooks/useQuotationManager';
import { cn } from '@/lib/utils';
import { useQuotationArticleManager } from '../hooks/useQuotationArticleManager';
import { useTranslation } from 'react-i18next';

interface QuotationFinancialInformationProps {
  className?: string;
  total: number;
  subTotal?: number;
  discount?: number;
  currency?: Currency;
  loading?: boolean;
  edit?: boolean;
}

export const QuotationFinancialInformation = ({
  className,
  subTotal,
  total,
  currency,
  loading,
  edit = true
}: QuotationFinancialInformationProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');

  const QuotationArticleManager = useQuotationArticleManager();
  const quotationManager = useQuotationManager();
  const currencySymbol = currency?.symbol || '$';
  const digitAfterComma = currency?.digitAfterComma || 3;
  const discount = quotationManager.discount ?? 0;
  const discountType = quotationManager.discountType;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="flex items-center gap-3 py-1 text-sm">
          <Label className="mr-auto text-zinc-600 dark:text-zinc-300">
            {tInvoicing('quotation.attributes.sub_total')}
          </Label>
          <Label className="ml-auto text-right" isPending={loading || false}>
            {subTotal?.toFixed(digitAfterComma)} {currencySymbol}
          </Label>
        </div>

        {QuotationArticleManager.taxSummary.map((ts) => {
          return (
            <div key={ts.tax.id} className="flex items-center gap-3 py-1 text-sm">
              <Label className="mr-auto text-zinc-600 dark:text-zinc-300">{ts.tax.label}</Label>
              <Label className="ml-auto text-right" isPending={loading || false}>
                {ts.amount?.toFixed(digitAfterComma)} {currencySymbol}
              </Label>
            </div>
          );
        })}
        {!edit && discount > 0 && (
          <div className="flex flex-col w-full border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div className="flex items-center gap-3 text-sm">
              <Label className="mr-auto text-zinc-600 dark:text-zinc-300">
                {tInvoicing('quotation.attributes.discount')}
              </Label>
              <Label className="ml-auto text-right" isPending={loading || false}>
                {discount?.toFixed(digitAfterComma)}{' '}
                <span>
                  {discountType === DISCOUNT_TYPE.PERCENTAGE ? '%' : currency?.symbol || '$'}
                </span>
              </Label>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <Label className="mr-auto text-base font-semibold">
          {tInvoicing('quotation.attributes.total')}
        </Label>
        <Label className="ml-auto text-right text-lg font-semibold" isPending={loading || false}>
          {total?.toFixed(digitAfterComma)} {currencySymbol}
        </Label>
      </div>
    </div>
  );
};
