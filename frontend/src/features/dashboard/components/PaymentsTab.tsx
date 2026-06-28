import React from 'react';
import type { EChartsOption } from 'echarts';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
  Hash,
  TrendingUp
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { DashboardChartCard } from './DashboardChartCard';
import { DashboardKpiCard } from './DashboardKpiCard';
import {
  DashboardCurrency,
  DashboardKpi,
  DashboardPaymentMethodPoint,
  DashboardPaymentsSummary,
  DashboardReceivablesAging,
  DashboardTimeSeriesPoint
} from '../types/dashboard.types';
import {
  buildGrid,
  buildTooltipFormatter,
  buildTooltipStyle,
  buildXAxis,
  buildYAxis,
  currencyFormatter,
  getDashboardChartPalette,
  hasNonZeroValues,
  type DashboardChartTheme
} from '../utils/chart-theme';
import { formatDashboardCurrency, formatDashboardNumber } from '../utils/dashboard-formatters';

interface PaymentsTabProps {
  summary?: DashboardPaymentsSummary;
  receivedEvolutionChart?: DashboardTimeSeriesPoint[];
  paidEvolutionChart?: DashboardTimeSeriesPoint[];
  receivedByMethodChart?: DashboardPaymentMethodPoint[];
  paidByMethodChart?: DashboardPaymentMethodPoint[];
  receivablesAgingChart?: DashboardReceivablesAging[];
  payablesAgingChart?: DashboardReceivablesAging[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

export const PaymentsTab = ({
  summary,
  receivedEvolutionChart = [],
  paidEvolutionChart = [],
  receivedByMethodChart = [],
  paidByMethodChart = [],
  receivablesAgingChart = [],
  payablesAgingChart = [],
  currency,
  isLoading,
  isError
}: PaymentsTabProps) => {
  const { t, i18n } = useTranslation('dashboard');
  const { t: tInvoicing } = useTranslation('invoicing');
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

  // Received evolution (line chart)
  const receivedOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!receivedEvolutionChart.length) return undefined;
    return {
      color: [palette[1]],
      tooltip: { trigger: 'axis', confine: true, ...buildTooltipStyle(theme), formatter: buildTooltipFormatter(currency) },
      grid: buildGrid(),
      xAxis: buildXAxis(receivedEvolutionChart.map(p => p.label), theme, { boundaryGap: false }),
      yAxis: buildYAxis(theme, currencyFormatter(currency)),
      series: [{
        name: t('payments.receivedEvolution'),
        type: 'line',
        smooth: 0.3,
        showSymbol: hasNonZeroValues(receivedEvolutionChart),
        symbolSize: 6,
        lineStyle: { width: 2.5 },
        areaStyle: { opacity: 0.08, color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: palette[1] }, { offset: 1, color: 'transparent' }] } },
        data: receivedEvolutionChart.map(p => p.value)
      }]
    };
  }, [receivedEvolutionChart, palette, theme, currency, t]);

  // Paid evolution (line chart)
  const paidOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!paidEvolutionChart.length) return undefined;
    return {
      color: [palette[4]],
      tooltip: { trigger: 'axis', confine: true, ...buildTooltipStyle(theme), formatter: buildTooltipFormatter(currency) },
      grid: buildGrid(),
      xAxis: buildXAxis(paidEvolutionChart.map(p => p.label), theme, { boundaryGap: false }),
      yAxis: buildYAxis(theme, currencyFormatter(currency)),
      series: [{
        name: t('payments.paidEvolution'),
        type: 'line',
        smooth: 0.3,
        showSymbol: hasNonZeroValues(paidEvolutionChart),
        symbolSize: 6,
        lineStyle: { width: 2.5 },
        areaStyle: { opacity: 0.08, color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: palette[4] }, { offset: 1, color: 'transparent' }] } },
        data: paidEvolutionChart.map(p => p.value)
      }]
    };
  }, [paidEvolutionChart, palette, theme, currency, t]);

  // Received by method (pie)
  const receivedMethodOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!receivedByMethodChart.length) return undefined;
    return {
      tooltip: { trigger: 'item', ...buildTooltipStyle(theme) },
      legend: { orient: 'vertical' as const, right: 16, top: 'center', textStyle: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11 } },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        label: { show: false },
        data: receivedByMethodChart.map((p, i) => ({
          name: tInvoicing(p.method, { defaultValue: p.label }),
          value: p.amount,
          itemStyle: { color: palette[i % palette.length] }
        }))
      }]
    };
  }, [receivedByMethodChart, palette, theme, tInvoicing]);

  // Paid by method (pie)
  const paidMethodOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!paidByMethodChart.length) return undefined;
    return {
      tooltip: { trigger: 'item', ...buildTooltipStyle(theme) },
      legend: { orient: 'vertical' as const, right: 16, top: 'center', textStyle: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11 } },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        label: { show: false },
        data: paidByMethodChart.map((p, i) => ({
          name: tInvoicing(p.method, { defaultValue: p.label }),
          value: p.amount,
          itemStyle: { color: palette[i % palette.length] }
        }))
      }]
    };
  }, [paidByMethodChart, palette, theme, tInvoicing]);

  // Receivables aging (bar)
  const receivablesOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!receivablesAgingChart.length) return undefined;
    const agingColors = [palette[1], palette[0], palette[3], palette[4], palette[5]];
    return {
      tooltip: { trigger: 'axis', confine: true, ...buildTooltipStyle(theme), formatter: buildTooltipFormatter(currency) },
      grid: buildGrid(),
      xAxis: { type: 'category' as const, data: receivablesAgingChart.map(b => b.label), axisLabel: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11 }, axisLine: { lineStyle: { color: theme === 'dark' ? '#3f3f46' : '#e4e4e7' } }, axisTick: { show: false } },
      yAxis: buildYAxis(theme, currencyFormatter(currency)),
      series: [{
        name: t('payments.receivablesAging'),
        type: 'bar',
        data: receivablesAgingChart.map((b, i) => ({ value: b.amount, itemStyle: { color: agingColors[i] || palette[0] } })),
        barMaxWidth: 48
      }]
    };
  }, [receivablesAgingChart, palette, theme, currency, t]);

  // Payables aging (bar)
  const payablesOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!payablesAgingChart.length) return undefined;
    const agingColors = [palette[1], palette[0], palette[3], palette[4], palette[5]];
    return {
      tooltip: { trigger: 'axis', confine: true, ...buildTooltipStyle(theme), formatter: buildTooltipFormatter(currency) },
      grid: buildGrid(),
      xAxis: { type: 'category' as const, data: payablesAgingChart.map(b => b.label), axisLabel: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11 }, axisLine: { lineStyle: { color: theme === 'dark' ? '#3f3f46' : '#e4e4e7' } }, axisTick: { show: false } },
      yAxis: buildYAxis(theme, currencyFormatter(currency)),
      series: [{
        name: t('payments.payablesAging'),
        type: 'bar',
        data: payablesAgingChart.map((b, i) => ({ value: b.amount, itemStyle: { color: agingColors[i] || palette[0] } })),
        barMaxWidth: 48
      }]
    };
  }, [payablesAgingChart, palette, theme, currency, t]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {t('payments.summaryTitle')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <DashboardKpiCard title={t('payments.totalReceived')} icon={ArrowDownToLine} kpi={summary?.totalReceived} value={money(summary?.totalReceived)} variant="hero" {...kpiCardProps} />
          <DashboardKpiCard title={t('payments.totalPaid')} icon={ArrowUpFromLine} kpi={summary?.totalPaid} value={money(summary?.totalPaid)} variant="hero" {...kpiCardProps} />
          <DashboardKpiCard title={t('payments.netPayments')} icon={TrendingUp} kpi={summary?.netPayments} value={money(summary?.netPayments)} variant="hero" {...kpiCardProps} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardKpiCard title={t('payments.receivedCount')} icon={Hash} kpi={summary?.receivedCount} value={number(summary?.receivedCount)} {...kpiCardProps} />
          <DashboardKpiCard title={t('payments.paidCount')} icon={Hash} kpi={summary?.paidCount} value={number(summary?.paidCount)} {...kpiCardProps} />
          <DashboardKpiCard title={t('payments.avgCollectionDays')} icon={CalendarClock} kpi={summary?.avgCollectionDays} value={`${number(summary?.avgCollectionDays)} ${t('kpis.days')}`} {...kpiCardProps} />
          <DashboardKpiCard title={t('payments.avgPaymentDays')} icon={CalendarClock} kpi={summary?.avgPaymentDays} value={`${number(summary?.avgPaymentDays)} ${t('kpis.days')}`} {...kpiCardProps} />
        </div>
      </section>

      {/* Evolution charts */}
      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardChartCard title={t('payments.receivedEvolution')} option={receivedOption} isLoading={isLoading} isError={isError} isEmpty={!receivedEvolutionChart.length} emptyLabel={t('empty.chart')} emptyDescription={t('empty.chartDescription')} errorLabel={t('errors.chart')} height={340} />
        <DashboardChartCard title={t('payments.paidEvolution')} option={paidOption} isLoading={isLoading} isError={isError} isEmpty={!paidEvolutionChart.length} emptyLabel={t('empty.chart')} emptyDescription={t('empty.chartDescription')} errorLabel={t('errors.chart')} height={340} />
      </section>

      {/* Method charts */}
      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardChartCard title={t('payments.receivedByMethod')} option={receivedMethodOption} isLoading={isLoading} isError={isError} isEmpty={!receivedByMethodChart.length} emptyLabel={t('empty.chart')} errorLabel={t('errors.chart')} height={300} />
        <DashboardChartCard title={t('payments.paidByMethod')} option={paidMethodOption} isLoading={isLoading} isError={isError} isEmpty={!paidByMethodChart.length} emptyLabel={t('empty.chart')} errorLabel={t('errors.chart')} height={300} />
      </section>

      {/* Aging charts */}
      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardChartCard title={t('payments.receivablesAging')} option={receivablesOption} isLoading={isLoading} isError={isError} isEmpty={!receivablesAgingChart.length} emptyLabel={t('empty.chart')} errorLabel={t('errors.chart')} height={300} />
        <DashboardChartCard title={t('payments.payablesAging')} option={payablesOption} isLoading={isLoading} isError={isError} isEmpty={!payablesAgingChart.length} emptyLabel={t('empty.chart')} errorLabel={t('errors.chart')} height={300} />
      </section>
    </div>
  );
};
