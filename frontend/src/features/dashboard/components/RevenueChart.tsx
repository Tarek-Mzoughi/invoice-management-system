import React from 'react';
import type { EChartsOption } from 'echarts';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { DashboardChartCard } from './DashboardChartCard';
import { DashboardCurrency, DashboardTimeSeriesPoint } from '../types/dashboard.types';
import {
  buildGrid,
  buildTooltipFormatter,
  buildTooltipStyle,
  buildXAxis,
  buildYAxis,
  currencyFormatter,
  getDashboardChartPalette,
  hasNonZeroValues
} from '../utils/chart-theme';

interface RevenueChartProps {
  data?: DashboardTimeSeriesPoint[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

export const RevenueChart = ({ data = [], currency, isLoading, isError }: RevenueChartProps) => {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation('dashboard');
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const palette = getDashboardChartPalette(theme);
  const hasData = hasNonZeroValues(data);
  const showChart = data.length > 0;

  const option = React.useMemo<EChartsOption | undefined>(() => {
    if (!showChart) return undefined;
    return {
      color: [palette[0]],
      tooltip: {
        trigger: 'axis',
        confine: true,
        ...buildTooltipStyle(theme),
        formatter: buildTooltipFormatter(currency)
      },
      grid: buildGrid(),
      xAxis: buildXAxis(
        data.map((p) => p.label),
        theme,
        { boundaryGap: false }
      ),
      yAxis: buildYAxis(theme, (value: number) => currencyFormatter(currency)(value)),
      series: [
        {
          name: t('charts.revenue'),
          type: 'line',
          smooth: 0.3,
          showSymbol: hasData,
          symbolSize: 6,
          lineStyle: { width: 2.5 },
          areaStyle: {
            opacity: 0.08,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: palette[0] },
                { offset: 1, color: 'transparent' }
              ]
            }
          },
          data: data.map((p) => p.value)
        }
      ]
    };
  }, [currency, data, hasData, palette, showChart, t, theme]);

  return (
    <DashboardChartCard
      title={t('charts.revenueTitle')}
      option={option}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!showChart}
      hasData={hasData}
      emptyLabel={hasData ? '' : t('empty.noRevenue', { defaultValue: t('empty.chart') })}
      emptyDescription={t('empty.chartDescription')}
      errorLabel={t('errors.chart')}
      height={340}
    />
  );
};
