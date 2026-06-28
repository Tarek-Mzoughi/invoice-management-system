import { CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BankAccount, Currency } from '@/types';
import { formatAmount } from './payment-workflow-utils';
import { PaymentWorkflowSummaryMetric } from './payment-workflow-ui';

interface PaymentSummaryPanelProps {
  conversionRate: number;
  coverageTotal: number;
  creditNoteCoverage: number;
  currency?: Currency;
  fee: number;
  hasCoverageMismatch?: boolean;
  hasWithholdingConflict?: boolean;
  moneyAmount: number;
  partnerLabel: string;
  partnerName?: string;
  remainingAfterPayment: number;
  selectedDocumentsCount: number;
  selectedTreasuryAccount?: BankAccount;
  title: string;
  totalAllocated: number;
  treasuryMovementAmount: number;
  withholdingAmount: number;
  warnings: {
    coverageMismatch: string;
    withholdingConflict: string;
  };
  labels: {
    coverageTotal: string;
    creditNoteCoverage: string;
    currency: string;
    fee: string;
    moneyAmount: string;
    remainingAfterPayment: string;
    selectedDocuments: string;
    totalRemaining: string;
    treasuryAccount: string;
    treasuryMovement: string;
    withholdingAmount: string;
  };
}

export const PaymentSummaryPanel = ({
  conversionRate,
  coverageTotal,
  creditNoteCoverage,
  currency,
  fee,
  hasCoverageMismatch,
  hasWithholdingConflict,
  labels,
  moneyAmount,
  partnerLabel,
  partnerName,
  remainingAfterPayment,
  selectedDocumentsCount,
  selectedTreasuryAccount,
  title,
  totalAllocated,
  treasuryMovementAmount,
  warnings,
  withholdingAmount
}: PaymentSummaryPanelProps) => (
  <aside className="xl:sticky xl:top-24 xl:self-start">
    <Card>
      <CardHeader className="p-5 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-0">
        <PaymentWorkflowSummaryMetric label={partnerLabel} value={partnerName || '-'} />
        <PaymentWorkflowSummaryMetric label={labels.selectedDocuments} value={String(selectedDocumentsCount)} />
        <PaymentWorkflowSummaryMetric label={labels.totalRemaining} value={formatAmount(totalAllocated, currency)} />
        <PaymentWorkflowSummaryMetric label={labels.moneyAmount} value={formatAmount(moneyAmount, currency)} />
        <PaymentWorkflowSummaryMetric label={labels.creditNoteCoverage} value={formatAmount(creditNoteCoverage, currency)} />
        <PaymentWorkflowSummaryMetric label={labels.withholdingAmount} value={formatAmount(withholdingAmount, currency)} />
        <PaymentWorkflowSummaryMetric label={labels.fee} value={formatAmount(fee, currency)} />
        <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <PaymentWorkflowSummaryMetric
            label={labels.coverageTotal}
            value={formatAmount(coverageTotal, currency)}
            strong
          />
          <PaymentWorkflowSummaryMetric
            label={labels.treasuryMovement}
            value={formatAmount(treasuryMovementAmount, currency)}
            strong
          />
          <PaymentWorkflowSummaryMetric
            label={labels.remainingAfterPayment}
            value={formatAmount(remainingAfterPayment, currency)}
            strong={hasCoverageMismatch}
            tone={hasCoverageMismatch ? 'warning' : 'default'}
          />
        </div>
        <PaymentWorkflowSummaryMetric
          label={labels.treasuryAccount}
          value={selectedTreasuryAccount?.name || '-'}
        />
        <PaymentWorkflowSummaryMetric
          label={labels.currency}
          value={`${currency?.code || '-'} · ${conversionRate || 1}`}
        />
        {hasCoverageMismatch && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
            {warnings.coverageMismatch}
          </div>
        )}
        {hasWithholdingConflict && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
            {warnings.withholdingConflict}
          </div>
        )}
      </CardContent>
    </Card>
  </aside>
);
