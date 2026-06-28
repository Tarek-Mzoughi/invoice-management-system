import React from 'react';
import { Currency } from '@/types';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { Label } from '@/components/ui/label';
import { useCustomerOrderManager } from '@/components/selling/customer-order/hooks/useCustomerOrderManager';
import { cn } from '@/lib/utils';
import { useCustomerOrderArticleManager } from '../hooks/useCustomerOrderArticleManager';
import { useTranslation } from 'react-i18next';

interface CustomerOrderFinancialInformationProps {
  className?: string;
  total: number;
  subTotal?: number;
  discount?: number;
  currency?: Currency;
  loading?: boolean;
  edit?: boolean;
}

export const CustomerOrderFinancialInformation = ({
  className,
  subTotal,
  total,
  currency,
  loading,
  edit = true
}: CustomerOrderFinancialInformationProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');

  const CustomerOrderArticleManager = useCustomerOrderArticleManager();
  const customerOrderManager = useCustomerOrderManager();
  const currencySymbol = currency?.symbol || '$';
  const digitAfterComma = currency?.digitAfterComma || 3;
  const discount = customerOrderManager.discount ?? 0;
  const discountType = customerOrderManager.discountType;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="flex items-center gap-3 py-1 text-sm">
          <Label className="mr-auto text-zinc-600 dark:text-zinc-300">
            {tInvoicing('customerOrder.attributes.sub_total')}
          </Label>
          <Label className="ml-auto text-right" isPending={loading || false}>
            {subTotal?.toFixed(digitAfterComma)} {currencySymbol}
          </Label>
        </div>

        {CustomerOrderArticleManager.taxSummary.map((ts) => {
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
                {tInvoicing('customerOrder.attributes.discount')}
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
          {tInvoicing('customerOrder.attributes.total')}
        </Label>
        <Label className="ml-auto text-right text-lg font-semibold" isPending={loading || false}>
          {total?.toFixed(digitAfterComma)} {currencySymbol}
        </Label>
      </div>
    </div>
  );
};
