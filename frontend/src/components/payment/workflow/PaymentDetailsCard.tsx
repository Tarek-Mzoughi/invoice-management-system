import { Landmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { BankAccount, PAYMENT_MODE } from '@/types';
import { PaymentWorkflowEmptyState, PaymentWorkflowField } from './payment-workflow-ui';

interface PaymentDetailsCardProps {
  amount: number;
  date?: Date;
  disabled?: boolean;
  dueDate?: Date;
  fee: number;
  mode: PAYMENT_MODE;
  modeOptions: PAYMENT_MODE[];
  onAmountChange: (value: number) => void;
  onDateChange: (value?: Date) => void;
  onDueDateChange: (value?: Date) => void;
  onFeeChange: (value: number) => void;
  onModeChange: (value: PAYMENT_MODE) => void;
  onReferenceChange: (value: string) => void;
  onTreasuryAccountChange: (value: number | undefined) => void;
  reference?: string;
  showDueDate?: boolean;
  title: string;
  treasuryAccountId?: number;
  treasuryAccounts: BankAccount[];
  treasuryDisabled?: boolean;
  treasuryOptionalLabel: string;
  labels: {
    amount: string;
    date: string;
    dueDate: string;
    fee: string;
    mode: string;
    modePlaceholder: string;
    reference: string;
    referencePlaceholder: string;
    treasuryAccount: string;
    treasuryPlaceholder: string;
  };
  translateMode: (mode: PAYMENT_MODE) => string;
}

const toNumericInput = (value: number | undefined) => (Number.isFinite(value) ? String(value) : '');

export const PaymentDetailsCard = ({
  amount,
  date,
  disabled,
  dueDate,
  fee,
  labels,
  mode,
  modeOptions,
  onAmountChange,
  onDateChange,
  onDueDateChange,
  onFeeChange,
  onModeChange,
  onReferenceChange,
  onTreasuryAccountChange,
  reference,
  showDueDate,
  title,
  translateMode,
  treasuryAccountId,
  treasuryAccounts,
  treasuryDisabled,
  treasuryOptionalLabel
}: PaymentDetailsCardProps) => (
  <Card>
    <CardHeader className="p-5 pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Landmark className="h-4 w-4" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="grid gap-4 p-5 pt-0 lg:grid-cols-3">
      <PaymentWorkflowField label={`${labels.date} (*)`}>
        <DatePicker
          value={date}
          onChange={onDateChange}
          placeholder="-"
          className="w-full"
          disabled={disabled}
        />
      </PaymentWorkflowField>
      <PaymentWorkflowField label={`${labels.mode} (*)`}>
        <Select
          value={mode || ''}
          onValueChange={(value) => onModeChange(value as PAYMENT_MODE)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={labels.modePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {modeOptions.map((paymentMode) => (
              <SelectItem key={paymentMode} value={paymentMode}>
                {translateMode(paymentMode)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PaymentWorkflowField>
      <PaymentWorkflowField label={`${labels.treasuryAccount} (*)`}>
        {treasuryDisabled ? (
          <PaymentWorkflowEmptyState label={treasuryOptionalLabel} />
        ) : (
          <Select
            value={treasuryAccountId ? String(treasuryAccountId) : ''}
            onValueChange={(value) => onTreasuryAccountChange(Number(value))}
            disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={labels.treasuryPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {treasuryAccounts.map((account) => (
                <SelectItem key={account.id} value={String(account.id)}>
                  {account.name} {account.currency?.code ? `(${account.currency.code})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </PaymentWorkflowField>
      <PaymentWorkflowField label={labels.reference}>
        <Input
          value={reference || ''}
          onChange={(event) => onReferenceChange(event.target.value)}
          placeholder={labels.referencePlaceholder}
          disabled={disabled}
        />
      </PaymentWorkflowField>
      {showDueDate && (
        <PaymentWorkflowField label={`${labels.dueDate} (*)`}>
          <DatePicker
            value={dueDate}
            onChange={onDueDateChange}
            placeholder="-"
            className="w-full"
            disabled={disabled}
          />
        </PaymentWorkflowField>
      )}
      <PaymentWorkflowField label={labels.amount}>
        <Input
          type="number"
          min={0}
          step="0.001"
          value={toNumericInput(amount)}
          disabled={disabled || mode === PAYMENT_MODE.CreditNoteSettlement}
          onChange={(event) => onAmountChange(Number(event.target.value) || 0)}
        />
      </PaymentWorkflowField>
      <PaymentWorkflowField label={labels.fee}>
        <Input
          type="number"
          min={0}
          step="0.001"
          value={toNumericInput(fee)}
          onChange={(event) => onFeeChange(Number(event.target.value) || 0)}
          disabled={disabled}
        />
      </PaymentWorkflowField>
    </CardContent>
  </Card>
);
