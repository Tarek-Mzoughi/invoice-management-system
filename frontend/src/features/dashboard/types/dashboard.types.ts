export type DashboardTrend = 'positive' | 'negative' | 'neutral';
export type DashboardAlertSeverity = 'danger' | 'warning' | 'info';
export type DashboardAlertType =
  | 'overdueInvoice'
  | 'paymentFollowUp'
  | 'recentDraft'
  | 'highReceivableClient';
export type DashboardRecentActivityType = 'invoice' | 'quotation' | 'payment' | 'customerOrder';

export type DashboardPeriod =
  | 'today'
  | 'last7Days'
  | 'last30Days'
  | 'currentMonth'
  | 'currentYear'
  | 'custom';

export type DashboardDocumentType =
  | 'all'
  | 'invoice'
  | 'quotation'
  | 'payment'
  | 'customerOrder'
  | 'purchase';

export interface DashboardFilters {
  period: DashboardPeriod;
  documentType: DashboardDocumentType;
  startDate?: string;
  endDate?: string;
  clientId?: number;
  supplierId?: number;
  currencyId?: number;
  topLimit?: number;
}

export interface DashboardCurrency {
  id?: number;
  code?: string;
  symbol?: string;
  digitAfterComma?: number;
}

export interface DashboardKpi {
  value: number;
  previousValue?: number;
  changePercent?: number | null;
  trend: DashboardTrend;
}

export interface DashboardSummary {
  totalRevenue: DashboardKpi;
  currentMonthRevenue: DashboardKpi;
  totalInvoices: DashboardKpi;
  paidInvoices: DashboardKpi;
  unpaidInvoices: DashboardKpi;
  partiallyPaidInvoices: DashboardKpi;
  collectedAmount: DashboardKpi;
  remainingAmount: DashboardKpi;
  overduePayments: DashboardKpi;
  collectionRate: DashboardKpi;
  avgDaysToPayment: DashboardKpi;
  quotationConversionRate: DashboardKpi;
  clients: DashboardKpi;
  suppliers: DashboardKpi;
  articles: DashboardKpi;
  quotations: DashboardKpi;
  customerOrders: DashboardKpi;
  purchaseDocuments: DashboardKpi;
}

export interface DashboardTimeSeriesPoint {
  period: string;
  label: string;
  value: number;
}

export interface DashboardMultiSeriesPoint {
  period: string;
  label: string;
  revenue: number;
  collected: number;
}

export interface DashboardStatusPoint {
  status: string;
  label: string;
  value: number;
  amount: number;
}

export interface DashboardPaymentMethodPoint {
  method: string;
  label: string;
  value: number;
  amount: number;
}

export interface DashboardReceivablesAging {
  bucket: string;
  label: string;
  count: number;
  amount: number;
}

export interface DashboardTopClient {
  clientId: number;
  clientName: string;
  revenue: number;
  invoiceCount: number;
  remainingAmount: number;
}

export interface DashboardTopArticle {
  articleId: number;
  articleName: string;
  revenue: number;
  quantitySold: number;
  invoiceCount: number;
}

export interface DashboardRecentActivity {
  id: number;
  type: DashboardRecentActivityType;
  label: string;
  reference?: string | null;
  partnerName?: string | null;
  amount: number;
  date?: string | null;
  status?: string | null;
  route?: string | null;
}

export interface DashboardAlert {
  id: string;
  type: DashboardAlertType;
  severity: DashboardAlertSeverity;
  entityLabel?: string | null;
  partnerName?: string | null;
  amount?: number;
  route?: string | null;
  date?: string | null;
}

export interface DashboardDebug {
  appliedFilters: Record<string, unknown>;
  counts: {
    invoices: number;
    payments: number;
    clients: number;
    suppliers: number;
    articles: number;
    quotations: number;
    customerOrders: number;
  };
  periodRange: { startDate: string; endDate: string };
}

export interface DashboardMeta {
  cabinetId: number;
  currency: DashboardCurrency;
  period: {
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
  };
  generatedAt: string;
  debug?: DashboardDebug;
}

