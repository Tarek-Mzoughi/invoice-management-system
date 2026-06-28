import React from 'react';
import { cn } from '@/lib/utils';

interface FirmListLayoutProps {
  className?: string;
  table: React.ReactNode;
  toolbar: React.ReactNode;
}

export const firmPanelClassName =
  'rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950';

export const firmFieldClassName =
  'h-11 rounded-md border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950';

export const firmLabelClassName = 'text-sm font-medium text-zinc-700 dark:text-zinc-300';
export const firmTextClassName = 'text-zinc-700 dark:text-zinc-300';
export const firmMutedTextClassName = 'text-zinc-500 dark:text-zinc-400';

export function FirmListLayout({ className, table, toolbar }: FirmListLayoutProps) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-6 pb-6', className)}>
      {toolbar}
      {table}
    </div>
  );
}

