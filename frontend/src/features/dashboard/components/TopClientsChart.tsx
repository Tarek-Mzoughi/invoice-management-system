import React from 'react';
import type { EChartsOption } from 'echarts';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { DashboardChartCard } from './DashboardChartCard';
import { DashboardCurrency, DashboardTopClient } from '../types/dashboard.types';
import {
  buildChartAxisColor,
  buildChartTextColor,
  buildGrid,
  buildTooltipFormatter,
  buildTooltipStyle,
  buildChartSplitColor,
  currencyFormatter,
  getDashboardChartPalette
} from '../utils/chart-theme';

interface TopClientsChartProps {
  data?: DashboardTopClient[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

export const TopClientsChart = ({
  data = [],
  currency,
  isLoading,
  isError
}: TopClientsChartProps) => {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation('dashboard');
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const palette = getDashboardChartPalette(theme);
  const textColor = buildChartTextColor(theme);
  const chartData = React.useMemo(() => [...data].reverse(), [data]);
  const hasData = data.length > 0 && data.some((c) => c.revenue !== 0);
  const showChart = data.length > 0;

  const option = React.useMemo<EChartsOption | undefined>(() => {
    if (!showChart) return undefined;
    return {
      color: [palette[2]],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        confine: true,
        ...buildTooltipStyle(theme),
        formatter: buildTooltipFormatter(currency)
      },
      grid: { ...buildGrid(), left: 96 },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: textColor,
          fontSize: 11,
          formatter: (value: number) => currencyFormatter(currency)(value)
        },
        splitLine: { lineStyle: { color: buildChartSplitColor(theme), type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'category',
        data: chartData.map((client) => client.clientName),
        axisLabel: { color: textColor, fontSize: 11, width: 88, overflow: 'truncate' },
        axisLine: { lineStyle: { color: buildChartAxisColor(theme) } },
        axisTick: { show: false }
      },
      series: [
        {
          name: t('charts.revenue'),
          type: 'bar',
          barMaxWidth: 28,
          itemStyle: { borderRadius: [0, 4, 4, 0] },
          data: chartData.map((client) => client.revenue)
        }
      ]
    };
  }, [chartData, currency, palette, showChart, t, textColor, theme]);

  return (
    <DashboardChartCard
      title={t('charts.topClientsTitle')}
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
