import type { EChartsOption, TooltipComponentFormatterCallbackParams } from 'echarts';
import { DashboardCurrency } from '../types/dashboard.types';
import { formatDashboardCurrency, formatDashboardNumber } from './dashboard-formatters';

export type DashboardChartTheme = 'light' | 'dark';

type DashboardTooltipItem = {
  axisValueLabel?: string;
  marker?: string;
  name?: string;
  seriesName?: string;
  seriesType?: string;
  value?: unknown;
};

export const buildChartTextColor = (theme?: DashboardChartTheme) =>
  theme === 'dark' ? '#a1a1aa' : '#71717a';

export const buildChartAxisColor = (theme?: DashboardChartTheme) =>
  theme === 'dark' ? '#3f3f46' : '#e4e4e7';

export const buildChartSplitColor = (theme?: DashboardChartTheme) =>
  theme === 'dark' ? '#27272a' : '#f4f4f5';

export const buildGrid = (overrides?: Partial<EChartsOption['grid']>) => ({
  top: 32,
  right: 24,
  bottom: 40,
  left: 56,
  containLabel: true,
  ...overrides,
});

export const getDashboardChartPalette = (theme?: DashboardChartTheme) =>
  theme === 'dark'
    ? ['#f59e0b', '#22c55e', '#38bdf8', '#a78bfa', '#f97316', '#ef4444', '#06b6d4']
    : ['#d97706', '#059669', '#0284c7', '#7c3aed', '#ea580c', '#dc2626', '#0891b2'];

export const getStatusColors = (theme?: DashboardChartTheme) => ({
  paid: theme === 'dark' ? '#22c55e' : '#059669',
  partial: theme === 'dark' ? '#f59e0b' : '#d97706',
  unpaid: theme === 'dark' ? '#ef4444' : '#dc2626',
});

export const currencyFormatter =
  (currency?: DashboardCurrency, locale = 'fr-FR') =>
  (value: number) =>
    formatDashboardCurrency(value, currency, locale);

export const percentageFormatter = (value: number, locale = 'fr-FR') =>
  `${Number(value || 0).toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;

export const buildTooltipStyle = (theme?: DashboardChartTheme) => ({
  backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
  borderColor: theme === 'dark' ? '#3f3f46' : '#e4e4e7',
  borderWidth: 1,
  padding: [12, 16],
  textStyle: {
    color: theme === 'dark' ? '#e4e4e7' : '#3f3f46',
    fontSize: 13,
  },
  extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 8px;',
});

export const buildTooltipFormatter =
  (currency?: DashboardCurrency, locale = 'fr-FR') =>
  (params: TooltipComponentFormatterCallbackParams) => {
    const items = (Array.isArray(params) ? params : [params]) as DashboardTooltipItem[];
    const title = items[0]?.axisValueLabel || items[0]?.name || '';
    const rows = items
      .map((item) => {
        const marker = item.marker || '';
        const value = Array.isArray(item.value) ? item.value[1] : item.value;
        const numericValue = Number(value || 0);
        const formattedValue =
          item.seriesType === 'line' || item.seriesType === 'bar'
            ? formatDashboardCurrency(numericValue, currency, locale)
            : formatDashboardNumber(numericValue, locale);
        return `<div style="display:flex;gap:12px;align-items:center;justify-content:space-between;margin-top:4px;"><span>${marker}${item.seriesName || item.name}</span><strong>${formattedValue}</strong></div>`;
      })
      .join('');

    return `<div style="min-width:180px;"><div style="font-weight:600;margin-bottom:6px;">${title}</div>${rows}</div>`;
  };

export const buildXAxis = (
  data: string[],
  theme?: DashboardChartTheme,
  options?: Record<string, unknown>,
) => ({
  type: 'category' as const,
  boundaryGap: false,
  data,
  axisLabel: {
    color: buildChartTextColor(theme),
    fontSize: 11,
    margin: 12,
  },
  axisLine: { lineStyle: { color: buildChartAxisColor(theme) } },
  axisTick: { show: false },
  ...options,
});

export const buildYAxis = (
  theme?: DashboardChartTheme,
  formatter?: (value: number) => string,
  options?: Record<string, unknown>,
) => ({
  type: 'value' as const,
  axisLabel: {
    color: buildChartTextColor(theme),
    fontSize: 11,
    formatter,
  },
  splitLine: {
    lineStyle: { color: buildChartSplitColor(theme), type: 'dashed' as const },
  },
  axisLine: { show: false },
  axisTick: { show: false },
  ...options,
});

export const hasNonZeroValues = (data: { value: number }[]): boolean =>
  data.some((point) => point.value !== 0);
