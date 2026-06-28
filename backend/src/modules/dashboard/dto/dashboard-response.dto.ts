export type DashboardTrend = 'positive' | 'negative' | 'neutral';
export type DashboardChartSeriesType = 'revenue' | 'payment';
export type DashboardAlertSeverity = 'danger' | 'warning' | 'info';
export type DashboardAlertType =
  | 'overdueInvoice'
  | 'paymentFollowUp'
  | 'recentDraft'
  | 'highReceivableClient';
export type DashboardRecentActivityType =
  | 'invoice'
  | 'quotation'
  | 'payment'
  | 'customerOrder';

export interface DashboardCurrencyDto {
  id?: number;
  code?: string;
  symbol?: string;
  digitAfterComma?: number;
}

export interface DashboardKpiDto {
  value: number;
  previousValue?: number;
  changePercent?: number | null;
  trend: DashboardTrend;
}

export interface DashboardSummaryDto {
  totalRevenue: DashboardKpiDto;
  currentMonthRevenue: DashboardKpiDto;
  totalInvoices: DashboardKpiDto;
  paidInvoices: DashboardKpiDto;
  unpaidInvoices: DashboardKpiDto;
  partiallyPaidInvoices: DashboardKpiDto;
  collectedAmount: DashboardKpiDto;
  remainingAmount: DashboardKpiDto;
  overduePayments: DashboardKpiDto;
  collectionRate: DashboardKpiDto;
  avgDaysToPayment: DashboardKpiDto;
  quotationConversionRate: DashboardKpiDto;
  clients: DashboardKpiDto;
  suppliers: DashboardKpiDto;
  articles: DashboardKpiDto;
  quotations: DashboardKpiDto;
  customerOrders: DashboardKpiDto;
  purchaseDocuments: DashboardKpiDto;
}

export interface DashboardTimeSeriesPointDto {
  period: string;
  label: string;
  value: number;
}

export interface DashboardMultiSeriesPointDto {
  period: string;
  label: string;
  revenue: number;
  collected: number;
}

export interface DashboardStatusPointDto {
  status: string;
  label: string;
  value: number;
  amount: number;
}

export interface DashboardPaymentMethodPointDto {
  method: string;
  label: string;
  value: number;
  amount: number;
}

export interface DashboardReceivablesAgingDto {
  bucket: string;
  label: string;
  count: number;
  amount: number;
}

export interface DashboardTopArticleDto {
  articleId: number;
  articleName: string;
  revenue: number;
  quantitySold: number;
  invoiceCount: number;
}

export interface DashboardTopClientDto {
  clientId: number;
  clientName: string;
  revenue: number;
  invoiceCount: number;
  remainingAmount: number;
}

