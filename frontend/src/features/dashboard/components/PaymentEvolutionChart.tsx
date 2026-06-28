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

interface PaymentEvolutionChartProps {
  data?: DashboardTimeSeriesPoint[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

export const PaymentEvolutionChart = ({
  data = [],
  currency,
  isLoading,
  isError
}: PaymentEvolutionChartProps) => {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation('dashboard');
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const palette = getDashboardChartPalette(theme);
  const hasData = hasNonZeroValues(data);
  const showChart = data.length > 0;

  const option = React.useMemo<EChartsOption | undefined>(() => {
    if (!showChart) return undefined;
    return {
      color: [palette[1]],
      tooltip: {
        trigger: 'axis',
        confine: true,
        ...buildTooltipStyle(theme),
        formatter: buildTooltipFormatter(currency)
      },
      grid: buildGrid(),
      xAxis: buildXAxis(
        data.map((point) => point.label),
        theme,
        { boundaryGap: true }
      ),
      yAxis: buildYAxis(theme, (value: number) => currencyFormatter(currency)(value)),
      series: [
        {
          name: t('charts.collectedPayments'),
          type: 'bar',
          barMaxWidth: 40,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          data: data.map((point) => point.value)
        }
      ]
    };
  }, [currency, data, palette, showChart, t, theme]);

  return (
    <DashboardChartCard
      title={t('charts.paymentEvolutionTitle')}
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
