import React from 'react';
import {
  Banknote,
  CalendarClock,
  FileCheck2,
  FileClock,
  FileText,
  Percent,
  Receipt,
  WalletCards
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardKpiCard } from './DashboardKpiCard';
import { InvoiceStatusChart } from './InvoiceStatusChart';
import { PaymentEvolutionChart } from './PaymentEvolutionChart';
import { PaymentMethodsChart } from './PaymentMethodsChart';
import { ReceivablesAgingChart } from './ReceivablesAgingChart';
import { RevenueChart } from './RevenueChart';
import { RevenueVsCollectionsChart } from './RevenueVsCollectionsChart';
import { TopArticlesChart } from './TopArticlesChart';
import { TopClientsChart } from './TopClientsChart';
import {
  DashboardCurrency,
  DashboardKpi,
  DashboardMultiSeriesPoint,
  DashboardPaymentMethodPoint,
  DashboardReceivablesAging,
  DashboardSalesSummary,
  DashboardStatusPoint,
  DashboardTimeSeriesPoint,
  DashboardTopArticle,
  DashboardTopClient
} from '../types/dashboard.types';
import { formatDashboardCurrency, formatDashboardNumber } from '../utils/dashboard-formatters';

interface SalesTabProps {
  summary?: DashboardSalesSummary;
  revenueChart?: DashboardTimeSeriesPoint[];
  revenueVsCollectionsChart?: DashboardMultiSeriesPoint[];
  invoiceStatusChart?: DashboardStatusPoint[];
  paymentMethodsChart?: DashboardPaymentMethodPoint[];
  paymentEvolutionChart?: DashboardTimeSeriesPoint[];
  receivablesAgingChart?: DashboardReceivablesAging[];
  topClients?: DashboardTopClient[];
  topArticles?: DashboardTopArticle[];
  currency?: DashboardCurrency;
  isLoading?: boolean;
  isError?: boolean;
}

export const SalesTab = ({
  summary,
  revenueChart,
  revenueVsCollectionsChart,
  invoiceStatusChart,
  paymentMethodsChart,
  paymentEvolutionChart,
  receivablesAgingChart,
  topClients,
  topArticles,
  currency,
  isLoading,
  isError
}: SalesTabProps) => {
  const { t, i18n } = useTranslation('dashboard');
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  const money = React.useCallback(
    (kpi?: DashboardKpi) => formatDashboardCurrency(kpi?.value || 0, currency, locale),
    [currency, locale]
  );
  const number = React.useCallback(
    (kpi?: DashboardKpi) => formatDashboardNumber(kpi?.value || 0, locale),
    [locale]
  );

  const kpiCardProps = {
    isLoading,
    isError,
    errorLabel: t('errors.kpi'),
    comparisonLabel: t('kpis.comparison'),
    scopeLabel: t('kpis.scope')
  };

  return (
    <div className="space-y-6">
      {/* Hero KPIs */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {t('sections.financial')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardKpiCard title={t('kpis.totalRevenue')} icon={Banknote} kpi={summary?.totalRevenue} value={money(summary?.totalRevenue)} variant="hero" {...kpiCardProps} />
          <DashboardKpiCard title={t('kpis.currentMonthRevenue')} icon={Banknote} kpi={summary?.currentMonthRevenue} value={money(summary?.currentMonthRevenue)} variant="hero" {...kpiCardProps} />
          <DashboardKpiCard title={t('kpis.collectedAmount')} icon={WalletCards} kpi={summary?.collectedAmount} value={money(summary?.collectedAmount)} variant="hero" {...kpiCardProps} />
          <DashboardKpiCard title={t('kpis.remainingAmount')} icon={Banknote} kpi={summary?.remainingAmount} value={money(summary?.remainingAmount)} variant="hero" {...kpiCardProps} />
        </div>
      </section>

      {/* Invoice KPIs */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {t('sections.invoices')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <DashboardKpiCard title={t('kpis.totalInvoices')} icon={FileText} kpi={summary?.totalInvoices} value={number(summary?.totalInvoices)} {...kpiCardProps} />
          <DashboardKpiCard title={t('kpis.paidInvoices')} icon={FileCheck2} kpi={summary?.paidInvoices} value={number(summary?.paidInvoices)} {...kpiCardProps} />
          <DashboardKpiCard title={t('kpis.unpaidInvoices')} icon={FileClock} kpi={summary?.unpaidInvoices} value={number(summary?.unpaidInvoices)} {...kpiCardProps} />
          <DashboardKpiCard title={t('kpis.partiallyPaidInvoices')} icon={Receipt} kpi={summary?.partiallyPaidInvoices} value={number(summary?.partiallyPaidInvoices)} {...kpiCardProps} />
          <DashboardKpiCard title={t('kpis.overduePayments')} icon={FileClock} kpi={summary?.overduePayments} value={number(summary?.overduePayments)} {...kpiCardProps} />
        </div>
      </section>

      {/* Performance KPIs */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {t('sections.performance')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <DashboardKpiCard title={t('kpis.collectionRate')} icon={Percent} kpi={summary?.collectionRate} value={`${number(summary?.collectionRate)}%`} {...kpiCardProps} />
          <DashboardKpiCard title={t('kpis.avgDaysToPayment')} icon={CalendarClock} kpi={summary?.avgDaysToPayment} value={`${number(summary?.avgDaysToPayment)} ${t('kpis.days')}`} {...kpiCardProps} />
          <DashboardKpiCard title={t('kpis.quotationConversionRate')} icon={Percent} kpi={summary?.quotationConversionRate} value={`${number(summary?.quotationConversionRate)}%`} {...kpiCardProps} />
        </div>
      </section>

      {/* Charts */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {t('sections.charts')}
        </h2>
        <div className="grid gap-4 xl:grid-cols-2">
          <RevenueChart data={revenueChart} currency={currency} isLoading={isLoading} isError={isError} />
          <InvoiceStatusChart data={invoiceStatusChart} currency={currency} isLoading={isLoading} isError={isError} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <RevenueVsCollectionsChart data={revenueVsCollectionsChart} currency={currency} isLoading={isLoading} isError={isError} />
        <PaymentMethodsChart data={paymentMethodsChart} currency={currency} isLoading={isLoading} isError={isError} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <PaymentEvolutionChart data={paymentEvolutionChart} currency={currency} isLoading={isLoading} isError={isError} />
        <ReceivablesAgingChart data={receivablesAgingChart} currency={currency} isLoading={isLoading} isError={isError} />
      </section>

      {/* Top analysis */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {t('sections.analysis')}
        </h2>
        <div className="grid gap-4 xl:grid-cols-2">
          <TopClientsChart data={topClients} currency={currency} isLoading={isLoading} isError={isError} />
          <TopArticlesChart data={topArticles} currency={currency} isLoading={isLoading} isError={isError} />
        </div>
      </section>
    </div>
  );
};
