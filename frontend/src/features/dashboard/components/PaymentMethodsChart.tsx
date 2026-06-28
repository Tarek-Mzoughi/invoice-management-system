import React from 'react';
import type { EChartsOption, TooltipComponentFormatterCallbackParams } from 'echarts';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { DashboardChartCard } from './DashboardChartCard';
import { DashboardCurrency, DashboardPaymentMethodPoint } from '../types/dashboard.types';
import {
  buildChartTextColor,
  buildTooltipStyle,
  getDashboardChartPalette,
  hasNonZeroValues
} from '../utils/chart-theme';
import { formatDashboardCurrency, formatDashboardNumber } from '../utils/dashboard-formatters';

interface PaymentMethodsChartProps {
  data?: DashboardPaymentMethodPoint[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

export const PaymentMethodsChart = ({
  data = [],
  currency,
  isLoading,
  isError
}: PaymentMethodsChartProps) => {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation(['dashboard', 'invoicing']);
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const textColor = buildChartTextColor(theme);
  const palette = getDashboardChartPalette(theme);
  const hasData = hasNonZeroValues(data);
  const showChart = data.length > 0;

  const option = React.useMemo<EChartsOption | undefined>(() => {
    if (!showChart) return undefined;
    return {
      color: palette,
      tooltip: {
        trigger: 'item',
        confine: true,
        ...buildTooltipStyle(theme),
        formatter: (params: TooltipComponentFormatterCallbackParams) => {
          const item = Array.isArray(params) ? params[0] : params;
          const index = item?.dataIndex ?? 0;
          const point = data[index];
          return `<div style="min-width:190px;"><strong>${item?.name || ''}</strong><div style="margin-top:6px;">${t('charts.count', { ns: 'dashboard' })}: <strong>${formatDashboardNumber(point?.value || 0)}</strong></div><div>${t('charts.amount', { ns: 'dashboard' })}: <strong>${formatDashboardCurrency(point?.amount || 0, currency)}</strong></div></div>`;
        }
      },
      legend: {
        bottom: 0,
        textStyle: { color: textColor, fontSize: 12 },
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 16
      },
      series: [
        {
          name: t('charts.payments', { ns: 'dashboard' }),
          type: 'pie',
          radius: ['48%', '72%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 4, borderColor: theme === 'dark' ? '#09090b' : '#fff', borderWidth: 2 },
          label: { show: hasData, color: textColor, fontSize: 12, formatter: '{b}' },
          emphasis: { label: { fontWeight: 'bold' } },
          data: data.map((point) => ({
            name: t(point.label, { ns: 'invoicing', defaultValue: point.method }),
            value: point.value
          }))
        }
      ]
    };
  }, [currency, data, hasData, palette, showChart, t, textColor, theme]);

  return (
    <DashboardChartCard
      title={t('charts.paymentMethodsTitle', { ns: 'dashboard' })}
      option={option}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!showChart}
      hasData={hasData}
      emptyLabel={t('empty.chart', { ns: 'dashboard' })}
      emptyDescription={t('empty.chartDescription', { ns: 'dashboard' })}
      errorLabel={t('errors.chart', { ns: 'dashboard' })}
      height={320}
    />
  );
};
