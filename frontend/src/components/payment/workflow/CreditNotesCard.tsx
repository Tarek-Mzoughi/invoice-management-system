import { Banknote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CreditNote, Currency, PaymentCreditNoteEntry } from '@/types';
import { formatAmount } from './payment-workflow-utils';
import { getCreditNoteAvailableAmount } from './payment-workflow-calculations';
import { PaymentWorkflowEmptyState } from './payment-workflow-ui';

interface CreditNotesCardProps {
  creditNotes: CreditNote[];
  entries: PaymentCreditNoteEntry[];
  formatStatus: (status?: string) => string;
  hasPartner?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  loadingLabel: string;
  noCreditNotesLabel: string;
  onAmountChange: (creditNote: CreditNote, amount: number) => void;
  onRateChange: (creditNote: CreditNote, rate: number) => void;
  paymentCurrency?: Currency;
  selectPartnerLabel: string;
  title: string;
  warningLabel?: string;
  labels: {
    available: string;
    convertedAmount: string;
    exchangeRate: string;
    originalAmount: string;
    status: string;
  };
}

const toNumericInput = (value: number | undefined) => (Number.isFinite(value) ? String(value) : '');

export const CreditNotesCard = ({
  creditNotes,
  entries,
  formatStatus,
  hasPartner,
  isDisabled,
  isLoading,
  labels,
  loadingLabel,
  noCreditNotesLabel,
  onAmountChange,
  onRateChange,
  paymentCurrency,
  selectPartnerLabel,
  title,
  warningLabel
}: CreditNotesCardProps) => (
  <Card>
    <CardHeader className="p-5 pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Banknote className="h-4 w-4" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-5 pt-0">
      {isDisabled && warningLabel && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
          {warningLabel}
        </div>
      )}
      {!hasPartner ? (
        <PaymentWorkflowEmptyState label={selectPartnerLabel} />
      ) : isLoading ? (
        <PaymentWorkflowEmptyState label={loadingLabel} />
      ) : creditNotes.length === 0 ? (
        <PaymentWorkflowEmptyState label={noCreditNotesLabel} />
      ) : (
        <div className="grid gap-3">
          {creditNotes.map((creditNote) => {
            const usedEntry = entries.find((entry) => entry.creditNoteId === creditNote.id);
            const availableAmount = getCreditNoteAvailableAmount(creditNote);
            const isCrossCurrency =
              !!paymentCurrency?.id && !!creditNote.currencyId && creditNote.currencyId !== paymentCurrency.id;
            const rate = usedEntry?.exchangeRateToPaymentCurrency ?? (isCrossCurrency ? 0 : 1);
            const convertedAmount = usedEntry?.convertedAmount || 0;

            return (
              <div
                key={creditNote.id}
                className="grid gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800 lg:grid-cols-[minmax(0,1.2fr)_120px_140px_130px_140px] lg:items-center">
                <div>
                  <p className="text-sm font-medium">
                    {creditNote.sequential || creditNote.reference || `AV-${creditNote.id}`}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {labels.available}: {formatAmount(availableAmount, creditNote.currency)}
                  </p>
                </div>
                <Badge variant="outline">{formatStatus(creditNote.status)}</Badge>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500">{labels.originalAmount}</p>
                  <Input
                    type="number"
                    min={0}
                    max={availableAmount}
                    step="0.001"
                    disabled={isDisabled}
                    value={toNumericInput(usedEntry?.amount || 0)}
                    onChange={(event) => onAmountChange(creditNote, Number(event.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500">{labels.exchangeRate}</p>
                  <Input
                    type="number"
                    min={0}
                    step="0.000001"
                    disabled={isDisabled || !isCrossCurrency || !usedEntry}
                    value={toNumericInput(rate)}
                    onChange={(event) => onRateChange(creditNote, Number(event.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500">{labels.convertedAmount}</p>
                  <div className="flex h-9 items-center rounded-md border border-zinc-200 px-3 text-sm dark:border-zinc-800">
                    {formatAmount(convertedAmount, paymentCurrency)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardContent>
  </Card>
);
