import React from 'react';
import type { EChartsOption } from 'echarts';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { DashboardChartCard } from './DashboardChartCard';
import { DashboardCurrency, DashboardMultiSeriesPoint } from '../types/dashboard.types';
import {
  buildGrid,
  buildTooltipFormatter,
  buildTooltipStyle,
  buildXAxis,
  buildYAxis,
  currencyFormatter,
  getDashboardChartPalette
} from '../utils/chart-theme';

interface RevenueVsCollectionsChartProps {
  data?: DashboardMultiSeriesPoint[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

export const RevenueVsCollectionsChart = ({
  data = [],
  currency,
  isLoading,
  isError
}: RevenueVsCollectionsChartProps) => {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation('dashboard');
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const palette = getDashboardChartPalette(theme);
  const hasData = data.some((p) => p.revenue !== 0 || p.collected !== 0);
  const showChart = data.length > 0;

  const option = React.useMemo<EChartsOption | undefined>(() => {
    if (!showChart) return undefined;
    return {
      color: [palette[0], palette[1]],
      tooltip: {
        trigger: 'axis',
        confine: true,
        ...buildTooltipStyle(theme),
        formatter: buildTooltipFormatter(currency)
      },
      legend: {
        bottom: 0,
        textStyle: { color: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 12 },
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 24
      },
      grid: buildGrid({ bottom: 48 }),
      xAxis: buildXAxis(
        data.map((p) => p.label),
        theme,
        { boundaryGap: true }
      ),
      yAxis: buildYAxis(theme, (value: number) => currencyFormatter(currency)(value)),
      series: [
        {
          name: t('charts.revenue'),
          type: 'bar',
          barMaxWidth: 28,
          barGap: '20%',
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          data: data.map((p) => p.revenue)
        },
        {
          name: t('charts.collected'),
          type: 'bar',
          barMaxWidth: 28,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          data: data.map((p) => p.collected)
        }
      ]
    };
  }, [currency, data, palette, showChart, t, theme]);

  return (
    <DashboardChartCard
      title={t('charts.revenueVsCollectionsTitle')}
      option={option}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!showChart}
      hasData={hasData}
      emptyLabel={t('empty.chart')}
      emptyDescription={t('empty.chartDescription')}
      errorLabel={t('errors.chart')}
      height={340}
    />
  );
};
