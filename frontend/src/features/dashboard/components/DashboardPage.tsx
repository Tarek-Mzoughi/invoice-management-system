import React from 'react';
import {
  Activity,
  Banknote,
  BookOpen,
  CreditCard,
  Landmark,
  Receipt,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
  type LucideIcon
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useCurrentPermissions } from '@/features/rbac/usePermissions';
import { PERMISSIONS } from '@/features/rbac/permissions';
import { useCurrentUser } from '@/hooks/content/user/useCurrentUser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccessDenied } from '@/features/rbac/AccessDenied';
import { ActivityTab } from './ActivityTab';
import { DashboardFilters } from './DashboardFilters';
import { GlobalTab } from './GlobalTab';
import { PaymentsTab } from './PaymentsTab';
import { PurchasesTab } from './PurchasesTab';
import { ReferentialsTab } from './ReferentialsTab';
import { SalesTab } from './SalesTab';
import { TreasuryTab } from './TreasuryTab';
import { WithholdingTab } from './WithholdingTab';
import {
  useDashboardActivity,
  useDashboardGlobal,
  useDashboardPayments,
  useDashboardPurchases,
  useDashboardReferentials,
  useDashboardSales,
  useDashboardTreasury,
  useDashboardWithholding
} from '../hooks/useDashboardOverview';
import {
  DashboardFilters as DashboardFiltersValue,
  DashboardTab
} from '../types/dashboard.types';

const initialFilters: DashboardFiltersValue = {
  period: 'currentYear',
  documentType: 'all',
  topLimit: 5
};

const TAB_ICONS: Record<DashboardTab, LucideIcon> = {
  global: TrendingUp,
  sales: Banknote,
  purchases: ShoppingBag,
  payments: CreditCard,
  treasury: Landmark,
  withholding: Receipt,
  referentials: BookOpen,
  activity: Activity
};

const TAB_ORDER = Object.keys(TAB_ICONS) as DashboardTab[];

