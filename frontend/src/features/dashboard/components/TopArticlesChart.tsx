import React from 'react';
import type { EChartsOption, TooltipComponentFormatterCallbackParams } from 'echarts';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { DashboardChartCard } from './DashboardChartCard';
import { DashboardCurrency, DashboardTopArticle } from '../types/dashboard.types';
import {
  buildChartAxisColor,
  buildChartSplitColor,
  buildChartTextColor,
  buildGrid,
  buildTooltipStyle,
  currencyFormatter,
  getDashboardChartPalette
} from '../utils/chart-theme';
import { formatDashboardCurrency, formatDashboardNumber } from '../utils/dashboard-formatters';

interface TopArticlesChartProps {
  data?: DashboardTopArticle[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

export const TopArticlesChart = ({
  data = [],
  currency,
  isLoading,
  isError
}: TopArticlesChartProps) => {
  const { resolvedTheme } = useTheme();
  const { t, i18n } = useTranslation('dashboard');
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const palette = getDashboardChartPalette(theme);
  const textColor = buildChartTextColor(theme);
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const chartData = React.useMemo(() => [...data].reverse(), [data]);
  const hasData = data.length > 0 && data.some((a) => a.revenue !== 0);
  const showChart = data.length > 0;

  const option = React.useMemo<EChartsOption | undefined>(() => {
    if (!showChart) return undefined;
    return {
      color: [palette[3]],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        confine: true,
        ...buildTooltipStyle(theme),
        formatter: (params: TooltipComponentFormatterCallbackParams) => {
          const item = Array.isArray(params) ? params[0] : params;
          const index = item?.dataIndex ?? 0;
          const article = chartData[index];
          return `<div style="min-width:200px;"><strong>${article?.articleName || ''}</strong><div style="margin-top:6px;">${t('charts.amount')}: <strong>${formatDashboardCurrency(article?.revenue || 0, currency, locale)}</strong></div><div>${t('charts.quantitySold')}: <strong>${formatDashboardNumber(article?.quantitySold || 0, locale)}</strong></div><div>${t('charts.invoiceCount')}: <strong>${formatDashboardNumber(article?.invoiceCount || 0, locale)}</strong></div></div>`;
        }
      },
      grid: { ...buildGrid(), left: 96 },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: textColor,
          fontSize: 11,
          formatter: (value: number) => currencyFormatter(currency)(value)
        },
        splitLine: { lineStyle: { color: buildChartSplitColor(theme), type: 'dashed' as const } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'category',
        data: chartData.map((a) => a.articleName),
        axisLabel: { color: textColor, fontSize: 11, width: 88, overflow: 'truncate' as const },
        axisLine: { lineStyle: { color: buildChartAxisColor(theme) } },
        axisTick: { show: false }
      },
      series: [
        {
          name: t('charts.revenue'),
          type: 'bar',
          barMaxWidth: 28,
          itemStyle: { borderRadius: [0, 4, 4, 0] },
          data: chartData.map((a) => a.revenue)
        }
      ]
    };
  }, [chartData, currency, locale, palette, showChart, t, textColor, theme]);

  return (
    <DashboardChartCard
      title={t('charts.topArticlesTitle')}
      option={option}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!showChart}
      hasData={hasData}
      emptyLabel={t('empty.chart')}
      emptyDescription={t('empty.chartDescription')}
      errorLabel={t('errors.chart')}
      height={320}
    />
  );
};
