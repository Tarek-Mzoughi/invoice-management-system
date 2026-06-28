import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { DashboardCurrency, DashboardTrend } from '../types/dashboard.types';

export const formatDashboardCurrency = (
  value: number,
  currency?: DashboardCurrency,
  locale = 'fr-FR'
) => {
  const digits = currency?.digitAfterComma ?? 3;
  const formatted = Number(value || 0).toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });

  return `${formatted} ${currency?.symbol || currency?.code || 'TND'}`.trim();
};

export const formatDashboardNumber = (value: number, locale = 'fr-FR') =>
  Number(value || 0).toLocaleString(locale);

export const formatDashboardDate = (value?: string | null, locale = 'fr') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'dd MMM yyyy', { locale: locale === 'fr' ? fr : enUS });
};

export const formatTrendPercent = (value?: number | null, locale = 'fr-FR') => {
  if (typeof value !== 'number') return '0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  })}%`;
};

export const getTrendClassName = (trend: DashboardTrend) => {
  if (trend === 'positive') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
  }
  if (trend === 'negative') {
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300';
  }
  return 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300';
};
