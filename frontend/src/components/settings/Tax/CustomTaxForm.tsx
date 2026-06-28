import React from 'react';
import { useTranslation } from 'react-i18next';
import useCurrency from '@/hooks/content/useCurrency';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTaxManager } from './hooks/useTaxManager';

interface CustomTaxFormProps {
  className?: string;
  isPending?: boolean;
}

export const CustomTaxForm = ({ className, isPending }: CustomTaxFormProps) => {
  const { t: tSettings } = useTranslation('settings');
  const taxManager = useTaxManager();
  const { currencies, isFetchCurrenciesPending } = useCurrency(!taxManager.isRate);
  const isRate = taxManager.isRate !== false;
  const value = typeof taxManager.value === 'number' ? String(taxManager.value) : '';
  const selectedCurrency = currencies.find((currency) => currency.id === taxManager.currencyId);
  const valueSuffix = isRate ? '%' : selectedCurrency?.symbol || 'DT';

  const setTaxType = (type: 'rate' | 'fixed') => {
    const nextIsRate = type === 'rate';
    taxManager.set('isRate', nextIsRate);

    if (nextIsRate) {
      taxManager.set('specificCurrency', false);
      taxManager.set('currencyId', null);
    }
  };

  return (
    <div className={cn('grid gap-5 py-1', className)}>
      <div className="grid gap-2">
        <Label htmlFor="tax-custom-label" required>
          {tSettings('tax.custom_form.name_label')}
        </Label>
        <Input
          id="tax-custom-label"
          value={taxManager.label || ''}
          placeholder={tSettings('tax.custom_form.name_placeholder')}
          disabled={isPending}
          onChange={(event) => taxManager.set('label', event.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          {tSettings('tax.custom_form.name_hint')}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-3">
          <Label required>{tSettings('tax.custom_form.type_label')}</Label>
          <RadioGroup
            value={isRate ? 'rate' : 'fixed'}
            onValueChange={(value) => setTaxType(value === 'fixed' ? 'fixed' : 'rate')}
            disabled={isPending}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="tax-custom-type-rate" value="rate" />
              <Label htmlFor="tax-custom-type-rate" className="font-normal">
                {tSettings('tax.types.rate')}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="tax-custom-type-fixed" value="fixed" />
              <Label htmlFor="tax-custom-type-fixed" className="font-normal">
                {tSettings('tax.types.fixed')}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tax-custom-value" required>
            {tSettings('tax.custom_form.value_label')}
          </Label>
          <div className="relative">
            <Input
              id="tax-custom-value"
              type="number"
              min={0}
              max={isRate ? 99 : undefined}
              step="0.001"
              inputMode="decimal"
              value={value}
              placeholder={tSettings(
                isRate
                  ? 'tax.custom_form.value_rate_placeholder'
                  : 'tax.custom_form.value_fixed_placeholder'
              )}
              disabled={isPending}
              className="pr-14"
              onChange={(event) => {
                const nextValue = event.target.value;
                taxManager.set('value', nextValue === '' ? undefined : Number(nextValue));
              }}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              {valueSuffix}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>{tSettings('tax.custom_form.apply_timing_label')}</Label>
          <Select
            value={taxManager.isSpecial ? 'after_vat' : 'before_vat'}
            onValueChange={(value) => taxManager.set('isSpecial', value === 'after_vat')}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="before_vat">
                {tSettings('tax.custom_form.apply_before_vat')}
              </SelectItem>
              <SelectItem value="after_vat">
                {tSettings('tax.custom_form.apply_after_vat')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!isRate && (
          <div className="grid gap-3">
            <div className="flex items-center gap-2 pt-8">
              <Checkbox
                id="tax-custom-specific-currency"
                checked={Boolean(taxManager.specificCurrency)}
                disabled={isPending}
                onCheckedChange={(checked) => {
                  const enabled = checked === true;
                  taxManager.set('specificCurrency', enabled);
                  if (!enabled) taxManager.set('currencyId', null);
                }}
              />
              <Label htmlFor="tax-custom-specific-currency" className="font-normal">
                {tSettings('tax.custom_form.specific_currency_label')}
              </Label>
            </div>
            {taxManager.specificCurrency && (
              <Select
                value={taxManager.currencyId?.toString() || ''}
                onValueChange={(value) => taxManager.set('currencyId', Number(value))}
                disabled={isPending || isFetchCurrenciesPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tSettings('tax.custom_form.currency_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={(currency.id || '').toString()}>
                      {currency.label} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
