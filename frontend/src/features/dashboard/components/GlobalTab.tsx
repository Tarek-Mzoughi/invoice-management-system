import React from 'react';
import type { EChartsOption } from 'echarts';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Clock,
  CreditCard,
  FileText,
  Landmark,
  Percent,
  ShoppingBag,
  TrendingUp
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { DashboardChartCard } from './DashboardChartCard';
import { DashboardKpiCard } from './DashboardKpiCard';
import {
  DashboardCashFlowPoint,
  DashboardCurrency,
  DashboardGlobalSummary,
  DashboardKpi,
  DashboardRevenueVsPurchasesPoint,
  DashboardStatusPoint
} from '../types/dashboard.types';
import {
  buildGrid,
  buildTooltipFormatter,
  buildTooltipStyle,
  buildXAxis,
  buildYAxis,
  currencyFormatter,
  getDashboardChartPalette,
  getStatusColors,
  hasNonZeroValues,
  type DashboardChartTheme
} from '../utils/chart-theme';
import { formatDashboardCurrency, formatDashboardNumber } from '../utils/dashboard-formatters';

interface GlobalTabProps {
  summary?: DashboardGlobalSummary;
  revenueVsPurchasesChart?: DashboardRevenueVsPurchasesPoint[];
  cashFlowSummaryChart?: DashboardCashFlowPoint[];
  sellingInvoiceStatusChart?: DashboardStatusPoint[];
  buyingInvoiceStatusChart?: DashboardStatusPoint[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

export const GlobalTab = ({
  summary,
  revenueVsPurchasesChart = [],
  cashFlowSummaryChart = [],
  sellingInvoiceStatusChart = [],
  buyingInvoiceStatusChart = [],
  currency,
  isLoading,
  isError
}: GlobalTabProps) => {
  const { t, i18n } = useTranslation('dashboard');
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme === 'dark' ? 'dark' : 'light') as DashboardChartTheme;
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const palette = getDashboardChartPalette(theme);
  const statusColors = getStatusColors(theme);

  const money = React.useCallback(
    (kpi?: DashboardKpi) => formatDashboardCurrency(kpi?.value || 0, currency, locale),
    [currency, locale]
  );
  const number = React.useCallback(
    (kpi?: DashboardKpi) => formatDashboardNumber(kpi?.value || 0, locale),
    [locale]
  );
  const percent = React.useCallback(
    (kpi?: DashboardKpi) =>
      `${Number(kpi?.value || 0).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`,
    [locale]
  );

  const kpiCardProps = {
    isLoading,
    isError,
    errorLabel: t('errors.kpi'),
    comparisonLabel: t('kpis.comparison'),
    scopeLabel: t('kpis.scope')
  };

  // Revenue vs Purchases chart (line)
  const revenueVsPurchasesOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!revenueVsPurchasesChart.length) return undefined;
    return {
      color: [palette[0], palette[4], palette[1]],
      tooltip: { trigger: 'axis', confine: true, ...buildTooltipStyle(theme), formatter: buildTooltipFormatter(currency) },
      legend: { data: [t('global.revenue'), t('global.purchases'), t('global.net')], textStyle: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11 }, bottom: 0 },
      grid: buildGrid({ bottom: 56 }),
      xAxis: buildXAxis(revenueVsPurchasesChart.map(p => p.label), theme, { boundaryGap: false }),
      yAxis: buildYAxis(theme, currencyFormatter(currency)),
      series: [
        {
          name: t('global.revenue'),
          type: 'line',
          smooth: 0.3,
          showSymbol: hasNonZeroValues(revenueVsPurchasesChart.map(p => ({ value: p.revenue }))),
          symbolSize: 6,
          lineStyle: { width: 2.5 },
          areaStyle: { opacity: 0.08, color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: palette[0] }, { offset: 1, color: 'transparent' }] } },
          data: revenueVsPurchasesChart.map(p => p.revenue)
        },
        {
          name: t('global.purchases'),
          type: 'line',
          smooth: 0.3,
          showSymbol: hasNonZeroValues(revenueVsPurchasesChart.map(p => ({ value: p.purchases }))),
          symbolSize: 6,
          lineStyle: { width: 2.5 },
          areaStyle: { opacity: 0.08, color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: palette[4] }, { offset: 1, color: 'transparent' }] } },
          data: revenueVsPurchasesChart.map(p => p.purchases)
        },
        {
          name: t('global.net'),
          type: 'line',
          smooth: 0.3,
          showSymbol: hasNonZeroValues(revenueVsPurchasesChart.map(p => ({ value: p.net }))),
          symbolSize: 6,
          lineStyle: { width: 2, type: 'dashed' },
          data: revenueVsPurchasesChart.map(p => p.net)
        }
      ]
    };
  }, [revenueVsPurchasesChart, palette, theme, currency, t]);

  // Cash flow summary chart (bar + line)
  const cashFlowOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!cashFlowSummaryChart.length) return undefined;
    return {
      color: [palette[1], palette[4], palette[0]],
      tooltip: { trigger: 'axis', confine: true, ...buildTooltipStyle(theme), formatter: buildTooltipFormatter(currency) },
      legend: { data: [t('global.inflows'), t('global.outflows'), t('global.net')], textStyle: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11 }, bottom: 0 },
      grid: buildGrid({ bottom: 56 }),
      xAxis: buildXAxis(cashFlowSummaryChart.map(p => p.label), theme),
      yAxis: buildYAxis(theme, currencyFormatter(currency)),
      series: [
        {
          name: t('global.inflows'),
          type: 'bar',
          barGap: '10%',
          data: cashFlowSummaryChart.map(p => p.inflows)
        },
        {
          name: t('global.outflows'),
          type: 'bar',
          data: cashFlowSummaryChart.map(p => p.outflows)
        },
        {
          name: t('global.net'),
          type: 'line',
          smooth: 0.3,
          showSymbol: hasNonZeroValues(cashFlowSummaryChart.map(p => ({ value: p.net }))),
          symbolSize: 6,
          lineStyle: { width: 2.5 },
          data: cashFlowSummaryChart.map(p => p.net)
        }
      ]
    };
  }, [cashFlowSummaryChart, palette, theme, currency, t]);

  // Selling invoice status chart (pie)
  const sellingStatusOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!sellingInvoiceStatusChart.length) return undefined;
    const colorMap: Record<string, string> = { paid: statusColors.paid, unpaid: statusColors.unpaid, partiallyPaid: statusColors.partial };
    return {
      tooltip: { trigger: 'item', ...buildTooltipStyle(theme) },
      legend: { orient: 'vertical' as const, right: 16, top: 'center', textStyle: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11 } },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        label: { show: false },
        data: sellingInvoiceStatusChart.map(p => ({
          name: t(`invoiceStatus.${p.status}`, { defaultValue: p.label }),
          value: p.value,
          itemStyle: { color: colorMap[p.status] || palette[3] }
        }))
      }]
    };
  }, [sellingInvoiceStatusChart, statusColors, palette, theme, t]);

  // Buying invoice status chart (pie)
  const buyingStatusOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!buyingInvoiceStatusChart.length) return undefined;
    const colorMap: Record<string, string> = { paid: statusColors.paid, unpaid: statusColors.unpaid, partiallyPaid: statusColors.partial };
    return {
      tooltip: { trigger: 'item', ...buildTooltipStyle(theme) },
      legend: { orient: 'vertical' as const, right: 16, top: 'center', textStyle: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11 } },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        label: { show: false },
        data: buyingInvoiceStatusChart.map(p => ({
          name: t(`invoiceStatus.${p.status}`, { defaultValue: p.label }),
          value: p.value,
          itemStyle: { color: colorMap[p.status] || palette[3] }
        }))
      }]
    };
  }, [buyingInvoiceStatusChart, statusColors, palette, theme, t]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {t('global.summaryTitle')}
        </h2>
        {/* Hero row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardKpiCard title={t('global.totalRevenue')} icon={TrendingUp} kpi={summary?.totalRevenue} value={money(summary?.totalRevenue)} variant="hero" {...kpiCardProps} />
          <DashboardKpiCard title={t('global.totalPurchases')} icon={ShoppingBag} kpi={summary?.totalPurchases} value={money(summary?.totalPurchases)} variant="hero" {...kpiCardProps} />
          <DashboardKpiCard title={t('global.netMargin')} icon={BarChart3} kpi={summary?.netMargin} value={money(summary?.netMargin)} variant="hero" {...kpiCardProps} />
          <DashboardKpiCard title={t('global.treasuryBalance')} icon={Landmark} kpi={summary?.treasuryBalance} value={money(summary?.treasuryBalance)} variant="hero" {...kpiCardProps} />
        </div>
        {/* Payment row */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardKpiCard title={t('global.totalCollected')} icon={ArrowDownToLine} kpi={summary?.totalCollected} value={money(summary?.totalCollected)} {...kpiCardProps} />
          <DashboardKpiCard title={t('global.totalPaidToSuppliers')} icon={ArrowUpFromLine} kpi={summary?.totalPaidToSuppliers} value={money(summary?.totalPaidToSuppliers)} {...kpiCardProps} />
          <DashboardKpiCard title={t('global.totalReceivables')} icon={Clock} kpi={summary?.totalReceivables} value={money(summary?.totalReceivables)} {...kpiCardProps} />
          <DashboardKpiCard title={t('global.totalPayables')} icon={Clock} kpi={summary?.totalPayables} value={money(summary?.totalPayables)} {...kpiCardProps} />
        </div>
        {/* Performance row */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardKpiCard title={t('global.collectionRate')} icon={Percent} kpi={summary?.collectionRate} value={percent(summary?.collectionRate)} {...kpiCardProps} />
          <DashboardKpiCard title={t('global.paymentRate')} icon={Percent} kpi={summary?.paymentRate} value={percent(summary?.paymentRate)} {...kpiCardProps} />
          <DashboardKpiCard title={t('global.totalInvoices')} icon={FileText} kpi={summary?.totalInvoices} value={number(summary?.totalInvoices)} {...kpiCardProps} />
          <DashboardKpiCard title={t('global.totalPayments')} icon={CreditCard} kpi={summary?.totalPayments} value={number(summary?.totalPayments)} {...kpiCardProps} />
        </div>
      </section>

      {/* Charts row 1: Revenue vs Purchases + Cash flow summary */}
      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardChartCard
          title={t('global.revenueVsPurchases')}
          option={revenueVsPurchasesOption}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!revenueVsPurchasesChart.length}
          emptyLabel={t('empty.chart')}
          emptyDescription={t('empty.chartDescription')}
          errorLabel={t('errors.chart')}
          height={340}
        />
        <DashboardChartCard
          title={t('global.cashFlowSummary')}
          option={cashFlowOption}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!cashFlowSummaryChart.length}
          emptyLabel={t('empty.chart')}
          emptyDescription={t('empty.chartDescription')}
          errorLabel={t('errors.chart')}
          height={340}
        />
      </section>

      {/* Charts row 2: Selling invoice status + Buying invoice status */}
      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardChartCard
          title={t('global.sellingInvoiceStatus')}
          option={sellingStatusOption}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!sellingInvoiceStatusChart.length}
          emptyLabel={t('empty.chart')}
          errorLabel={t('errors.chart')}
          height={300}
        />
        <DashboardChartCard
          title={t('global.buyingInvoiceStatus')}
          option={buyingStatusOption}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!buyingInvoiceStatusChart.length}
          emptyLabel={t('empty.chart')}
          errorLabel={t('errors.chart')}
          height={300}
        />
      </section>
    </div>
  );
};
