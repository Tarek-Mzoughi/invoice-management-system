import React from 'react';
import { LucideIcon, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DashboardKpi } from '../types/dashboard.types';
import { formatTrendPercent, getTrendClassName } from '../utils/dashboard-formatters';

interface DashboardKpiCardProps {
  title: string;
  icon: LucideIcon;
  kpi?: DashboardKpi;
  value: string;
  isLoading?: boolean;
  isError?: boolean;
  errorLabel: string;
  comparisonLabel: string;
  scopeLabel: string;
  variant?: 'default' | 'hero';
}

const trendIcons = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus
};

export const DashboardKpiCard = ({
  title,
  icon: Icon,
  kpi,
  value,
  isLoading,
  isError,
  errorLabel,
  comparisonLabel,
  scopeLabel,
  variant = 'default'
}: DashboardKpiCardProps) => {
  const TrendIcon = trendIcons[kpi?.trend ?? 'neutral'];
  const isHero = variant === 'hero';

  return (
    <Card
      className={cn(
        'overflow-hidden transition-shadow hover:shadow-md',
        isHero && 'border-zinc-300 dark:border-zinc-700'
      )}
    >
      <CardContent className={cn('p-4', isHero && 'p-5')}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p
              className={cn(
                'truncate text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400',
                isHero && 'text-[11px]'
              )}
            >
              {title}
            </p>
            {isLoading ? (
              <Skeleton className={cn('h-8 w-28', isHero && 'h-9 w-36')} />
            ) : isError ? (
              <p className="text-sm font-medium text-red-600 dark:text-red-300">{errorLabel}</p>
            ) : (
              <p
                className={cn(
                  'text-2xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50',
                  isHero && 'text-3xl font-bold'
                )}
              >
                {value}
              </p>
            )}
          </div>
          <div
            className={cn(
              'flex shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
              isHero ? 'h-11 w-11' : 'h-9 w-9'
            )}
          >
            <Icon className={cn(isHero ? 'h-5 w-5' : 'h-4 w-4')} />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          {isLoading ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <Badge
              variant="outline"
              className={cn('gap-1 px-2 py-0.5 text-xs', getTrendClassName(kpi?.trend ?? 'neutral'))}
            >
              <TrendIcon className="h-3 w-3" />
              {formatTrendPercent(kpi?.changePercent)}
            </Badge>
          )}
          <span className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
            {kpi?.previousValue !== undefined ? comparisonLabel : scopeLabel}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
