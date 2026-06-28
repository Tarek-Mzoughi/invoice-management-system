import React from 'react';
import type { EChartsOption } from 'echarts';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  CreditCard,
  Landmark,
  TrendingUp
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardChartCard } from './DashboardChartCard';
import { DashboardKpiCard } from './DashboardKpiCard';
import {
  DashboardBankBalance,
  DashboardCashFlowPoint,
  DashboardCurrency,
  DashboardKpi,
  DashboardPaymentMethodPoint,
  DashboardTreasurySummary
} from '../types/dashboard.types';
import {
  buildGrid,
  buildTooltipStyle,
  buildXAxis,
  buildYAxis,
  currencyFormatter,
  getDashboardChartPalette,
  type DashboardChartTheme
} from '../utils/chart-theme';
import { formatDashboardCurrency, formatDashboardNumber } from '../utils/dashboard-formatters';

interface TreasuryTabProps {
  summary?: DashboardTreasurySummary;
  bankBalances?: DashboardBankBalance[];
  cashFlowChart?: DashboardCashFlowPoint[];
  inflowsByCategory?: DashboardPaymentMethodPoint[];
  outflowsByCategory?: DashboardPaymentMethodPoint[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

export const TreasuryTab = ({
  summary,
  bankBalances = [],
  cashFlowChart = [],
  inflowsByCategory = [],
  outflowsByCategory = [],
  currency,
  isLoading,
  isError
}: TreasuryTabProps) => {
  const { t, i18n } = useTranslation('dashboard');
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme === 'dark' ? 'dark' : 'light') as DashboardChartTheme;
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const palette = getDashboardChartPalette(theme);

  const money = React.useCallback(
    (kpi?: DashboardKpi) => formatDashboardCurrency(kpi?.value || 0, currency, locale),
    [currency, locale]
  );
  const number = React.useCallback(
    (kpi?: DashboardKpi) => formatDashboardNumber(kpi?.value || 0, locale),
    [locale]
  );

  const kpiCardProps = {
    isLoading,
    isError,
    errorLabel: t('errors.kpi'),
    comparisonLabel: t('kpis.comparison'),
    scopeLabel: t('kpis.scope')
  };

  // Cash flow chart (bar + line)
  const cashFlowOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!cashFlowChart.length) return undefined;
    return {
      color: [palette[1], palette[5], palette[2]],
      tooltip: {
        trigger: 'axis',
        confine: true,
        ...buildTooltipStyle(theme),
        formatter: (params: unknown) => {
          const items = (Array.isArray(params) ? params : [params]) as Array<{
            axisValueLabel?: string; marker?: string; seriesName?: string; value?: number;
          }>;
          const title = items[0]?.axisValueLabel || '';
          const rows = items.map(item => {
            const val = formatDashboardCurrency(item.value || 0, currency, locale);
            return `<div style="display:flex;gap:12px;align-items:center;justify-content:space-between;margin-top:4px"><span>${item.marker}${item.seriesName}</span><strong>${val}</strong></div>`;
          }).join('');
          return `<div style="min-width:180px"><div style="font-weight:600;margin-bottom:6px">${title}</div>${rows}</div>`;
        }
      },
      legend: {
        data: [t('treasury.inflows'), t('treasury.outflows'), t('treasury.net')],
        textStyle: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11 },
        bottom: 0
      },
      grid: buildGrid({ bottom: 56 }),
      xAxis: buildXAxis(cashFlowChart.map(p => p.label), theme),
      yAxis: buildYAxis(theme, currencyFormatter(currency)),
      series: [
        { name: t('treasury.inflows'), type: 'bar', stack: 'flow', data: cashFlowChart.map(p => p.inflows), barMaxWidth: 32 },
        { name: t('treasury.outflows'), type: 'bar', stack: 'flow', data: cashFlowChart.map(p => -p.outflows), barMaxWidth: 32 },
        { name: t('treasury.net'), type: 'line', smooth: 0.3, showSymbol: true, symbolSize: 6, lineStyle: { width: 2.5 }, data: cashFlowChart.map(p => p.net) }
      ]
    };
  }, [cashFlowChart, palette, theme, currency, locale, t]);

  // Bank balances chart (horizontal bar)
  const bankBalancesOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!bankBalances.length) return undefined;
    const sorted = [...bankBalances].sort((a, b) => b.balance - a.balance);
    return {
      tooltip: {
        trigger: 'axis',
        confine: true,
        ...buildTooltipStyle(theme),
        formatter: (params: unknown) => {
          const items = (Array.isArray(params) ? params : [params]) as Array<{
            name?: string; marker?: string; seriesName?: string; value?: number;
          }>;
          const title = items[0]?.name || '';
          const rows = items.map(item => {
            const val = formatDashboardCurrency(item.value || 0, currency, locale);
            return `<div style="display:flex;gap:12px;align-items:center;justify-content:space-between;margin-top:4px"><span>${item.marker}${item.seriesName}</span><strong>${val}</strong></div>`;
          }).join('');
          return `<div style="min-width:180px"><div style="font-weight:600;margin-bottom:6px">${title}</div>${rows}</div>`;
        }
      },
      grid: buildGrid({ left: 140 }),
      xAxis: { type: 'value' as const, axisLabel: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11, formatter: currencyFormatter(currency) }, splitLine: { lineStyle: { color: theme === 'dark' ? '#27272a' : '#f4f4f5', type: 'dashed' as const } } },
      yAxis: { type: 'category' as const, data: sorted.map(b => b.bankAccountName), axisLabel: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11, width: 120, overflow: 'truncate' as const }, axisLine: { show: false }, axisTick: { show: false } },
      series: [{
        name: t('treasury.balance'),
        type: 'bar',
        data: sorted.map((b, i) => ({
          value: b.balance,
          itemStyle: { color: b.balance >= 0 ? palette[1] : palette[5], borderRadius: b.balance >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4] }
        })),
        barMaxWidth: 28
      }]
    };
  }, [bankBalances, palette, theme, currency, locale, t]);

  // Category pie charts helper
  const categoryPieOption = React.useCallback(
    (data: DashboardPaymentMethodPoint[], title: string): EChartsOption | undefined => {
      if (!data.length) return undefined;
      return {
        tooltip: { trigger: 'item', ...buildTooltipStyle(theme) },
        legend: { orient: 'vertical' as const, right: 16, top: 'center', textStyle: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11 } },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          label: { show: false },
          data: data.map((p, i) => ({
            name: t(`treasuryKinds.${p.method}`, { defaultValue: p.label }),
            value: p.amount,
            itemStyle: { color: palette[i % palette.length] }
          }))
        }]
      };
    },
    [palette, theme, t]
  );

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {t('treasury.summaryTitle')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardKpiCard title={t('treasury.totalBalance')} icon={Landmark} kpi={summary?.totalBalance} value={money(summary?.totalBalance)} variant="hero" {...kpiCardProps} />
          <DashboardKpiCard title={t('treasury.totalInflows')} icon={ArrowDownLeft} kpi={summary?.totalInflows} value={money(summary?.totalInflows)} {...kpiCardProps} />
          <DashboardKpiCard title={t('treasury.totalOutflows')} icon={ArrowUpRight} kpi={summary?.totalOutflows} value={money(summary?.totalOutflows)} {...kpiCardProps} />
          <DashboardKpiCard title={t('treasury.netCashFlow')} icon={TrendingUp} kpi={summary?.netCashFlow} value={money(summary?.netCashFlow)} {...kpiCardProps} />
          <DashboardKpiCard title={t('treasury.movements')} icon={CreditCard} kpi={summary?.movementsCount} value={number(summary?.movementsCount)} {...kpiCardProps} />
        </div>
      </section>

      {/* Cash flow chart */}
      <section>
        <DashboardChartCard
          title={t('treasury.cashFlowTitle')}
          option={cashFlowOption}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!cashFlowChart.length}
          emptyLabel={t('empty.chart')}
          emptyDescription={t('empty.chartDescription')}
          errorLabel={t('errors.chart')}
          height={380}
        />
      </section>

      {/* Bank balances */}
      <section>
        <DashboardChartCard
          title={t('treasury.bankBalancesTitle')}
          option={bankBalancesOption}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!bankBalances.length}
          emptyLabel={t('empty.chart')}
          errorLabel={t('errors.chart')}
          height={Math.max(200, bankBalances.length * 48 + 80)}
        />
      </section>

      {/* Inflows / Outflows by category */}
      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardChartCard
          title={t('treasury.inflowsByCategoryTitle')}
          option={categoryPieOption(inflowsByCategory, t('treasury.inflows'))}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!inflowsByCategory.length}
          emptyLabel={t('empty.chart')}
          errorLabel={t('errors.chart')}
          height={300}
        />
        <DashboardChartCard
          title={t('treasury.outflowsByCategoryTitle')}
          option={categoryPieOption(outflowsByCategory, t('treasury.outflows'))}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!outflowsByCategory.length}
          emptyLabel={t('empty.chart')}
          errorLabel={t('errors.chart')}
          height={300}
        />
      </section>

      {/* Bank accounts table */}
      {bankBalances.length > 0 && !isLoading && (
        <section>
          <Card>
            <CardHeader className="px-5 pb-1 pt-4">
              <CardTitle className="text-sm font-semibold tracking-tight">{t('treasury.accountsTableTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      <th className="pb-2 pr-4">{t('treasury.account')}</th>
                      <th className="pb-2 pr-4">{t('treasury.type')}</th>
                      <th className="pb-2 pr-4 text-right">{t('treasury.inflows')}</th>
                      <th className="pb-2 pr-4 text-right">{t('treasury.outflows')}</th>
                      <th className="pb-2 text-right">{t('treasury.balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankBalances.map(b => (
                      <tr key={b.bankAccountId} className="border-b border-zinc-100 dark:border-zinc-800/50">
                        <td className="py-2.5 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{b.bankAccountName}</td>
                        <td className="py-2.5 pr-4 text-zinc-500 dark:text-zinc-400">{t(`treasury.accountTypes.${b.accountType}`, { defaultValue: b.accountType })}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatDashboardCurrency(b.inflowsTotal, currency, locale)}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-red-600 dark:text-red-400">{formatDashboardCurrency(b.outflowsTotal, currency, locale)}</td>
                        <td className={`py-2.5 text-right font-semibold tabular-nums ${b.balance >= 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-400'}`}>
                          {formatDashboardCurrency(b.balance, currency, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
};
