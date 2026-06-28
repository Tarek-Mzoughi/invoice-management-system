import React from 'react';
import type { EChartsOption } from 'echarts';
import {
  FileText,
  Hash,
  Percent,
  Receipt
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardChartCard } from './DashboardChartCard';
import { DashboardKpiCard } from './DashboardKpiCard';
import {
  DashboardCurrency,
  DashboardKpi,
  DashboardTimeSeriesPoint,
  DashboardWithholdingEntry,
  DashboardWithholdingSummary
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

interface WithholdingTabProps {
  summary?: DashboardWithholdingSummary;
  withholdingByTax?: DashboardWithholdingEntry[];
  withholdingEvolution?: DashboardTimeSeriesPoint[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

export const WithholdingTab = ({
  summary,
  withholdingByTax = [],
  withholdingEvolution = [],
  currency,
  isLoading,
  isError
}: WithholdingTabProps) => {
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

  // Withholding evolution line chart
  const evolutionOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!withholdingEvolution.length) return undefined;
    return {
      color: [palette[3]],
      tooltip: { trigger: 'axis', confine: true, ...buildTooltipStyle(theme), formatter: buildTooltipFormatter(currency) },
      grid: buildGrid(),
      xAxis: buildXAxis(withholdingEvolution.map(p => p.label), theme, { boundaryGap: false }),
      yAxis: buildYAxis(theme, currencyFormatter(currency)),
      series: [{
        name: t('withholding.withheld'),
        type: 'line',
        smooth: 0.3,
        showSymbol: hasNonZeroValues(withholdingEvolution),
        symbolSize: 6,
        lineStyle: { width: 2.5 },
        areaStyle: { opacity: 0.08, color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: palette[3] }, { offset: 1, color: 'transparent' }] } },
        data: withholdingEvolution.map(p => p.value)
      }]
    };
  }, [withholdingEvolution, palette, theme, currency, t]);

  // Withholding by tax (bar chart)
  const byTaxOption = React.useMemo<EChartsOption | undefined>(() => {
    if (!withholdingByTax.length) return undefined;
    return {
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
      grid: buildGrid({ left: 120 }),
      xAxis: { type: 'value' as const, axisLabel: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11, formatter: currencyFormatter(currency) }, splitLine: { lineStyle: { color: theme === 'dark' ? '#27272a' : '#f4f4f5', type: 'dashed' as const } } },
      yAxis: { type: 'category' as const, data: withholdingByTax.map(e => `${e.taxLabel} (${e.rate}%)`), axisLabel: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 11, width: 100, overflow: 'truncate' as const }, axisLine: { show: false }, axisTick: { show: false } },
      series: [{
        name: t('withholding.withheld'),
        type: 'bar',
        data: withholdingByTax.map((e, i) => ({ value: e.totalWithheld, itemStyle: { color: palette[i % palette.length], borderRadius: [0, 4, 4, 0] } })),
        barMaxWidth: 28
      }]
    };
  }, [withholdingByTax, palette, theme, currency, locale, t]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {t('withholding.summaryTitle')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardKpiCard title={t('withholding.totalWithheld')} icon={Receipt} kpi={summary?.totalWithheld} value={money(summary?.totalWithheld)} variant="hero" {...kpiCardProps} />
          <DashboardKpiCard title={t('withholding.totalBase')} icon={FileText} kpi={summary?.totalBase} value={money(summary?.totalBase)} {...kpiCardProps} />
          <DashboardKpiCard title={t('withholding.averageRate')} icon={Percent} kpi={summary?.averageRate} value={`${number(summary?.averageRate)}%`} {...kpiCardProps} />
          <DashboardKpiCard title={t('withholding.entries')} icon={Hash} kpi={summary?.entriesCount} value={number(summary?.entriesCount)} {...kpiCardProps} />
        </div>
      </section>

      {/* Withholding evolution */}
      <section>
        <DashboardChartCard
          title={t('withholding.evolutionTitle')}
          option={evolutionOption}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!withholdingEvolution.length}
          hasData={hasNonZeroValues(withholdingEvolution)}
          emptyLabel={t('empty.chart')}
          emptyDescription={t('empty.chartDescription')}
          errorLabel={t('errors.chart')}
          height={340}
        />
      </section>

      {/* By tax breakdown chart */}
      <section>
        <DashboardChartCard
          title={t('withholding.byTaxTitle')}
          option={byTaxOption}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!withholdingByTax.length}
          emptyLabel={t('empty.chart')}
          errorLabel={t('errors.chart')}
          height={Math.max(200, withholdingByTax.length * 48 + 80)}
        />
      </section>

      {/* Withholding by tax table */}
      {withholdingByTax.length > 0 && !isLoading && (
        <section>
          <Card>
            <CardHeader className="px-5 pb-1 pt-4">
              <CardTitle className="text-sm font-semibold tracking-tight">{t('withholding.tableTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      <th className="pb-2 pr-4">{t('withholding.tax')}</th>
                      <th className="pb-2 pr-4 text-right">{t('withholding.rate')}</th>
                      <th className="pb-2 pr-4 text-right">{t('withholding.base')}</th>
                      <th className="pb-2 pr-4 text-right">{t('withholding.withheld')}</th>
                      <th className="pb-2 text-right">{t('withholding.invoices')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withholdingByTax.map(entry => (
                      <tr key={entry.taxId} className="border-b border-zinc-100 dark:border-zinc-800/50">
                        <td className="py-2.5 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{entry.taxLabel}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{entry.rate}%</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{formatDashboardCurrency(entry.totalBase, currency, locale)}</td>
                        <td className="py-2.5 pr-4 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{formatDashboardCurrency(entry.totalWithheld, currency, locale)}</td>
                        <td className="py-2.5 text-right tabular-nums text-zinc-500 dark:text-zinc-400">{entry.invoiceCount}</td>
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
