import { ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Currency, TaxWithholding } from '@/types';
import { formatAmount } from './payment-workflow-utils';
import { PaymentWorkflowField, PaymentWorkflowReadonlyField } from './payment-workflow-ui';

interface WithholdingTaxCardProps {
  amount: number;
  baseAmount: number;
  currency?: Currency;
  date?: Date;
  disabled?: boolean;
  enabled: boolean;
  onDateChange: (value?: Date) => void;
  onEnabledChange: (enabled: boolean) => void;
  onTaxChange: (value: number | undefined) => void;
  taxWithholdingId?: number;
  taxWithholdings: TaxWithholding[];
  title: string;
  labels: {
    amount: string;
    base: string;
    date: string;
    no: string;
    placeholder: string;
    type: string;
    yes: string;
  };
}

export const WithholdingTaxCard = ({
  amount,
  baseAmount,
  currency,
  date,
  disabled,
  enabled,
  labels,
  onDateChange,
  onEnabledChange,
  onTaxChange,
  taxWithholdingId,
  taxWithholdings,
  title
}: WithholdingTaxCardProps) => (
  <Card>
    <CardHeader className="p-5 pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <ReceiptText className="h-4 w-4" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 p-5 pt-0">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={enabled ? 'default' : 'outline'}
          size="sm"
          disabled={disabled}
          onClick={() => onEnabledChange(true)}
        >
          {labels.yes}
        </Button>
        <Button
          type="button"
          variant={!enabled ? 'default' : 'outline'}
          size="sm"
          disabled={disabled}
          onClick={() => onEnabledChange(false)}
        >
          {labels.no}
        </Button>
      </div>

      {enabled && (
        <div className="grid gap-4 lg:grid-cols-4">
          <PaymentWorkflowField label={labels.type}>
            <Select
              value={taxWithholdingId ? String(taxWithholdingId) : ''}
              onValueChange={(value) => onTaxChange(Number(value))}
              disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder={labels.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {taxWithholdings.map((tax) => (
                  <SelectItem key={tax.id} value={String(tax.id)}>
                    {tax.label} ({tax.rate}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PaymentWorkflowField>
          <PaymentWorkflowField label={labels.date}>
            <DatePicker value={date} onChange={onDateChange} className="w-full" disabled={disabled} />
          </PaymentWorkflowField>
          <PaymentWorkflowReadonlyField label={labels.base} value={formatAmount(baseAmount, currency)} />
          <PaymentWorkflowReadonlyField label={labels.amount} value={formatAmount(amount, currency)} />
        </div>
      )}
    </CardContent>
  </Card>
);
