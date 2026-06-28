import React from 'react';
import type { EChartsOption, TooltipComponentFormatterCallbackParams } from 'echarts';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { DashboardChartCard } from './DashboardChartCard';
import { DashboardCurrency, DashboardReceivablesAging } from '../types/dashboard.types';
import {
  buildChartAxisColor,
  buildChartSplitColor,
  buildChartTextColor,
  buildGrid,
  buildTooltipStyle,
  currencyFormatter
} from '../utils/chart-theme';
import { formatDashboardCurrency, formatDashboardNumber } from '../utils/dashboard-formatters';

interface ReceivablesAgingChartProps {
  data?: DashboardReceivablesAging[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

const AGING_COLORS_LIGHT = ['#059669', '#0284c7', '#d97706', '#ea580c', '#dc2626'];
const AGING_COLORS_DARK = ['#22c55e', '#38bdf8', '#f59e0b', '#f97316', '#ef4444'];

export const ReceivablesAgingChart = ({
  data = [],
  currency,
  isLoading,
  isError
}: ReceivablesAgingChartProps) => {
  const { resolvedTheme } = useTheme();
  const { t, i18n } = useTranslation('dashboard');
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const textColor = buildChartTextColor(theme);
  const colors = theme === 'dark' ? AGING_COLORS_DARK : AGING_COLORS_LIGHT;
  const hasData = data.some((b) => b.amount !== 0 || b.count !== 0);
  const showChart = data.length > 0;
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  const option = React.useMemo<EChartsOption | undefined>(() => {
    if (!showChart) return undefined;
    return {
      tooltip: {
        trigger: 'axis',
        confine: true,
        ...buildTooltipStyle(theme),
        formatter: (params: TooltipComponentFormatterCallbackParams) => {
          const item = Array.isArray(params) ? params[0] : params;
          const index = item?.dataIndex ?? 0;
          const point = data[index];
          return `<div style="min-width:180px;"><strong>${point?.label || ''}</strong><div style="margin-top:6px;">${t('charts.count')}: <strong>${formatDashboardNumber(point?.count || 0, locale)}</strong></div><div>${t('charts.amount')}: <strong>${formatDashboardCurrency(point?.amount || 0, currency, locale)}</strong></div></div>`;
        }
      },
      grid: buildGrid({ bottom: 32 }),
      xAxis: {
        type: 'category',
        data: data.map((b) => b.label),
        axisLabel: { color: textColor, fontSize: 11 },
        axisLine: { lineStyle: { color: buildChartAxisColor(theme) } },
        axisTick: { show: false }
      },
      yAxis: {
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
      series: [
        {
          name: t('charts.remainingAmount'),
          type: 'bar',
          barMaxWidth: 48,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          data: data.map((b, i) => ({
            value: b.amount,
            itemStyle: { color: colors[i] || colors[colors.length - 1] }
          }))
        }
      ]
    };
  }, [colors, currency, data, locale, showChart, t, textColor, theme]);

  return (
    <DashboardChartCard
      title={t('charts.receivablesAgingTitle')}
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