export const DashboardPage = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation('dashboard');
  const { hasPermission, isPending: isPermissionsPending } = useCurrentPermissions();
  const { user } = useCurrentUser();
  const [filters, setFilters] = React.useState<DashboardFiltersValue>(initialFilters);
  const [activeTab, setActiveTab] = React.useState<DashboardTab>('global');

  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  const canReadDashboard = hasPermission(PERMISSIONS.dashboard.read);
  const canReadClients = hasPermission(PERMISSIONS.clients.read);
  const canReadSuppliers = hasPermission(PERMISSIONS.suppliers.read);
  const canReadSellingDocuments = hasPermission(PERMISSIONS.selling_documents.read);
  const canReadBuyingDocuments = hasPermission(PERMISSIONS.buying_documents.read);
  const canReadPayments = hasPermission(PERMISSIONS.payments.read);
  const canReadTreasury = hasPermission(PERMISSIONS.treasury.read);
  const canReadTaxes = hasPermission(PERMISSIONS.taxes.read);

  const isTabAuthorized = React.useCallback(
    (tab: DashboardTab) => {
      if (isPermissionsPending) return false;
      switch (tab) {
        case 'global':
          return canReadDashboard;
        case 'sales':
          return canReadSellingDocuments;
        case 'purchases':
          return canReadBuyingDocuments;
        case 'payments':
          return canReadPayments;
        case 'treasury':
          return canReadTreasury;
        case 'withholding':
          return canReadTaxes;
        case 'referentials':
          return canReadClients || canReadSuppliers;
        case 'activity':
          return canReadDashboard;
        default:
          return false;
      }
    },
    [
      isPermissionsPending,
      canReadDashboard,
      canReadSellingDocuments,
      canReadBuyingDocuments,
      canReadPayments,
      canReadTreasury,
      canReadTaxes,
      canReadClients,
      canReadSuppliers
    ]
  );
  const allowedTabs = React.useMemo(
    () => (isPermissionsPending ? [] : TAB_ORDER.filter(isTabAuthorized)),
    [isPermissionsPending, isTabAuthorized]
  );
  const hasAllowedTabs = allowedTabs.length > 0;
  const resolvedActiveTab =
    hasAllowedTabs && allowedTabs.includes(activeTab) ? activeTab : allowedTabs[0];

  React.useEffect(() => {
    if (isPermissionsPending || !hasAllowedTabs || allowedTabs.includes(activeTab)) return;
    setActiveTab(allowedTabs[0]);
  }, [activeTab, allowedTabs, hasAllowedTabs, isPermissionsPending]);

  // ── Data hooks — only fetch when the corresponding tab is active ──
  const global = useDashboardGlobal(
    filters,
    resolvedActiveTab === 'global' && isTabAuthorized('global')
  );
  const sales = useDashboardSales(
    filters,
    resolvedActiveTab === 'sales' && isTabAuthorized('sales')
  );
  const purchases = useDashboardPurchases(
    filters,
    resolvedActiveTab === 'purchases' && isTabAuthorized('purchases')
  );
  const payments = useDashboardPayments(
    filters,
    resolvedActiveTab === 'payments' && isTabAuthorized('payments')
  );
  const treasury = useDashboardTreasury(
    filters,
    resolvedActiveTab === 'treasury' && isTabAuthorized('treasury')
  );
  const withholding = useDashboardWithholding(
    filters,
    resolvedActiveTab === 'withholding' && isTabAuthorized('withholding')
  );
  const referentials = useDashboardReferentials(
    filters,
    resolvedActiveTab === 'referentials' && isTabAuthorized('referentials')
  );
  const activity = useDashboardActivity(
    filters,
    resolvedActiveTab === 'activity' && isTabAuthorized('activity')
  );

  // Active query for refresh + timestamp
  const queries = { global, sales, purchases, payments, treasury, withholding, referentials, activity };
  const activeQuery = resolvedActiveTab ? queries[resolvedActiveTab] : undefined;
  const handleRefresh = () => activeQuery?.refetch();
  const isAnyFetching = Object.values(queries).some((q) => q.isFetching);
  const activeGeneratedAt = (activeQuery?.data as any)?.meta?.generatedAt;
  const currency = (activeQuery?.data as any)?.meta?.currency ?? global.data?.meta?.currency;

  if (!isPermissionsPending && !canReadDashboard) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <AccessDenied />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* ── Header & Filters ───────────────────────────────────── */}
      <div className="shrink-0 border-b border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {t('title')}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            {activeQuery?.isError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {t('errors.load')}
              </p>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {activeGeneratedAt
                  ? t('updatedAt', { date: new Date(activeGeneratedAt).toLocaleString(locale) })
                  : ''}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={!activeQuery || isAnyFetching}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isAnyFetching ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
          </div>
        </div>
        {!isPermissionsPending && hasAllowedTabs ? (
          <div className="mt-4">
            <DashboardFilters
              filters={filters}
              onChange={setFilters}
              canReadBuyingDocuments={canReadBuyingDocuments}
              canReadClients={canReadClients}
              canReadPayments={canReadPayments}
              canReadSellingDocuments={canReadSellingDocuments}
              canReadSuppliers={canReadSuppliers}
            />
          </div>
        ) : null}
      </div>

      {user?.mustChangePassword ? (
        <div className="mx-4 mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30 lg:mx-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {t('securityNotice.title')}
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                  {t('securityNotice.description')}
                </p>
              </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/40"
              onClick={() => router.push('/change-password')}>
              {t('securityNotice.action')}
            </Button>
          </div>
        </div>
      ) : null}

      {!isPermissionsPending && hasAllowedTabs ? (
        <>
          {/* ── Tab Navigation + Scrollable Content ────────────────── */}
          <Tabs
            value={resolvedActiveTab || activeTab}
            onValueChange={(v) => setActiveTab(v as DashboardTab)}
            className="flex min-h-0 flex-1 flex-col"
          >
        <div className="shrink-0 overflow-x-auto border-b border-zinc-200 bg-zinc-50/40 px-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <TabsList className="h-auto gap-1 border-b-0 bg-transparent p-0">
            {allowedTabs.map((tab) => {
              const Icon = TAB_ICONS[tab];
              return (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="gap-1.5 whitespace-nowrap rounded-b-none border-b-2 border-transparent px-3 py-2.5 text-xs font-medium data-[state=active]:border-b-zinc-900 data-[state=active]:bg-transparent dark:data-[state=active]:border-b-zinc-100"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(`tabs.${tab}`)}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* ── Vue globale ──────────────────────────────────── */}
          <TabsContent value="global" className="mt-0">
            <div className="p-4 lg:p-6">
              <GlobalTab
                summary={global.data?.summary}
                revenueVsPurchasesChart={global.data?.revenueVsPurchasesChart}
                cashFlowSummaryChart={global.data?.cashFlowSummaryChart}
                sellingInvoiceStatusChart={global.data?.sellingInvoiceStatusChart}
                buyingInvoiceStatusChart={global.data?.buyingInvoiceStatusChart}
                currency={currency}
                isLoading={global.isPending}
                isError={global.isError}
              />
            </div>
          </TabsContent>

          {/* ── Vente ────────────────────────────────────────── */}
          <TabsContent value="sales" className="mt-0">
            <div className="p-4 lg:p-6">
              <SalesTab
                summary={sales.data?.summary}
                revenueChart={sales.data?.revenueChart}
                revenueVsCollectionsChart={sales.data?.revenueVsCollectionsChart}
                invoiceStatusChart={sales.data?.invoiceStatusChart}
                paymentMethodsChart={sales.data?.paymentMethodsChart}
                paymentEvolutionChart={sales.data?.paymentEvolutionChart}
                receivablesAgingChart={sales.data?.receivablesAgingChart}
                topClients={sales.data?.topClients}
                topArticles={sales.data?.topArticles}
                currency={sales.data?.meta?.currency ?? currency}
                isLoading={sales.isPending}
                isError={sales.isError}
              />
            </div>
          </TabsContent>

          {/* ── Achat ────────────────────────────────────────── */}
          <TabsContent value="purchases" className="mt-0">
            <div className="p-4 lg:p-6">
              <PurchasesTab
                summary={purchases.data?.summary}
                purchasesChart={purchases.data?.purchasesChart}
                purchasesVsPaymentsChart={purchases.data?.purchasesVsPaymentsChart}
                buyingInvoiceStatusChart={purchases.data?.buyingInvoiceStatusChart}
                payablesAgingChart={purchases.data?.payablesAgingChart}
                topSuppliers={purchases.data?.topSuppliers}
                buyingPaymentMethodsChart={purchases.data?.buyingPaymentMethodsChart}
                currency={purchases.data?.meta?.currency ?? currency}
                isLoading={purchases.isPending}
                isError={purchases.isError}
              />
            </div>
          </TabsContent>

          {/* ── Paiements ────────────────────────────────────── */}
          <TabsContent value="payments" className="mt-0">
            <div className="p-4 lg:p-6">
              <PaymentsTab
                summary={payments.data?.summary}
                receivedEvolutionChart={payments.data?.receivedEvolutionChart}
                paidEvolutionChart={payments.data?.paidEvolutionChart}
                receivedByMethodChart={payments.data?.receivedByMethodChart}
                paidByMethodChart={payments.data?.paidByMethodChart}
                receivablesAgingChart={payments.data?.receivablesAgingChart}
                payablesAgingChart={payments.data?.payablesAgingChart}
                currency={payments.data?.meta?.currency ?? currency}
                isLoading={payments.isPending}
                isError={payments.isError}
              />
            </div>
          </TabsContent>

          {/* ── Trésorerie ───────────────────────────────────── */}
          <TabsContent value="treasury" className="mt-0">
            <div className="p-4 lg:p-6">
              <TreasuryTab
                summary={treasury.data?.summary}
                bankBalances={treasury.data?.bankBalances}
                cashFlowChart={treasury.data?.cashFlowChart}
                inflowsByCategory={treasury.data?.inflowsByCategory}
                outflowsByCategory={treasury.data?.outflowsByCategory}
                currency={treasury.data?.meta?.currency ?? currency}
                isLoading={treasury.isPending}
                isError={treasury.isError}
              />
            </div>
          </TabsContent>

          {/* ── Retenue à la source ──────────────────────────── */}
          <TabsContent value="withholding" className="mt-0">
            <div className="p-4 lg:p-6">
              <WithholdingTab
                summary={withholding.data?.summary}
                withholdingByTax={withholding.data?.withholdingByTax}
                withholdingEvolution={withholding.data?.withholdingEvolution}
                currency={withholding.data?.meta?.currency ?? currency}
                isLoading={withholding.isPending}
                isError={withholding.isError}
              />
            </div>
          </TabsContent>

          {/* ── Référentiels ─────────────────────────────────── */}
          <TabsContent value="referentials" className="mt-0">
            <div className="p-4 lg:p-6">
              <ReferentialsTab
                summary={referentials.data?.summary}
                topClientsByRevenue={referentials.data?.topClientsByRevenue}
                topSuppliersByPurchases={referentials.data?.topSuppliersByPurchases}
                topArticlesByRevenue={referentials.data?.topArticlesByRevenue}
                quotationStats={referentials.data?.quotationStats}
                currency={referentials.data?.meta?.currency ?? currency}
                isLoading={referentials.isPending}
                isError={referentials.isError}
              />
            </div>
          </TabsContent>

          {/* ── Activité & Alertes ───────────────────────────── */}
          <TabsContent value="activity" className="mt-0">
            <div className="p-4 lg:p-6">
              <ActivityTab
                recentActivity={activity.data?.recentActivity}
                alerts={activity.data?.alerts}
                currency={activity.data?.meta?.currency ?? currency}
                isLoading={activity.isPending}
                isError={activity.isError}
              />
            </div>
          </TabsContent>
        </div>
          </Tabs>
        </>
      ) : null}
    </div>
  );
};
