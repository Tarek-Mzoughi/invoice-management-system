import type React from 'react';
import { WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Currency } from '@/types';
import { PaymentWorkflowField } from './payment-workflow-ui';

interface PaymentContextCardProps {
  conversionRate: number;
  conversionRateLabel: string;
  currencies: Currency[];
  currencyFieldLabel: string;
  currencyId?: number;
  currencyLabel: (currency: Currency) => string;
  currencyPlaceholder: string;
  directionLabel: string;
  modeLabel: string;
  onConversionRateChange: (value: number) => void;
  onCurrencyChange: (value: string) => void;
  title: string;
  typeControl?: React.ReactNode;
  typeHelperText?: React.ReactNode;
  typeLabel: string;
}

const toNumericInput = (value: number | undefined) => (Number.isFinite(value) ? String(value) : '');

export const PaymentContextCard = ({
  conversionRate,
  conversionRateLabel,
  currencies,
  currencyFieldLabel,
  currencyId,
  currencyLabel,
  currencyPlaceholder,
  directionLabel,
  modeLabel,
  onConversionRateChange,
  onCurrencyChange,
  title,
  typeControl,
  typeHelperText,
  typeLabel
}: PaymentContextCardProps) => (
  <Card>
    <CardHeader className="p-5 pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <WalletCards className="h-4 w-4" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="grid gap-4 p-5 pt-0 lg:grid-cols-3">
      <PaymentWorkflowField label={typeLabel}>
        {typeControl ? (
          <div className="space-y-2">
            {typeControl}
            {typeHelperText && (
              <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {typeHelperText}
              </p>
            )}
          </div>
        ) : (
          <div className="flex h-9 items-center justify-between gap-2 rounded-md border border-zinc-200 px-3 text-sm dark:border-zinc-800">
            <span>{modeLabel}</span>
            <Badge variant="outline">{directionLabel}</Badge>
          </div>
        )}
      </PaymentWorkflowField>

      <PaymentWorkflowField label={currencyFieldLabel}>
        <Select value={currencyId ? String(currencyId) : ''} onValueChange={onCurrencyChange}>
          <SelectTrigger>
            <SelectValue placeholder={currencyPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((currency) => (
              <SelectItem key={currency.id} value={String(currency.id)}>
                {currencyLabel(currency)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PaymentWorkflowField>

      <PaymentWorkflowField label={conversionRateLabel}>
        <Input
          type="number"
          min={0}
          step="0.000001"
          value={toNumericInput(conversionRate)}
          onChange={(event) => onConversionRateChange(Number(event.target.value) || 1)}
        />
      </PaymentWorkflowField>
    </CardContent>
  </Card>
);