export interface DashboardOverview {
  summary: DashboardSummary;
  revenueChart: DashboardTimeSeriesPoint[];
  revenueVsCollectionsChart: DashboardMultiSeriesPoint[];
  invoiceStatusChart: DashboardStatusPoint[];
  paymentMethodsChart: DashboardPaymentMethodPoint[];
  paymentEvolutionChart: DashboardTimeSeriesPoint[];
  receivablesAgingChart: DashboardReceivablesAging[];
  topClients: DashboardTopClient[];
  topArticles: DashboardTopArticle[];
  recentActivity: DashboardRecentActivity[];
  alerts: DashboardAlert[];
  meta: DashboardMeta;
}

// ─── Purchases Analytics ─────────────────────────────────────────────────────

export interface DashboardTopSupplier {
  supplierId: number;
  supplierName: string;
  totalPurchases: number;
  invoiceCount: number;
  remainingAmount: number;
}

export interface DashboardPurchasesSummary {
  totalPurchases: DashboardKpi;
  currentMonthPurchases: DashboardKpi;
  totalBuyingInvoices: DashboardKpi;
  paidBuyingInvoices: DashboardKpi;
  unpaidBuyingInvoices: DashboardKpi;
  amountPaidToSuppliers: DashboardKpi;
  remainingPayables: DashboardKpi;
  payablesAgingOverdue: DashboardKpi;
}

export interface DashboardPurchases {
  summary: DashboardPurchasesSummary;
  purchasesChart: DashboardTimeSeriesPoint[];
  purchasesVsPaymentsChart: DashboardMultiSeriesPoint[];
  buyingInvoiceStatusChart: DashboardStatusPoint[];
  payablesAgingChart: DashboardReceivablesAging[];
  topSuppliers: DashboardTopSupplier[];
  buyingPaymentMethodsChart: DashboardPaymentMethodPoint[];
  meta: DashboardMeta;
}

// ─── Treasury Analytics ──────────────────────────────────────────────────────

export interface DashboardBankBalance {
  bankAccountId: number;
  bankAccountName: string;
  accountType: string;
  balance: number;
  inflowsTotal: number;
  outflowsTotal: number;
}

export interface DashboardCashFlowPoint {
  period: string;
  label: string;
  inflows: number;
  outflows: number;
  net: number;
}

export interface DashboardTreasurySummary {
  totalBalance: DashboardKpi;
  totalInflows: DashboardKpi;
  totalOutflows: DashboardKpi;
  netCashFlow: DashboardKpi;
  movementsCount: DashboardKpi;
}

export interface DashboardTreasury {
  summary: DashboardTreasurySummary;
  bankBalances: DashboardBankBalance[];
  cashFlowChart: DashboardCashFlowPoint[];
  inflowsByCategory: DashboardPaymentMethodPoint[];
  outflowsByCategory: DashboardPaymentMethodPoint[];
  meta: DashboardMeta;
}

// ─── Withholding Tax Analytics ───────────────────────────────────────────────

export interface DashboardWithholdingEntry {
  taxId: number;
  taxLabel: string;
  rate: number;
  totalBase: number;
  totalWithheld: number;
  invoiceCount: number;
}

export interface DashboardWithholdingSummary {
  totalWithheld: DashboardKpi;
  totalBase: DashboardKpi;
  averageRate: DashboardKpi;
  entriesCount: DashboardKpi;
}

export interface DashboardWithholding {
  summary: DashboardWithholdingSummary;
  withholdingByTax: DashboardWithholdingEntry[];
  withholdingEvolution: DashboardTimeSeriesPoint[];
  meta: DashboardMeta;
}

// ─── Global (Vue globale) ────────────────────────────────────────────────────

export interface DashboardGlobalSummary {
  totalRevenue: DashboardKpi;
  totalPurchases: DashboardKpi;
  netMargin: DashboardKpi;
  totalCollected: DashboardKpi;
  totalPaidToSuppliers: DashboardKpi;
  totalReceivables: DashboardKpi;
  totalPayables: DashboardKpi;
  treasuryBalance: DashboardKpi;
  collectionRate: DashboardKpi;
  paymentRate: DashboardKpi;
  totalInvoices: DashboardKpi;
  totalPayments: DashboardKpi;
}

