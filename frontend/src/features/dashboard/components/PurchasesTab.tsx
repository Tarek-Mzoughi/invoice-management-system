import React from 'react';
import type { EChartsOption } from 'echarts';
import {
  Banknote,
  Building2,
  FileCheck2,
  FileClock,
  FileText,
  Receipt,
  ShoppingBag,
  TrendingDown
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { DashboardChartCard } from './DashboardChartCard';
import { DashboardKpiCard } from './DashboardKpiCard';
import {
  DashboardCurrency,
  DashboardKpi,
  DashboardMultiSeriesPoint,
  DashboardPaymentMethodPoint,
  DashboardPurchasesSummary,
  DashboardReceivablesAging,
  DashboardStatusPoint,
  DashboardTimeSeriesPoint,
  DashboardTopSupplier
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

interface PurchasesTabProps {
  summary?: DashboardPurchasesSummary;
  purchasesChart?: DashboardTimeSeriesPoint[];
  purchasesVsPaymentsChart?: DashboardMultiSeriesPoint[];
  buyingInvoiceStatusChart?: DashboardStatusPoint[];
  payablesAgingChart?: DashboardReceivablesAging[];
  topSuppliers?: DashboardTopSupplier[];
  buyingPaymentMethodsChart?: DashboardPaymentMethodPoint[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

export const PurchasesTab = ({
  summary,
  purchasesChart = [],
  purchasesVsPaymentsChart = [],
  buyingInvoiceStatusChart = [],
  payablesAgingChart = [],
  topSuppliers = [],
  buyingPaymentMethodsChart = [],
  currency,
  isLoading,
  isError
}: PurchasesTabProps) => {
  const { t, i18n } = useTranslation('dashboard');
  const { t: tInvoicing } = useTranslation('invoicing');
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

  const kpiCardProps = {
    isLoading,
    isError,
    errorLabel: t('errors.kpi'),
    comparisonLabel: t('kpis.comparison'),
    scopeLabel: t('kpis.scope')
  };

  // Purchases monthly chart
  const purchasesOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!purchasesChart.length) return undefined;
    return {
      color: [palette[4]],
      tooltip: { trigger: 'axis', confine: true, ...buildTooltipStyle(theme), formatter: buildTooltipFormatter(currency) },
      grid: buildGrid(),
      xAxis: buildXAxis(purchasesChart.map(p => p.label), theme, { boundaryGap: false }),
      yAxis: buildYAxis(theme, currencyFormatter(currency)),
      series: [{
        name: t('purchases.chartTitle'),
        type: 'line',
        smooth: 0.3,
        showSymbol: hasNonZeroValues(purchasesChart),
        symbolSize: 6,
        lineStyle: { width: 2.5 },
        areaStyle: { opacity: 0.08, color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: palette[4] }, { offset: 1, color: 'transparent' }] } },
        data: purchasesChart.map(p => p.value)
      }]
    };
  }, [purchasesChart, palette, theme, currency, t]);

  // Purchases vs Payments chart
  const vsPaymentsOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!purchasesVsPaymentsChart.length) return undefined;
    return {
      color: [palette[4], palette[1]],
      tooltip: { trigger: 'axis', confine: true, ...buildTooltipStyle(theme), formatter: buildTooltipFormatter(currency) },
      legend: { data: [t('purchases.purchases'), t('purchases.payments')], textStyle: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11 }, bottom: 0 },
      grid: buildGrid({ bottom: 56 }),
      xAxis: buildXAxis(purchasesVsPaymentsChart.map(p => p.label), theme),
      yAxis: buildYAxis(theme, currencyFormatter(currency)),
      series: [
        { name: t('purchases.purchases'), type: 'bar', barGap: '10%', data: purchasesVsPaymentsChart.map(p => p.revenue) },
        { name: t('purchases.payments'), type: 'bar', data: purchasesVsPaymentsChart.map(p => p.collected) }
      ]
    };
  }, [purchasesVsPaymentsChart, palette, theme, currency, t]);

  // Buying invoice status chart (pie)
  const statusOption = React.useMemo<EChartsOption | undefined>(() => {
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

  // Payables aging chart (bar)
  const agingOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!payablesAgingChart.length) return undefined;
    const agingColors = [palette[1], palette[0], palette[3], palette[4], palette[5]];
    return {
      tooltip: { trigger: 'axis', confine: true, ...buildTooltipStyle(theme), formatter: buildTooltipFormatter(currency) },
      grid: buildGrid(),
      xAxis: { type: 'category' as const, data: payablesAgingChart.map(b => b.label), axisLabel: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11 }, axisLine: { lineStyle: { color: theme === 'dark' ? '#3f3f46' : '#e4e4e7' } }, axisTick: { show: false } },
      yAxis: buildYAxis(theme, currencyFormatter(currency)),
      series: [{
        name: t('purchases.payablesAging'),
        type: 'bar',
        data: payablesAgingChart.map((b, i) => ({ value: b.amount, itemStyle: { color: agingColors[i] || palette[0] } })),
        barMaxWidth: 48
      }]
    };
  }, [payablesAgingChart, palette, theme, currency, t]);

  // Top suppliers chart (horizontal bar)
  const topSuppliersOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!topSuppliers.length) return undefined;
    const sorted = [...topSuppliers].reverse();
    return {
      tooltip: { trigger: 'axis', confine: true, ...buildTooltipStyle(theme), formatter: buildTooltipFormatter(currency) },
      grid: buildGrid({ left: 120 }),
      xAxis: buildYAxis(theme, currencyFormatter(currency)),
      yAxis: { type: 'category' as const, data: sorted.map(s => s.supplierName), axisLabel: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11, width: 100, overflow: 'truncate' as const }, axisLine: { show: false }, axisTick: { show: false } },
      series: [{
        name: t('purchases.totalPurchases'),
        type: 'bar',
        data: sorted.map(s => s.totalPurchases),
        barMaxWidth: 28,
        itemStyle: { color: palette[4], borderRadius: [0, 4, 4, 0] }
      }]
    };
  }, [topSuppliers, palette, theme, currency, t]);

  // Buying payment methods (pie)
  const paymentMethodsOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!buyingPaymentMethodsChart.length) return undefined;
    return {
      tooltip: { trigger: 'item', ...buildTooltipStyle(theme) },
      legend: { orient: 'vertical' as const, right: 16, top: 'center', textStyle: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11 } },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        label: { show: false },
        data: buyingPaymentMethodsChart.map((p, i) => ({
          name: tInvoicing(p.method, { defaultValue: p.label }),
          value: p.amount,
          itemStyle: { color: palette[i % palette.length] }
        }))
      }]
    };
  }, [buyingPaymentMethodsChart, palette, theme, tInvoicing]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {t('purchases.summaryTitle')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardKpiCard title={t('purchases.totalPurchases')} icon={ShoppingBag} kpi={summary?.totalPurchases} value={money(summary?.totalPurchases)} variant="hero" {...kpiCardProps} />
          <DashboardKpiCard title={t('purchases.currentMonth')} icon={Banknote} kpi={summary?.currentMonthPurchases} value={money(summary?.currentMonthPurchases)} variant="hero" {...kpiCardProps} />
          <DashboardKpiCard title={t('purchases.paidToSuppliers')} icon={Receipt} kpi={summary?.amountPaidToSuppliers} value={money(summary?.amountPaidToSuppliers)} variant="hero" {...kpiCardProps} />
          <DashboardKpiCard title={t('purchases.remainingPayables')} icon={TrendingDown} kpi={summary?.remainingPayables} value={money(summary?.remainingPayables)} variant="hero" {...kpiCardProps} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardKpiCard title={t('purchases.totalInvoices')} icon={FileText} kpi={summary?.totalBuyingInvoices} value={number(summary?.totalBuyingInvoices)} {...kpiCardProps} />
          <DashboardKpiCard title={t('purchases.paidInvoices')} icon={FileCheck2} kpi={summary?.paidBuyingInvoices} value={number(summary?.paidBuyingInvoices)} {...kpiCardProps} />
          <DashboardKpiCard title={t('purchases.unpaidInvoices')} icon={FileClock} kpi={summary?.unpaidBuyingInvoices} value={number(summary?.unpaidBuyingInvoices)} {...kpiCardProps} />
          <DashboardKpiCard title={t('purchases.overduePayables')} icon={Building2} kpi={summary?.payablesAgingOverdue} value={number(summary?.payablesAgingOverdue)} {...kpiCardProps} />
        </div>
      </section>

      {/* Charts row 1: Purchases monthly + Purchases vs Payments */}
      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardChartCard
          title={t('purchases.chartTitle')}
          option={purchasesOption}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!purchasesChart.length}
          emptyLabel={t('empty.chart')}
          emptyDescription={t('empty.chartDescription')}
          errorLabel={t('errors.chart')}
          height={340}
        />
        <DashboardChartCard
          title={t('purchases.vsPaymentsTitle')}
          option={vsPaymentsOption}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!purchasesVsPaymentsChart.length}
          emptyLabel={t('empty.chart')}
          emptyDescription={t('empty.chartDescription')}
          errorLabel={t('errors.chart')}
          height={340}
        />
      </section>

      {/* Charts row 2: Status + Payables aging */}
      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardChartCard
          title={t('purchases.invoiceStatusTitle')}
          option={statusOption}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!buyingInvoiceStatusChart.length}
          emptyLabel={t('empty.chart')}
          errorLabel={t('errors.chart')}
          height={300}
        />
        <DashboardChartCard
          title={t('purchases.payablesAgingTitle')}
          option={agingOption}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!payablesAgingChart.length}
          emptyLabel={t('empty.chart')}
          errorLabel={t('errors.chart')}
          height={300}
        />
      </section>

      {/* Charts row 3: Top suppliers + Payment methods */}
      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardChartCard
          title={t('purchases.topSuppliersTitle')}
          option={topSuppliersOption}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!topSuppliers.length}
          emptyLabel={t('empty.chart')}
          errorLabel={t('errors.chart')}
          height={340}
        />
        <DashboardChartCard
          title={t('purchases.paymentMethodsTitle')}
          option={paymentMethodsOption}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!buyingPaymentMethodsChart.length}
          emptyLabel={t('empty.chart')}
          errorLabel={t('errors.chart')}
          height={340}
        />
      </section>
    </div>
  );
};
