import React from 'react';
import type { EChartsOption, TooltipComponentFormatterCallbackParams } from 'echarts';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { DashboardChartCard } from './DashboardChartCard';
import { DashboardCurrency, DashboardStatusPoint } from '../types/dashboard.types';
import {
  buildGrid,
  buildTooltipStyle,
  buildChartTextColor,
  buildChartAxisColor,
  buildChartSplitColor,
  getStatusColors,
  hasNonZeroValues
} from '../utils/chart-theme';
import { formatDashboardCurrency, formatDashboardNumber } from '../utils/dashboard-formatters';

interface InvoiceStatusChartProps {
  data?: DashboardStatusPoint[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

export const InvoiceStatusChart = ({
  data = [],
  currency,
  isLoading,
  isError
}: InvoiceStatusChartProps) => {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation(['dashboard', 'invoicing']);
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const textColor = buildChartTextColor(theme);
  const statusColors = getStatusColors(theme);
  const hasData = hasNonZeroValues(data);
  const showChart = data.length > 0;

  const labels = data.map((point) => t(point.label, { ns: 'invoicing' }));

  const option = React.useMemo<EChartsOption | undefined>(() => {
    if (!showChart) return undefined;
    const colorMap: Record<string, string> = {
      paid: statusColors.paid,
      unpaid: statusColors.unpaid,
      partiallyPaid: statusColors.partial
    };
    return {
      tooltip: {
        trigger: 'axis',
        confine: true,
        ...buildTooltipStyle(theme),
        formatter: (params: TooltipComponentFormatterCallbackParams) => {
          const item = Array.isArray(params) ? params[0] : params;
          const index = item?.dataIndex ?? 0;
          const point = data[index];
          return `<div style="min-width:180px;"><strong>${labels[index] || ''}</strong><div style="margin-top:6px;">${t('charts.count', { ns: 'dashboard' })}: <strong>${formatDashboardNumber(point?.value || 0)}</strong></div><div>${t('charts.amount', { ns: 'dashboard' })}: <strong>${formatDashboardCurrency(point?.amount || 0, currency)}</strong></div></div>`;
        }
      },
      grid: buildGrid({ bottom: 32 }),
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { color: textColor, fontSize: 11 },
        axisLine: { lineStyle: { color: buildChartAxisColor(theme) } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: textColor, fontSize: 11 },
        splitLine: { lineStyle: { color: buildChartSplitColor(theme), type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [
        {
          name: t('charts.invoices', { ns: 'dashboard' }),
          type: 'bar',
          barMaxWidth: 48,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          data: data.map((point) => ({
            value: point.value,
            itemStyle: { color: colorMap[point.status] || statusColors.unpaid }
          }))
        }
      ]
    };
  }, [currency, data, labels, showChart, statusColors, t, textColor, theme]);

  return (
    <DashboardChartCard
      title={t('charts.invoiceStatusTitle', { ns: 'dashboard' })}
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
