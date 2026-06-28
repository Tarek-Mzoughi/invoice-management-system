import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type DocumentStatusTone = 'draft' | 'warning' | 'success' | 'info' | 'danger' | 'neutral';

const toneClassNames: Record<DocumentStatusTone, string> = {
  draft:
    'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  warning:
    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
  danger:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
  neutral:
    'border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
};

interface DocumentStatusBadgeProps {
  label: React.ReactNode;
  tone?: DocumentStatusTone;
  className?: string;
}

export const DocumentStatusBadge = ({
  label,
  tone = 'neutral',
  className
}: DocumentStatusBadgeProps) => (
  <Badge className={cn('h-8 border px-3 text-sm font-medium', toneClassNames[tone], className)}>
    {label}
  </Badge>
);