export interface DashboardRevenueVsPurchasesPoint {
  period: string;
  label: string;
  revenue: number;
  purchases: number;
  net: number;
}

export interface DashboardGlobal {
  summary: DashboardGlobalSummary;
  revenueVsPurchasesChart: DashboardRevenueVsPurchasesPoint[];
  cashFlowSummaryChart: DashboardCashFlowPoint[];
  sellingInvoiceStatusChart: DashboardStatusPoint[];
  buyingInvoiceStatusChart: DashboardStatusPoint[];
  meta: DashboardMeta;
}

// ─── Sales (Vente) ───────────────────────────────────────────────────────────

export interface DashboardSalesSummary {
  totalRevenue: DashboardKpi;
  currentMonthRevenue: DashboardKpi;
  totalInvoices: DashboardKpi;
  paidInvoices: DashboardKpi;
  unpaidInvoices: DashboardKpi;
  partiallyPaidInvoices: DashboardKpi;
  collectedAmount: DashboardKpi;
  remainingAmount: DashboardKpi;
  overduePayments: DashboardKpi;
  collectionRate: DashboardKpi;
  avgDaysToPayment: DashboardKpi;
  quotationConversionRate: DashboardKpi;
}

export interface DashboardSales {
  summary: DashboardSalesSummary;
  revenueChart: DashboardTimeSeriesPoint[];
  revenueVsCollectionsChart: DashboardMultiSeriesPoint[];
  invoiceStatusChart: DashboardStatusPoint[];
  paymentMethodsChart: DashboardPaymentMethodPoint[];
  paymentEvolutionChart: DashboardTimeSeriesPoint[];
  receivablesAgingChart: DashboardReceivablesAging[];
  topClients: DashboardTopClient[];
  topArticles: DashboardTopArticle[];
  meta: DashboardMeta;
}

// ─── Payments (Paiements) ────────────────────────────────────────────────────

export interface DashboardPaymentsSummary {
  totalReceived: DashboardKpi;
  totalPaid: DashboardKpi;
  netPayments: DashboardKpi;
  receivedCount: DashboardKpi;
  paidCount: DashboardKpi;
  overdueReceivables: DashboardKpi;
  overduePayables: DashboardKpi;
  avgCollectionDays: DashboardKpi;
  avgPaymentDays: DashboardKpi;
}

export interface DashboardPayments {
  summary: DashboardPaymentsSummary;
  receivedEvolutionChart: DashboardTimeSeriesPoint[];
  paidEvolutionChart: DashboardTimeSeriesPoint[];
  receivedByMethodChart: DashboardPaymentMethodPoint[];
  paidByMethodChart: DashboardPaymentMethodPoint[];
  receivablesAgingChart: DashboardReceivablesAging[];
  payablesAgingChart: DashboardReceivablesAging[];
  meta: DashboardMeta;
}

// ─── Referentials (Référentiels) ─────────────────────────────────────────────

export interface DashboardQuotationStats {
  total: number;
  invoiced: number;
  conversionRate: number;
}

export interface DashboardReferentialsSummary {
  clients: DashboardKpi;
  suppliers: DashboardKpi;
  articles: DashboardKpi;
  quotations: DashboardKpi;
  customerOrders: DashboardKpi;
  purchaseDocuments: DashboardKpi;
}

export interface DashboardReferentials {
  summary: DashboardReferentialsSummary;
  topClientsByRevenue: DashboardTopClient[];
  topSuppliersByPurchases: DashboardTopSupplier[];
  topArticlesByRevenue: DashboardTopArticle[];
  quotationStats: DashboardQuotationStats;
  meta: DashboardMeta;
}

// ─── Activity & Alerts (Activité & Alertes) ──────────────────────────────────

export interface DashboardActivity {
  recentActivity: DashboardRecentActivity[];
  alerts: DashboardAlert[];
  meta: DashboardMeta;
}

// ─── Dashboard Tab ───────────────────────────────────────────────────────────

export type DashboardTab =
  | 'global'
  | 'sales'
  | 'purchases'
  | 'payments'
  | 'treasury'
  | 'withholding'
  | 'referentials'
  | 'activity';