export interface DashboardRecentActivityDto {
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

export interface DashboardAlertDto {
  id: string;
  type: DashboardAlertType;
  severity: DashboardAlertSeverity;
  entityLabel?: string | null;
  partnerName?: string | null;
  amount?: number;
  route?: string | null;
  date?: string | null;
}

export interface DashboardDebugDto {
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

export interface DashboardOverviewMetaDto {
  cabinetId: number;
  currency: DashboardCurrencyDto;
  period: {
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
  };
  generatedAt: string;
  debug?: DashboardDebugDto;
}

export interface DashboardOverviewDto {
  summary: DashboardSummaryDto;
  revenueChart: DashboardTimeSeriesPointDto[];
  revenueVsCollectionsChart: DashboardMultiSeriesPointDto[];
  invoiceStatusChart: DashboardStatusPointDto[];
  paymentMethodsChart: DashboardPaymentMethodPointDto[];
  paymentEvolutionChart: DashboardTimeSeriesPointDto[];
  receivablesAgingChart: DashboardReceivablesAgingDto[];
  topClients: DashboardTopClientDto[];
  topArticles: DashboardTopArticleDto[];
  recentActivity: DashboardRecentActivityDto[];
  alerts: DashboardAlertDto[];
  meta: DashboardOverviewMetaDto;
}

// ─── Purchases Analytics ─────────────────────────────────────────────────────

export interface DashboardTopSupplierDto {
  supplierId: number;
  supplierName: string;
  totalPurchases: number;
  invoiceCount: number;
  remainingAmount: number;
}

export interface DashboardPurchasesSummaryDto {
  totalPurchases: DashboardKpiDto;
  currentMonthPurchases: DashboardKpiDto;
  totalBuyingInvoices: DashboardKpiDto;
  paidBuyingInvoices: DashboardKpiDto;
  unpaidBuyingInvoices: DashboardKpiDto;
  amountPaidToSuppliers: DashboardKpiDto;
  remainingPayables: DashboardKpiDto;
  payablesAgingOverdue: DashboardKpiDto;
}

export interface DashboardPurchasesDto {
  summary: DashboardPurchasesSummaryDto;
  purchasesChart: DashboardTimeSeriesPointDto[];
  purchasesVsPaymentsChart: DashboardMultiSeriesPointDto[];
  buyingInvoiceStatusChart: DashboardStatusPointDto[];
  payablesAgingChart: DashboardReceivablesAgingDto[];
  topSuppliers: DashboardTopSupplierDto[];
  buyingPaymentMethodsChart: DashboardPaymentMethodPointDto[];
  meta: DashboardOverviewMetaDto;
}

// ─── Treasury Analytics ──────────────────────────────────────────────────────

export interface DashboardBankBalanceDto {
  bankAccountId: number;
  bankAccountName: string;
  accountType: string;
  balance: number;
  inflowsTotal: number;
  outflowsTotal: number;
}

export interface DashboardCashFlowPointDto {
  period: string;
  label: string;
  inflows: number;
  outflows: number;
  net: number;
}

export interface DashboardTreasurySummaryDto {
  totalBalance: DashboardKpiDto;
  totalInflows: DashboardKpiDto;
  totalOutflows: DashboardKpiDto;
  netCashFlow: DashboardKpiDto;
  movementsCount: DashboardKpiDto;
}

export interface DashboardTreasuryDto {
  summary: DashboardTreasurySummaryDto;
  bankBalances: DashboardBankBalanceDto[];
  cashFlowChart: DashboardCashFlowPointDto[];
  inflowsByCategory: DashboardPaymentMethodPointDto[];
  outflowsByCategory: DashboardPaymentMethodPointDto[];
  meta: DashboardOverviewMetaDto;
}

// ─── Withholding Tax Analytics ───────────────────────────────────────────────

export interface DashboardWithholdingEntryDto {
  taxId: number;
  taxLabel: string;
  rate: number;
  totalBase: number;
  totalWithheld: number;
  invoiceCount: number;
}

export interface DashboardWithholdingSummaryDto {
  totalWithheld: DashboardKpiDto;
  totalBase: DashboardKpiDto;
  averageRate: DashboardKpiDto;
  entriesCount: DashboardKpiDto;
}

export interface DashboardWithholdingDto {
  summary: DashboardWithholdingSummaryDto;
  withholdingByTax: DashboardWithholdingEntryDto[];
  withholdingEvolution: DashboardTimeSeriesPointDto[];
  meta: DashboardOverviewMetaDto;
}

// ─── Global (Vue globale) ────────────────────────────────────────────────────

export interface DashboardGlobalSummaryDto {
  totalRevenue: DashboardKpiDto;
  totalPurchases: DashboardKpiDto;
  netMargin: DashboardKpiDto;
  totalCollected: DashboardKpiDto;
  totalPaidToSuppliers: DashboardKpiDto;
  totalReceivables: DashboardKpiDto;
  totalPayables: DashboardKpiDto;
  treasuryBalance: DashboardKpiDto;
  collectionRate: DashboardKpiDto;
  paymentRate: DashboardKpiDto;
  totalInvoices: DashboardKpiDto;
  totalPayments: DashboardKpiDto;
}

export interface DashboardRevenueVsPurchasesPointDto {
  period: string;
  label: string;
  revenue: number;
  purchases: number;
  net: number;
}

export interface DashboardGlobalDto {
  summary: DashboardGlobalSummaryDto;
  revenueVsPurchasesChart: DashboardRevenueVsPurchasesPointDto[];
  cashFlowSummaryChart: DashboardCashFlowPointDto[];
  sellingInvoiceStatusChart: DashboardStatusPointDto[];
  buyingInvoiceStatusChart: DashboardStatusPointDto[];
  meta: DashboardOverviewMetaDto;
}

// ─── Sales (Vente) ───────────────────────────────────────────────────────────

export interface DashboardSalesSummaryDto {
  totalRevenue: DashboardKpiDto;
  currentMonthRevenue: DashboardKpiDto;
  totalInvoices: DashboardKpiDto;
  paidInvoices: DashboardKpiDto;
  unpaidInvoices: DashboardKpiDto;
  partiallyPaidInvoices: DashboardKpiDto;
  collectedAmount: DashboardKpiDto;
  remainingAmount: DashboardKpiDto;
  overduePayments: DashboardKpiDto;
  collectionRate: DashboardKpiDto;
  avgDaysToPayment: DashboardKpiDto;
  quotationConversionRate: DashboardKpiDto;
}

export interface DashboardSalesDto {
  summary: DashboardSalesSummaryDto;
  revenueChart: DashboardTimeSeriesPointDto[];
  revenueVsCollectionsChart: DashboardMultiSeriesPointDto[];
  invoiceStatusChart: DashboardStatusPointDto[];
  paymentMethodsChart: DashboardPaymentMethodPointDto[];
  paymentEvolutionChart: DashboardTimeSeriesPointDto[];
  receivablesAgingChart: DashboardReceivablesAgingDto[];
  topClients: DashboardTopClientDto[];
  topArticles: DashboardTopArticleDto[];
  meta: DashboardOverviewMetaDto;
}

// ─── Payments (Paiements) ────────────────────────────────────────────────────

export interface DashboardPaymentsSummaryDto {
  totalReceived: DashboardKpiDto;
  totalPaid: DashboardKpiDto;
  netPayments: DashboardKpiDto;
  receivedCount: DashboardKpiDto;
  paidCount: DashboardKpiDto;
  overdueReceivables: DashboardKpiDto;
  overduePayables: DashboardKpiDto;
  avgCollectionDays: DashboardKpiDto;
  avgPaymentDays: DashboardKpiDto;
}

export interface DashboardPaymentsDto {
  summary: DashboardPaymentsSummaryDto;
  receivedEvolutionChart: DashboardTimeSeriesPointDto[];
  paidEvolutionChart: DashboardTimeSeriesPointDto[];
  receivedByMethodChart: DashboardPaymentMethodPointDto[];
  paidByMethodChart: DashboardPaymentMethodPointDto[];
  receivablesAgingChart: DashboardReceivablesAgingDto[];
  payablesAgingChart: DashboardReceivablesAgingDto[];
  meta: DashboardOverviewMetaDto;
}

// ─── Referentials (Référentiels) ─────────────────────────────────────────────

export interface DashboardQuotationStatsDto {
  total: number;
  invoiced: number;
  conversionRate: number;
}

export interface DashboardReferentialsSummaryDto {
  clients: DashboardKpiDto;
  suppliers: DashboardKpiDto;
  articles: DashboardKpiDto;
  quotations: DashboardKpiDto;
  customerOrders: DashboardKpiDto;
  purchaseDocuments: DashboardKpiDto;
}

export interface DashboardReferentialsDto {
  summary: DashboardReferentialsSummaryDto;
  topClientsByRevenue: DashboardTopClientDto[];
  topSuppliersByPurchases: DashboardTopSupplierDto[];
  topArticlesByRevenue: DashboardTopArticleDto[];
  quotationStats: DashboardQuotationStatsDto;
  meta: DashboardOverviewMetaDto;
}

// ─── Activity & Alerts (Activité & Alertes) ──────────────────────────────────

export interface DashboardActivityDto {
  recentActivity: DashboardRecentActivityDto[];
  alerts: DashboardAlertDto[];
  meta: DashboardOverviewMetaDto;
}
