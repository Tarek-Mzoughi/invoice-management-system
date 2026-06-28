import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, Bell, FileClock, ReceiptText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DashboardAlert, DashboardCurrency } from '../types/dashboard.types';
import { formatDashboardCurrency, formatDashboardDate } from '../utils/dashboard-formatters';

interface DashboardAlertsProps {
  data?: DashboardAlert[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

const alertIcons = {
  overdueInvoice: AlertTriangle,
  paymentFollowUp: ReceiptText,
  recentDraft: FileClock,
  highReceivableClient: Bell
};

const severityClassName = {
  danger:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200',
  warning:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200',
  info: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200'
};

export const DashboardAlerts = ({
  data = [],
  currency,
  isLoading,
  isError
}: DashboardAlertsProps) => {
  const { t, i18n } = useTranslation('dashboard');
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold">{t('alerts.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))
        ) : isError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {t('errors.load')}
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            {t('empty.alerts')}
          </div>
        ) : (
          data.map((alert) => {
            const Icon = alertIcons[alert.type];

            return (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-3 rounded-md border p-3',
                  severityClassName[alert.severity]
                )}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t(`alerts.types.${alert.type}`)}</p>
                  <p className="mt-1 text-xs opacity-80">
                    {[alert.entityLabel, alert.partnerName].filter(Boolean).join(' · ') ||
                      t('alerts.noContext')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-90">
                    {typeof alert.amount === 'number' ? (
                      <span>{formatDashboardCurrency(alert.amount, currency, locale)}</span>
                    ) : null}
                    {alert.date ? (
                      <span>{formatDashboardDate(alert.date, i18n.language)}</span>
                    ) : null}
                  </div>
                </div>
                {alert.route ? (
                  <Button asChild variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <Link href={alert.route} aria-label={t('alerts.view')}>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
