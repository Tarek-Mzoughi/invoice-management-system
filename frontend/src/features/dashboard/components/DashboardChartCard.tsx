import React from 'react';
import dynamic from 'next/dynamic';
import type { EChartsOption } from 'echarts';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => <Skeleton className="h-full min-h-[280px] w-full rounded-lg" />
});

interface DashboardChartCardProps {
  title: string;
  option?: EChartsOption;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  hasData?: boolean;
  emptyLabel: string;
  emptyDescription?: string;
  errorLabel: string;
  height?: number;
  className?: string;
  headerActions?: React.ReactNode;
}

export const DashboardChartCard = ({
  title,
  option,
  isLoading,
  isError,
  isEmpty,
  hasData = true,
  emptyLabel,
  emptyDescription,
  errorLabel,
  height = 320,
  className,
  headerActions
}: DashboardChartCardProps) => (
  <Card className={className}>
    <CardHeader className="px-5 pb-1 pt-4">
      <div className="flex items-center justify-between gap-3">
        <CardTitle className="text-sm font-semibold tracking-tight">{title}</CardTitle>
        {headerActions ? (
          <div className="flex shrink-0 items-center gap-2">{headerActions}</div>
        ) : null}
      </div>
    </CardHeader>
    <CardContent className="px-5 pb-4 pt-1">
      <div className="relative" style={{ height }}>
        {isLoading ? (
          <div className="space-y-3 pt-4">
            <div className="flex items-end gap-2">
              <Skeleton className="h-32 w-full rounded" />
              <Skeleton className="h-20 w-full rounded" />
              <Skeleton className="h-40 w-full rounded" />
              <Skeleton className="h-28 w-full rounded" />
              <Skeleton className="h-36 w-full rounded" />
              <Skeleton className="h-16 w-full rounded" />
            </div>
            <Skeleton className="h-4 w-full rounded" />
          </div>
        ) : isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/20">
            <AlertCircle className="h-8 w-8 text-red-400 dark:text-red-500" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{errorLabel}</p>
          </div>
        ) : isEmpty && !option ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 px-6 dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/60">
              <BarChart3 className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{emptyLabel}</p>
              {emptyDescription ? (
                <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
                  {emptyDescription}
                </p>
              ) : null}
            </div>
          </div>
        ) : option ? (
          <div className="relative h-full w-full">
            <ReactECharts
              option={option}
              notMerge
              lazyUpdate
              style={{ height: '100%', width: '100%' }}
            />
            {!hasData ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-12 text-center">
                <span className="rounded-full bg-zinc-100/90 px-3 py-1 text-xs text-zinc-500 dark:bg-zinc-800/90 dark:text-zinc-400">
                  {emptyLabel}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </CardContent>
  </Card>
);
