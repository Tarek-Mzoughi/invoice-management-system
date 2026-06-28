import React from 'react';
import type { EChartsOption } from 'echarts';
import {
  Boxes,
  Building2,
  ClipboardList,
  Files,
  ShoppingCart,
  Users
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { DashboardChartCard } from './DashboardChartCard';
import { DashboardKpiCard } from './DashboardKpiCard';
import {
  DashboardCurrency,
  DashboardKpi,
  DashboardQuotationStats,
  DashboardReferentialsSummary,
  DashboardTopArticle,
  DashboardTopClient,
  DashboardTopSupplier
} from '../types/dashboard.types';
import {
  buildGrid,
  buildTooltipFormatter,
  buildTooltipStyle,
  buildYAxis,
  currencyFormatter,
  getDashboardChartPalette,
  type DashboardChartTheme
} from '../utils/chart-theme';
import { formatDashboardCurrency, formatDashboardNumber } from '../utils/dashboard-formatters';

interface ReferentialsTabProps {
  summary?: DashboardReferentialsSummary;
  topClientsByRevenue?: DashboardTopClient[];
  topSuppliersByPurchases?: DashboardTopSupplier[];
  topArticlesByRevenue?: DashboardTopArticle[];
  quotationStats?: DashboardQuotationStats;
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

export const ReferentialsTab = ({
  summary,
  topClientsByRevenue = [],
  topSuppliersByPurchases = [],
  topArticlesByRevenue = [],
  quotationStats,
  currency,
  isLoading,
  isError
}: ReferentialsTabProps) => {
  const { t, i18n } = useTranslation('dashboard');
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme === 'dark' ? 'dark' : 'light') as DashboardChartTheme;
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const palette = getDashboardChartPalette(theme);

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

  // Top clients (horizontal bar)
  const topClientsOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!topClientsByRevenue.length) return undefined;
    const sorted = [...topClientsByRevenue].reverse();
    return {
      tooltip: { trigger: 'axis', confine: true, ...buildTooltipStyle(theme), formatter: buildTooltipFormatter(currency) },
      grid: buildGrid({ left: 120 }),
      xAxis: buildYAxis(theme, currencyFormatter(currency)),
      yAxis: { type: 'category' as const, data: sorted.map(c => c.clientName), axisLabel: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11, width: 100, overflow: 'truncate' as const }, axisLine: { show: false }, axisTick: { show: false } },
      series: [{
        name: t('charts.revenue'),
        type: 'bar',
        data: sorted.map(c => c.revenue),
        barMaxWidth: 28,
        itemStyle: { color: palette[0], borderRadius: [0, 4, 4, 0] }
      }]
    };
  }, [topClientsByRevenue, palette, theme, currency, t]);

  // Top suppliers (horizontal bar)
  const topSuppliersOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!topSuppliersByPurchases.length) return undefined;
    const sorted = [...topSuppliersByPurchases].reverse();
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
  }, [topSuppliersByPurchases, palette, theme, currency, t]);

  // Top articles (horizontal bar)
  const topArticlesOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!topArticlesByRevenue.length) return undefined;
    const sorted = [...topArticlesByRevenue].reverse();
    return {
      tooltip: { trigger: 'axis', confine: true, ...buildTooltipStyle(theme), formatter: buildTooltipFormatter(currency) },
      grid: buildGrid({ left: 120 }),
      xAxis: buildYAxis(theme, currencyFormatter(currency)),
      yAxis: { type: 'category' as const, data: sorted.map(a => a.articleName), axisLabel: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11, width: 100, overflow: 'truncate' as const }, axisLine: { show: false }, axisTick: { show: false } },
      series: [{
        name: t('charts.revenue'),
        type: 'bar',
        data: sorted.map(a => a.revenue),
        barMaxWidth: 28,
        itemStyle: { color: palette[2], borderRadius: [0, 4, 4, 0] }
      }]
    };
  }, [topArticlesByRevenue, palette, theme, currency, t]);

  return (
    <div className="space-y-6">
      {/* Entity KPIs */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {t('referentials.summaryTitle')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <DashboardKpiCard title={t('kpis.clients')} icon={Users} kpi={summary?.clients} value={number(summary?.clients)} {...kpiCardProps} />
          <DashboardKpiCard title={t('kpis.suppliers')} icon={Building2} kpi={summary?.suppliers} value={number(summary?.suppliers)} {...kpiCardProps} />
          <DashboardKpiCard title={t('kpis.articles')} icon={Boxes} kpi={summary?.articles} value={number(summary?.articles)} {...kpiCardProps} />
          <DashboardKpiCard title={t('kpis.quotations')} icon={ClipboardList} kpi={summary?.quotations} value={number(summary?.quotations)} {...kpiCardProps} />
          <DashboardKpiCard title={t('kpis.customerOrders')} icon={ShoppingCart} kpi={summary?.customerOrders} value={number(summary?.customerOrders)} {...kpiCardProps} />
          <DashboardKpiCard title={t('kpis.purchaseDocuments')} icon={Files} kpi={summary?.purchaseDocuments} value={number(summary?.purchaseDocuments)} {...kpiCardProps} />
        </div>
      </section>

      {/* Quotation stats card */}
      {quotationStats && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {t('referentials.quotationStatsTitle')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('referentials.totalQuotations')}</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{quotationStats.total}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('referentials.invoicedQuotations')}</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{quotationStats.invoiced}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('referentials.conversionRate')}</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{quotationStats.conversionRate}%</p>
            </div>
          </div>
        </section>
      )}

      {/* Top charts */}
      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardChartCard title={t('referentials.topClientsByRevenue')} option={topClientsOption} isLoading={isLoading} isError={isError} isEmpty={!topClientsByRevenue.length} emptyLabel={t('empty.chart')} errorLabel={t('errors.chart')} height={340} />
        <DashboardChartCard title={t('referentials.topSuppliersByPurchases')} option={topSuppliersOption} isLoading={isLoading} isError={isError} isEmpty={!topSuppliersByPurchases.length} emptyLabel={t('empty.chart')} errorLabel={t('errors.chart')} height={340} />
      </section>

      <section>
        <DashboardChartCard title={t('referentials.topArticlesByRevenue')} option={topArticlesOption} isLoading={isLoading} isError={isError} isEmpty={!topArticlesByRevenue.length} emptyLabel={t('empty.chart')} errorLabel={t('errors.chart')} height={340} />
      </section>
    </div>
  );
};
