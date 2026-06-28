import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const PaymentWorkflowField = ({
  children,
  label
}: {
  children: React.ReactNode;
  label: React.ReactNode;
}) => (
  <div className="space-y-2">
    <Label className="text-xs font-medium uppercase tracking-normal text-zinc-500 dark:text-zinc-400">
      {label}
    </Label>
    {children}
  </div>
);

export const PaymentWorkflowEmptyState = ({ label }: { label: React.ReactNode }) => (
  <div className="rounded-md border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
    {label}
  </div>
);

export const PaymentWorkflowSummaryMetric = ({
  label,
  strong,
  tone = 'default',
  value
}: {
  label: React.ReactNode;
  strong?: boolean;
  tone?: 'default' | 'warning';
  value: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-3 text-sm">
    <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
    <span
      className={cn(
        'max-w-[180px] text-right',
        strong && 'font-semibold',
        tone === 'warning' && 'text-amber-700 dark:text-amber-300'
      )}>
      {value}
    </span>
  </div>
);

export const PaymentWorkflowReadonlyField = ({
  label,
  value
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) => (
  <PaymentWorkflowField label={label}>
    <div className="flex h-9 w-full items-center justify-end rounded-md border border-input bg-muted/40 px-3 py-1 text-right text-sm font-medium tabular-nums text-foreground shadow-sm dark:bg-zinc-900/60">
      {value}
    </div>
  </PaymentWorkflowField>
);

export const formatWorkflowDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};
