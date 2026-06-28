import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  addMonths,
  differenceInCalendarDays,
  endOfDay,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { ArticleEntity } from 'src/modules/article/entities/article.entity';
import { CabinetService } from 'src/modules/cabinet/services/cabinet.service';
import { CurrencyEntity } from 'src/modules/currency/entities/currency.entity';
import { CurrencyService } from 'src/modules/currency/services/currency.service';
import { CustomerOrderEntity } from 'src/modules/customer-order/entities/customer-order.entity';
import { CUSTOMER_ORDER_STATUS } from 'src/modules/customer-order/enums/customer-order-status.enum';
import { FIRM_ENTITY_TYPE } from 'src/modules/firm/enums/firm-entity-type.enum';
import { FirmEntity } from 'src/modules/firm/entities/firm.entity';
import { ArticleInvoiceEntryEntity } from 'src/modules/invoice/entities/article-invoice-entry.entity';
import { InvoiceEntity } from 'src/modules/invoice/entities/invoice.entity';
import { INVOICE_STATUS } from 'src/modules/invoice/enums/invoice-status.enum';
import { PaymentEntity } from 'src/modules/payment/entities/payment.entity';
import { PAYMENT_COLLECTION_STATUS } from 'src/modules/payment/enums/payment-collection-status.enum';
import { PAYMENT_MODE } from 'src/modules/payment/enums/payment-mode.enum';
import { QuotationEntity } from 'src/modules/quotation/entities/quotation.entity';
import { QUOTATION_STATUS } from 'src/modules/quotation/enums/quotation-status.enum';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import {
  DASHBOARD_DOCUMENT_TYPE,
  DASHBOARD_PERIOD,
  DashboardQueryDto,
} from './dto/dashboard-query.dto';
import {
  DashboardActivityDto,
  DashboardAlertDto,
  DashboardDebugDto,
  DashboardGlobalDto,
  DashboardGlobalSummaryDto,
  DashboardKpiDto,
  DashboardMultiSeriesPointDto,
  DashboardOverviewDto,
  DashboardOverviewMetaDto,
  DashboardPaymentsDto,
  DashboardPaymentsSummaryDto,
  DashboardPaymentMethodPointDto,
  DashboardQuotationStatsDto,
  DashboardRecentActivityDto,
  DashboardReceivablesAgingDto,
  DashboardReferentialsDto,
  DashboardReferentialsSummaryDto,
  DashboardRevenueVsPurchasesPointDto,
  DashboardSalesDto,
  DashboardSalesSummaryDto,
  DashboardStatusPointDto,
  DashboardSummaryDto,
  DashboardTimeSeriesPointDto,
  DashboardTopArticleDto,
  DashboardTopClientDto,
  DashboardTrend,
} from './dto/dashboard-response.dto';
import { DashboardExtendedService } from './dashboard-extended.service';

const IS_DEV = process.env.NODE_ENV !== 'production';

interface DashboardDateRange {
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
  previousEndDate: Date;
}

interface DashboardContext {
  cabinetId: number;
  currencyId?: number;
  query: DashboardQueryDto;
  range: DashboardDateRange;
}

interface CountAmount {
  count: number;
  amount: number;
}

interface RecentActivityRaw {
  id: number;
  type: DashboardRecentActivityDto['type'];
  label: string;
  reference?: string | null;
  partnerName?: string | null;
  amount: number;
  date?: Date | string | null;
  status?: string | null;
  activityType?: ACTIVITY_TYPE | null;
  createdAt?: Date | string | null;
}

const FINANCIAL_INVOICE_EXCLUDED_STATUSES = [
  INVOICE_STATUS.Draft,
  INVOICE_STATUS.Nonexistent,
  INVOICE_STATUS.Archived,
];

const PAID_INVOICE_STATUSES = [INVOICE_STATUS.Paid, INVOICE_STATUS.Settled];
const PARTIAL_INVOICE_STATUSES = [
  INVOICE_STATUS.PartiallyPaid,
  INVOICE_STATUS.PartiallySettled,
];
const UNPAID_INVOICE_STATUSES = [
  INVOICE_STATUS.Unpaid,
  INVOICE_STATUS.Validated,
  INVOICE_STATUS.Sent,
  INVOICE_STATUS.Expired,
];
const OPEN_INVOICE_STATUSES = [
  ...UNPAID_INVOICE_STATUSES,
  ...PARTIAL_INVOICE_STATUSES,
];
const NEGOTIABLE_PAYMENT_MODES = [
  PAYMENT_MODE.Check,
  PAYMENT_MODE.BillOfExchange,
];

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(ArticleInvoiceEntryEntity)
    private readonly articleInvoiceEntryRepository: Repository<ArticleInvoiceEntryEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(FirmEntity)
    private readonly firmRepository: Repository<FirmEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(QuotationEntity)
    private readonly quotationRepository: Repository<QuotationEntity>,
    @InjectRepository(CustomerOrderEntity)
    private readonly customerOrderRepository: Repository<CustomerOrderEntity>,
    private readonly tenantContextService: TenantContextService,
    private readonly cabinetService: CabinetService,
    private readonly currencyService: CurrencyService,
    private readonly extendedService: DashboardExtendedService,
  ) {}

  async getOverview(
    query: DashboardQueryDto,
    userId?: string,
  ): Promise<DashboardOverviewDto> {
    const cabinetId =
      await this.tenantContextService.getCurrentCabinetIdOrFail(userId);
    const cabinet = await this.cabinetService.findOneById(cabinetId);

    // When user explicitly selects a currency, filter by it.
    // Otherwise, show all currencies and use the cabinet currency only for formatting.
    const displayCurrency = await this.resolveCurrency(
      query.currencyId,
      cabinet.currencyId,
      cabinet.currency,
    );
    const currencyId = query.currencyId ? displayCurrency?.id : undefined;
    const range = this.resolveDateRange(query);
    const context: DashboardContext = { cabinetId, currencyId, query, range };

    const [
      summary,
      revenueChart,
      revenueVsCollectionsChart,
      invoiceStatusChart,
      paymentMethodsChart,
      paymentEvolutionChart,
      receivablesAgingChart,
      topClients,
      topArticles,
      recentActivity,
      alerts,
    ] = await Promise.all([
      this.getSummary(context),
      this.getRevenueChart(context),
      this.getRevenueVsCollectionsChart(context),
      this.getInvoiceStatusChart(context),
      this.getPaymentMethodsChart(context),
      this.getPaymentEvolutionChart(context),
      this.getReceivablesAgingChart(context),
      this.getTopClients(context),
      this.getTopArticles(context),
      this.getRecentActivity(context),
      this.getAlerts(context),
    ]);

    let debug: DashboardDebugDto | undefined;
    if (IS_DEV) {
      debug = await this.buildDebugInfo(context, summary);
      this.logger.debug(
        `Dashboard overview: cabinet=${cabinetId} currency=${currencyId} ` +
          `period=${range.startDate.toISOString()}..${range.endDate.toISOString()} ` +
          `totalRows(no currency/date filter): invoices=${debug.counts.invoices} payments=${debug.counts.payments} ` +
          `clients=${debug.counts.clients} articles=${debug.counts.articles}`,
      );
      this.logger.debug(
        `Dashboard summary values: ` +
          `totalRevenue=${summary.totalRevenue.value} totalInvoices=${summary.totalInvoices.value} ` +
          `paidInvoices=${summary.paidInvoices.value} unpaidInvoices=${summary.unpaidInvoices.value} ` +
          `collectedAmount=${summary.collectedAmount.value} remainingAmount=${summary.remainingAmount.value} ` +
          `revenueChartPoints=${revenueChart.length} invoiceStatusPoints=${invoiceStatusChart.length} ` +
          `paymentMethodsPoints=${paymentMethodsChart.length} topClients=${topClients.length} ` +
          `recentActivity=${recentActivity.length} alerts=${alerts.length}`,
      );
    }

    return {
      summary,
      revenueChart,
      revenueVsCollectionsChart,
      invoiceStatusChart,
      paymentMethodsChart,
      paymentEvolutionChart,
      receivablesAgingChart,
      topClients,
      topArticles,
      recentActivity,
      alerts,
      meta: {
        cabinetId,
        currency: {
          id: displayCurrency?.id,
          code: displayCurrency?.code,
          symbol: displayCurrency?.symbol,
          digitAfterComma: displayCurrency?.digitAfterComma,
        },
        period: {
          startDate: range.startDate.toISOString(),
          endDate: range.endDate.toISOString(),
          previousStartDate: range.previousStartDate.toISOString(),
          previousEndDate: range.previousEndDate.toISOString(),
        },
        generatedAt: new Date().toISOString(),
        ...(IS_DEV && debug ? { debug } : {}),
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW ENDPOINTS — Phase 2 Dashboard Refonte
  // ═══════════════════════════════════════════════════════════════════════════

  /** GET /dashboard/global — aggregated selling + buying + treasury */
  async getGlobal(
    query: DashboardQueryDto,
    userId?: string,
  ): Promise<DashboardGlobalDto> {
    const { context, displayCurrency, range } = await this.resolveContext(
      query,
      userId,
    );

    // Selling aggregates
    const prevRange = {
      startDate: range.previousStartDate,
      endDate: range.previousEndDate,
    };
    const [
      revenue,
      prevRevenue,
      collected,
      prevCollected,
      remaining,
      prevRemaining,
      invoiceStatus,
      prevInvoiceStatus,
    ] = await Promise.all([
      this.sumInvoiceTotal(context, range),
      this.sumInvoiceTotal(context, prevRange),
      this.sumCollectedPayments(context, range),
      this.sumCollectedPayments(context, prevRange),
      this.sumRemainingInvoices(context, range),
      this.sumRemainingInvoices(context, prevRange),
      this.getInvoiceStatusCounts(context, range),
      this.getInvoiceStatusCounts(context, prevRange),
    ]);

    // Buying + treasury aggregates (delegated to extended service)
    const [buying, treasury] = await Promise.all([
      this.extendedService.getBuyingAggregatesForGlobal(
        context.cabinetId,
        context.currencyId,
        range,
      ),
      this.extendedService.getTreasuryBalanceForGlobal(
        context.cabinetId,
        context.currencyId,
        range,
      ),
    ]);

    // Charts (parallel)
    const [
      revenueChart,
      purchasesChart,
      cashFlowChart,
      sellingStatusChart,
      buyingStatusChart,
    ] = await Promise.all([
      this.getRevenueChart(context),
      this.extendedService.getPurchasesChartPublic(
        context.cabinetId,
        context.currencyId,
        range,
      ),
      this.extendedService.getCashFlowChartPublic(
        context.cabinetId,
        context.currencyId,
        range,
      ),
      this.getInvoiceStatusChart(context),
      this.extendedService.getBuyingInvoiceStatusChartPublic(
        context.cabinetId,
        context.currencyId,
        range,
      ),
    ]);

    // Merge revenue + purchases into revenueVsPurchasesChart
    const purchasesByPeriod = new Map(
      purchasesChart.map((p) => [p.period, p.value]),
    );
    const revenueVsPurchasesChart: DashboardRevenueVsPurchasesPointDto[] =
      revenueChart.map((r) => ({
        period: r.period,
        label: r.label,
        revenue: r.value,
        purchases: purchasesByPeriod.get(r.period) ?? 0,
        net: r.value - (purchasesByPeriod.get(r.period) ?? 0),
      }));

    // KPI computations
    const netMargin = revenue - buying.totalPurchases;
    const prevNetMargin = prevRevenue - buying.prevTotalPurchases;
    const collectionRate =
      revenue > 0 ? this.round((collected / revenue) * 100, 1) : 0;
    const prevCollectionRate =
      prevRevenue > 0 ? this.round((prevCollected / prevRevenue) * 100, 1) : 0;
    const paymentRate =
      buying.totalPurchases > 0
        ? this.round((buying.paidToSuppliers / buying.totalPurchases) * 100, 1)
        : 0;
    const prevPaymentRate =
      buying.prevTotalPurchases > 0
        ? this.round(
            (buying.prevPaidToSuppliers / buying.prevTotalPurchases) * 100,
            1,
          )
        : 0;

    const summary: DashboardGlobalSummaryDto = {
      totalRevenue: this.kpi(revenue, prevRevenue),
      totalPurchases: this.kpi(
        buying.totalPurchases,
        buying.prevTotalPurchases,
        false,
      ),
      netMargin: this.kpi(netMargin, prevNetMargin),
      totalCollected: this.kpi(collected, prevCollected),
      totalPaidToSuppliers: this.kpi(
        buying.paidToSuppliers,
        buying.prevPaidToSuppliers,
        false,
      ),
      totalReceivables: this.kpi(remaining, prevRemaining, false),
      totalPayables: this.kpi(
        buying.remainingPayables,
        buying.prevRemainingPayables,
        false,
      ),
      treasuryBalance: this.kpi(treasury.balance, treasury.prevBalance),
      collectionRate: this.kpi(collectionRate, prevCollectionRate),
      paymentRate: this.kpi(paymentRate, prevPaymentRate),
      totalInvoices: this.kpi(
        invoiceStatus.total.count + buying.totalBuyingInvoices,
        prevInvoiceStatus.total.count + buying.prevTotalBuyingInvoices,
      ),
      totalPayments: this.kpi(
        this.toNumber(collected) > 0 || buying.buyingPaymentsCount > 0
          ? invoiceStatus.paid.count + buying.buyingPaymentsCount
          : 0,
        prevInvoiceStatus.paid.count + buying.prevBuyingPaymentsCount,
      ),
    };

    return {
      summary,
      revenueVsPurchasesChart,
      cashFlowSummaryChart: cashFlowChart,
      sellingInvoiceStatusChart: sellingStatusChart,
      buyingInvoiceStatusChart: buyingStatusChart,
      meta: this.buildMetaDto(context.cabinetId, displayCurrency, range),
    };
  }

  /** GET /dashboard/sales — selling-only (extracted from old overview minus entity counts) */
  async getSales(
    query: DashboardQueryDto,
    userId?: string,
  ): Promise<DashboardSalesDto> {
    const { context, displayCurrency, range } = await this.resolveContext(
      query,
      userId,
    );
    const prevRange = {
      startDate: range.previousStartDate,
      endDate: range.previousEndDate,
    };
    const currentMonthRange = this.resolveCurrentMonthRange();
    const previousMonthRange = {
      startDate: startOfMonth(subMonths(new Date(), 1)),
      endDate: endOfDay(subDays(startOfMonth(new Date()), 1)),
    };

    const [
      revenue,
      prevRevenue,
      currentMonthRevenue,
      prevMonthRevenue,
      invoiceStatus,
      prevInvoiceStatus,
      collected,
      prevCollected,
      remaining,
      prevRemaining,
      overduePayments,
      prevOverduePayments,
      avgDays,
      prevAvgDays,
      quotationConversion,
      prevQuotationConversion,
      revenueChart,
      revenueVsCollectionsChart,
      invoiceStatusChart,
      paymentMethodsChart,
      paymentEvolutionChart,
      receivablesAgingChart,
      topClients,
      topArticles,
    ] = await Promise.all([
      this.sumInvoiceTotal(context, range),
      this.sumInvoiceTotal(context, prevRange),
      this.sumInvoiceTotal(context, currentMonthRange),
      this.sumInvoiceTotal(context, previousMonthRange),
      this.getInvoiceStatusCounts(context, range),
      this.getInvoiceStatusCounts(context, prevRange),
      this.sumCollectedPayments(context, range),
      this.sumCollectedPayments(context, prevRange),
      this.sumRemainingInvoices(context, range),
      this.sumRemainingInvoices(context, prevRange),
      this.countOverduePayments(context, new Date()),
      this.countOverduePayments(context, subDays(new Date(), 30)),
      this.getAvgDaysToPayment(context, range),
      this.getAvgDaysToPayment(context, prevRange),
      this.getQuotationConversionRate(context, range),
      this.getQuotationConversionRate(context, prevRange),
      this.getRevenueChart(context),
      this.getRevenueVsCollectionsChart(context),
      this.getInvoiceStatusChart(context),
      this.getPaymentMethodsChart(context),
      this.getPaymentEvolutionChart(context),
      this.getReceivablesAgingChart(context),
      this.getTopClients(context),
      this.getTopArticles(context),
    ]);

    const collectionRate =
      revenue > 0 ? this.round((collected / revenue) * 100, 1) : 0;
    const prevCollectionRate =
      prevRevenue > 0 ? this.round((prevCollected / prevRevenue) * 100, 1) : 0;

    const summary: DashboardSalesSummaryDto = {
      totalRevenue: this.kpi(revenue, prevRevenue),
      currentMonthRevenue: this.kpi(currentMonthRevenue, prevMonthRevenue),
      totalInvoices: this.kpi(
        invoiceStatus.total.count,
        prevInvoiceStatus.total.count,
      ),
      paidInvoices: this.kpi(
        invoiceStatus.paid.count,
        prevInvoiceStatus.paid.count,
      ),
      unpaidInvoices: this.kpi(
        invoiceStatus.unpaid.count,
        prevInvoiceStatus.unpaid.count,
        false,
      ),
      partiallyPaidInvoices: this.kpi(
        invoiceStatus.partiallyPaid.count,
        prevInvoiceStatus.partiallyPaid.count,
        false,
      ),
      collectedAmount: this.kpi(collected, prevCollected),
      remainingAmount: this.kpi(remaining, prevRemaining, false),
      overduePayments: this.kpi(overduePayments, prevOverduePayments, false),
      collectionRate: this.kpi(collectionRate, prevCollectionRate),
      avgDaysToPayment: this.kpi(avgDays, prevAvgDays, false),
      quotationConversionRate: this.kpi(
        quotationConversion,
        prevQuotationConversion,
      ),
    };

    return {
      summary,
      revenueChart,
      revenueVsCollectionsChart,
      invoiceStatusChart,
      paymentMethodsChart,
      paymentEvolutionChart,
      receivablesAgingChart,
      topClients,
      topArticles,
      meta: this.buildMetaDto(context.cabinetId, displayCurrency, range),
    };
  }

  /** GET /dashboard/payments — consolidated selling + buying payments */
  async getPayments(
    query: DashboardQueryDto,
    userId?: string,
  ): Promise<DashboardPaymentsDto> {
    const { context, displayCurrency, range } = await this.resolveContext(
      query,
      userId,
    );
    const prevRange = {
      startDate: range.previousStartDate,
      endDate: range.previousEndDate,
    };

    const [
      received,
      prevReceived,
      paid,
      prevPaid,
      overdueReceivables,
      prevOverdueReceivables,
      avgCollectionDays,
      prevAvgCollectionDays,
      avgPaymentDays,
      prevAvgPaymentDays,
      receivedEvolution,
      paidEvolution,
      receivedByMethod,
      paidByMethod,
      receivablesAging,
      payablesAging,
    ] = await Promise.all([
      this.sumCollectedPayments(context, range),
      this.sumCollectedPayments(context, prevRange),
      this.sumBuyingPaymentsFromExtended(context, range),
      this.sumBuyingPaymentsFromExtended(context, prevRange),
      this.countOverduePayments(context, new Date()),
      this.countOverduePayments(context, subDays(new Date(), 30)),
      this.getAvgDaysToPayment(context, range),
      this.getAvgDaysToPayment(context, prevRange),
      this.extendedService.getAvgDaysToPaymentBuying(
        context.cabinetId,
        context.currencyId,
        range,
      ),
      this.extendedService.getAvgDaysToPaymentBuying(
        context.cabinetId,
        context.currencyId,
        prevRange,
      ),
      this.getPaymentEvolutionChart(context),
      this.extendedService.getBuyingPaymentEvolution(
        context.cabinetId,
        context.currencyId,
        range,
      ),
      this.getPaymentMethodsChart(context),
      this.extendedService.getBuyingPaymentMethodsPublic(
        context.cabinetId,
        context.currencyId,
        range,
      ),
      this.getReceivablesAgingChart(context),
      this.extendedService.getPayablesAgingPublic(
        context.cabinetId,
        context.currencyId,
      ),
    ]);

    const summary: DashboardPaymentsSummaryDto = {
      totalReceived: this.kpi(received, prevReceived),
      totalPaid: this.kpi(paid, prevPaid, false),
      netPayments: this.kpi(received - paid, prevReceived - prevPaid),
      receivedCount: this.kpi(
        receivedByMethod.reduce((s, m) => s + m.value, 0),
      ),
      paidCount: this.kpi(paidByMethod.reduce((s, m) => s + m.value, 0)),
      overdueReceivables: this.kpi(
        overdueReceivables,
        prevOverdueReceivables,
        false,
      ),
      overduePayables: this.kpi(0), // TODO: overdue buying payments if data available
      avgCollectionDays: this.kpi(
        avgCollectionDays,
        prevAvgCollectionDays,
        false,
      ),
      avgPaymentDays: this.kpi(avgPaymentDays, prevAvgPaymentDays, false),
    };

    return {
      summary,
      receivedEvolutionChart: receivedEvolution,
      paidEvolutionChart: paidEvolution,
      receivedByMethodChart: receivedByMethod,
      paidByMethodChart: paidByMethod,
      receivablesAgingChart: receivablesAging,
      payablesAgingChart: payablesAging,
      meta: this.buildMetaDto(context.cabinetId, displayCurrency, range),
    };
  }

  /** GET /dashboard/referentials — entity counts, top lists, quotation stats */
  async getReferentials(
    query: DashboardQueryDto,
    userId?: string,
  ): Promise<DashboardReferentialsDto> {
    const { context, displayCurrency, range } = await this.resolveContext(
      query,
      userId,
    );
    const prevRange = {
      startDate: range.previousStartDate,
      endDate: range.previousEndDate,
    };

    const [
      clients,
      suppliers,
      articles,
      quotations,
      prevQuotations,
      customerOrders,
      prevCustomerOrders,
      purchaseDocuments,
      prevPurchaseDocuments,
      topClients,
      topSuppliers,
      topArticles,
      quotationConversion,
    ] = await Promise.all([
      this.countFirms(context, FIRM_ENTITY_TYPE.CLIENTS),
      this.countFirms(context, FIRM_ENTITY_TYPE.SUPPLIERS),
      this.countArticles(context),
      this.countQuotations(context, range),
      this.countQuotations(context, prevRange),
      this.countCustomerOrders(context, range),
      this.countCustomerOrders(context, prevRange),
      this.countPurchaseDocuments(context, range),
      this.countPurchaseDocuments(context, prevRange),
      this.getTopClients(context),
      this.extendedService.getTopSuppliersPublic(
        context.cabinetId,
        context.currencyId,
        range,
        query.topLimit ?? 5,
      ),
      this.getTopArticles(context),
      this.getQuotationConversionStats(context, range),
    ]);

    const summary: DashboardReferentialsSummaryDto = {
      clients: this.kpi(clients),
      suppliers: this.kpi(suppliers),
      articles: this.kpi(articles),
      quotations: this.kpi(quotations, prevQuotations),
      customerOrders: this.kpi(customerOrders, prevCustomerOrders),
      purchaseDocuments: this.kpi(purchaseDocuments, prevPurchaseDocuments),
    };

    return {
      summary,
      topClientsByRevenue: topClients,
      topSuppliersByPurchases: topSuppliers,
      topArticlesByRevenue: topArticles,
      quotationStats: quotationConversion,
      meta: this.buildMetaDto(context.cabinetId, displayCurrency, range),
    };
  }

  /** GET /dashboard/activity — recent activity + alerts */
  async getActivity(
    query: DashboardQueryDto,
    userId?: string,
  ): Promise<DashboardActivityDto> {
    const { context, displayCurrency, range } = await this.resolveContext(
      query,
      userId,
    );

    const [recentActivity, alerts] = await Promise.all([
      this.getRecentActivity(context),
      this.getAlerts(context),
    ]);

    return {
      recentActivity,
      alerts,
      meta: this.buildMetaDto(context.cabinetId, displayCurrency, range),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE — shared context setup & meta builder
  // ═══════════════════════════════════════════════════════════════════════════

  private async resolveContext(
    query: DashboardQueryDto,
    userId?: string,
  ): Promise<{
    context: DashboardContext;
    displayCurrency: CurrencyEntity | undefined;
    range: DashboardDateRange;
  }> {
    const cabinetId =
      await this.tenantContextService.getCurrentCabinetIdOrFail(userId);
    const cabinet = await this.cabinetService.findOneById(cabinetId);
    const displayCurrency = await this.resolveCurrency(
      query.currencyId,
      cabinet.currencyId,
      cabinet.currency,
    );
    const currencyId = query.currencyId ? displayCurrency?.id : undefined;
    const range = this.resolveDateRange(query);
    const context: DashboardContext = { cabinetId, currencyId, query, range };
    return { context, displayCurrency, range };
  }

  private buildMetaDto(
    cabinetId: number,
    displayCurrency: CurrencyEntity | undefined,
    range: DashboardDateRange,
  ): DashboardOverviewMetaDto {
    return {
      cabinetId,
      currency: {
        id: displayCurrency?.id,
        code: displayCurrency?.code,
        symbol: displayCurrency?.symbol,
        digitAfterComma: displayCurrency?.digitAfterComma,
      },
      period: {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        previousStartDate: range.previousStartDate.toISOString(),
        previousEndDate: range.previousEndDate.toISOString(),
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /** Wrapper to call extendedService buying payment sum using DashboardContext */
  private async sumBuyingPaymentsFromExtended(
    context: DashboardContext,
    range: Pick<DashboardDateRange, 'startDate' | 'endDate'>,
  ): Promise<number> {
    // The extended service's getBuyingAggregatesForGlobal returns all buying aggregates,
    // but for a single sum we use a direct query through extended service
    const aggregates = await this.extendedService.getBuyingAggregatesForGlobal(
      context.cabinetId,
      context.currencyId,
      {
        ...context.range,
        startDate: range.startDate,
        endDate: range.endDate,
      } as any,
    );
    return aggregates.paidToSuppliers;
  }

  /** Quotation stats for referentials tab */
  private async getQuotationConversionStats(
    context: DashboardContext,
    range: Pick<DashboardDateRange, 'startDate' | 'endDate'>,
  ): Promise<DashboardQuotationStatsDto> {
    if (
      !this.includesDocumentType(
        context.query,
        DASHBOARD_DOCUMENT_TYPE.QUOTATION,
      )
    ) {
      return { total: 0, invoiced: 0, conversionRate: 0 };
    }

    const [totalRow, convertedRow] = await Promise.all([
      this.applyQuotationFilters(
        this.quotationRepository
          .createQueryBuilder('quotation')
          .select('COUNT(quotation.id)', 'count')
          .andWhere('quotation.activityType = :sellingActivity', {
            sellingActivity: ACTIVITY_TYPE.SELLING,
          })
          .andWhere('quotation.status != :archivedStatus', {
            archivedStatus: QUOTATION_STATUS.Archived,
          }),
        context,
        range,
      ).getRawOne<{ count: string }>(),
      this.applyQuotationFilters(
        this.quotationRepository
          .createQueryBuilder('quotation')
          .select('COUNT(quotation.id)', 'count')
          .andWhere('quotation.activityType = :sellingActivity', {
            sellingActivity: ACTIVITY_TYPE.SELLING,
          })
          .andWhere('quotation.status = :invoicedStatus', {
            invoicedStatus: QUOTATION_STATUS.Invoiced,
          }),
        context,
        range,
      ).getRawOne<{ count: string }>(),
    ]);

    const total = this.toNumber(totalRow?.count);
    const invoiced = this.toNumber(convertedRow?.count);
    const conversionRate =
      total > 0 ? this.round((invoiced / total) * 100, 1) : 0;
    return { total, invoiced, conversionRate };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE — existing helper methods
  // ═══════════════════════════════════════════════════════════════════════════

  private async getSummary(
    context: DashboardContext,
  ): Promise<DashboardSummaryDto> {
    const currentMonthRange = this.resolveCurrentMonthRange();
    const previousMonthRange = {
      startDate: startOfMonth(subMonths(new Date(), 1)),
      endDate: endOfDay(subDays(startOfMonth(new Date()), 1)),
    };

    const [
      revenue,
      previousRevenue,
      currentMonthRevenue,
      previousMonthRevenue,
      invoiceStatus,
      previousInvoiceStatus,
      collectedAmount,
      previousCollectedAmount,
      remainingAmount,
      previousRemainingAmount,
      overduePayments,
      previousOverduePayments,
      avgDaysToPayment,
      previousAvgDaysToPayment,
      quotationConversion,
      previousQuotationConversion,
      clients,
      suppliers,
      articles,
      quotations,
      previousQuotations,
      customerOrders,
      previousCustomerOrders,
      purchaseDocuments,
      previousPurchaseDocuments,
    ] = await Promise.all([
      this.sumInvoiceTotal(context, context.range),
      this.sumInvoiceTotal(context, {
        startDate: context.range.previousStartDate,
        endDate: context.range.previousEndDate,
      }),
      this.sumInvoiceTotal(context, currentMonthRange),
      this.sumInvoiceTotal(context, previousMonthRange),
      this.getInvoiceStatusCounts(context, context.range),
      this.getInvoiceStatusCounts(context, {
        startDate: context.range.previousStartDate,
        endDate: context.range.previousEndDate,
      }),
      this.sumCollectedPayments(context, context.range),
      this.sumCollectedPayments(context, {
        startDate: context.range.previousStartDate,
        endDate: context.range.previousEndDate,
      }),
      this.sumRemainingInvoices(context, context.range),
      this.sumRemainingInvoices(context, {
        startDate: context.range.previousStartDate,
        endDate: context.range.previousEndDate,
      }),
      this.countOverduePayments(context, new Date()),
      this.countOverduePayments(context, subDays(new Date(), 30)),
      this.getAvgDaysToPayment(context, context.range),
      this.getAvgDaysToPayment(context, {
        startDate: context.range.previousStartDate,
        endDate: context.range.previousEndDate,
      }),
      this.getQuotationConversionRate(context, context.range),
      this.getQuotationConversionRate(context, {
        startDate: context.range.previousStartDate,
        endDate: context.range.previousEndDate,
      }),
      this.countFirms(context, FIRM_ENTITY_TYPE.CLIENTS),
      this.countFirms(context, FIRM_ENTITY_TYPE.SUPPLIERS),
      this.countArticles(context),
      this.countQuotations(context, context.range),
      this.countQuotations(context, {
        startDate: context.range.previousStartDate,
        endDate: context.range.previousEndDate,
      }),
      this.countCustomerOrders(context, context.range),
      this.countCustomerOrders(context, {
        startDate: context.range.previousStartDate,
        endDate: context.range.previousEndDate,
      }),
      this.countPurchaseDocuments(context, context.range),
      this.countPurchaseDocuments(context, {
        startDate: context.range.previousStartDate,
        endDate: context.range.previousEndDate,
      }),
    ]);

    // Collection rate = collected / revenue * 100
    const collectionRateValue =
      revenue > 0 ? this.round((collectedAmount / revenue) * 100, 1) : 0;
    const previousCollectionRateValue =
      previousRevenue > 0
        ? this.round((previousCollectedAmount / previousRevenue) * 100, 1)
        : 0;

    return {
      totalRevenue: this.kpi(revenue, previousRevenue),
      currentMonthRevenue: this.kpi(currentMonthRevenue, previousMonthRevenue),
      totalInvoices: this.kpi(
        invoiceStatus.total.count,
        previousInvoiceStatus.total.count,
      ),
      paidInvoices: this.kpi(
        invoiceStatus.paid.count,
        previousInvoiceStatus.paid.count,
      ),
      unpaidInvoices: this.kpi(
        invoiceStatus.unpaid.count,
        previousInvoiceStatus.unpaid.count,
        false,
      ),
      partiallyPaidInvoices: this.kpi(
        invoiceStatus.partiallyPaid.count,
        previousInvoiceStatus.partiallyPaid.count,
        false,
      ),
      collectedAmount: this.kpi(collectedAmount, previousCollectedAmount),
      remainingAmount: this.kpi(
        remainingAmount,
        previousRemainingAmount,
        false,
      ),
      overduePayments: this.kpi(
        overduePayments,
        previousOverduePayments,
        false,
      ),
      collectionRate: this.kpi(
        collectionRateValue,
        previousCollectionRateValue,
      ),
      avgDaysToPayment: this.kpi(
        avgDaysToPayment,
        previousAvgDaysToPayment,
        false,
      ),
      quotationConversionRate: this.kpi(
        quotationConversion,
        previousQuotationConversion,
      ),
      clients: this.kpi(clients),
      suppliers: this.kpi(suppliers),
      articles: this.kpi(articles),
      quotations: this.kpi(quotations, previousQuotations),
      customerOrders: this.kpi(customerOrders, previousCustomerOrders),
      purchaseDocuments: this.kpi(purchaseDocuments, previousPurchaseDocuments),
    };
  }

  private async getRevenueChart(
    context: DashboardContext,
  ): Promise<DashboardTimeSeriesPointDto[]> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.INVOICE)
    ) {
      return [];
    }

    const rows = await this.applyInvoiceFilters(
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .select("DATE_FORMAT(invoice.date, '%Y-%m')", 'period')
        .addSelect('COALESCE(SUM(invoice.total), 0)', 'value')
        .andWhere('invoice.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        })
        .andWhere('invoice.status NOT IN (:...excludedStatuses)', {
          excludedStatuses: FINANCIAL_INVOICE_EXCLUDED_STATUSES,
        }),
      context,
      'invoice',
      context.range,
      'selling',
    )
      .groupBy("DATE_FORMAT(invoice.date, '%Y-%m')")
      .orderBy('period', 'ASC')
      .getRawMany<{ period: string; value: string }>();

    const byPeriod = new Map(
      rows.map((row) => [row.period, this.toNumber(row.value)]),
    );

    return this.monthsInRange(
      context.range.startDate,
      context.range.endDate,
    ).map((month) => ({
      period: month,
      label: this.formatMonthLabel(month),
      value: byPeriod.get(month) ?? 0,
    }));
  }

  private async getInvoiceStatusChart(
    context: DashboardContext,
  ): Promise<DashboardStatusPointDto[]> {
    const status = await this.getInvoiceStatusCounts(context, context.range);

    return [
      {
        status: 'paid',
        label: 'invoice.status.paid',
        value: status.paid.count,
        amount: status.paid.amount,
      },
      {
        status: 'unpaid',
        label: 'invoice.status.unpaid',
        value: status.unpaid.count,
        amount: status.unpaid.amount,
      },
      {
        status: 'partiallyPaid',
        label: 'invoice.status.partially_paid',
        value: status.partiallyPaid.count,
        amount: status.partiallyPaid.amount,
      },
    ];
  }

  private async getPaymentMethodsChart(
    context: DashboardContext,
  ): Promise<DashboardPaymentMethodPointDto[]> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.PAYMENT)
    ) {
      return [];
    }

    const rows = await this.applyPaymentFilters(
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('payment.mode', 'method')
        .addSelect('COUNT(payment.id)', 'value')
        .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
        .andWhere('payment.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        }),
      context,
      'payment',
      context.range,
      'selling',
    )
      .groupBy('payment.mode')
      .orderBy('amount', 'DESC')
      .getRawMany<{ method: string; value: string; amount: string }>();

    return rows.map((row) => ({
      method: row.method ?? 'unknown',
      label: row.method ?? 'unknown',
      value: this.toNumber(row.value),
      amount: this.toNumber(row.amount),
    }));
  }

  private async getPaymentEvolutionChart(
    context: DashboardContext,
  ): Promise<DashboardTimeSeriesPointDto[]> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.PAYMENT)
    ) {
      return [];
    }

    const rows = await this.applyPaymentFilters(
      this.paymentRepository
        .createQueryBuilder('payment')
        .select("DATE_FORMAT(payment.date, '%Y-%m')", 'period')
        .addSelect('COALESCE(SUM(payment.amount), 0)', 'value')
        .andWhere('payment.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        }),
      context,
      'payment',
      context.range,
      'selling',
    )
      .andWhere(this.collectedPaymentWhere('payment'))
      .groupBy("DATE_FORMAT(payment.date, '%Y-%m')")
      .orderBy('period', 'ASC')
      .getRawMany<{ period: string; value: string }>();

    const byPeriod = new Map(
      rows.map((row) => [row.period, this.toNumber(row.value)]),
    );

    return this.monthsInRange(
      context.range.startDate,
      context.range.endDate,
    ).map((month) => ({
      period: month,
      label: this.formatMonthLabel(month),
      value: byPeriod.get(month) ?? 0,
    }));
  }

  private async getTopClients(
    context: DashboardContext,
  ): Promise<DashboardTopClientDto[]> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.INVOICE)
    ) {
      return [];
    }

    const rows = await this.applyInvoiceFilters(
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .innerJoin('invoice.firm', 'firm')
        .select('firm.id', 'clientId')
        .addSelect('firm.name', 'clientName')
        .addSelect('COUNT(invoice.id)', 'invoiceCount')
        .addSelect('COALESCE(SUM(invoice.total), 0)', 'revenue')
        .addSelect(
          'COALESCE(SUM(GREATEST(COALESCE(invoice.total, 0) - COALESCE(invoice.amountPaid, 0) - COALESCE(invoice.amountSettled, 0), 0)), 0)',
          'remainingAmount',
        )
        .andWhere('invoice.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        })
        .andWhere('invoice.status NOT IN (:...excludedStatuses)', {
          excludedStatuses: FINANCIAL_INVOICE_EXCLUDED_STATUSES,
        }),
      context,
      'invoice',
      context.range,
      'selling',
    )
      .groupBy('firm.id')
      .addGroupBy('firm.name')
      .orderBy('revenue', 'DESC')
      .limit(context.query.topLimit ?? 5)
      .getRawMany<{
        clientId: string;
        clientName: string;
        invoiceCount: string;
        revenue: string;
        remainingAmount: string;
      }>();

    return rows.map((row) => ({
      clientId: this.toNumber(row.clientId),
      clientName: row.clientName,
      revenue: this.toNumber(row.revenue),
      invoiceCount: this.toNumber(row.invoiceCount),
      remainingAmount: this.toNumber(row.remainingAmount),
    }));
  }

  private async getRevenueVsCollectionsChart(
    context: DashboardContext,
  ): Promise<DashboardMultiSeriesPointDto[]> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.INVOICE)
    ) {
      return [];
    }

    const [revenueRows, collectionRows] = await Promise.all([
      this.applyInvoiceFilters(
        this.invoiceRepository
          .createQueryBuilder('invoice')
          .select("DATE_FORMAT(invoice.date, '%Y-%m')", 'period')
          .addSelect('COALESCE(SUM(invoice.total), 0)', 'value')
          .andWhere('invoice.activityType = :sellingActivity', {
            sellingActivity: ACTIVITY_TYPE.SELLING,
          })
          .andWhere('invoice.status NOT IN (:...excludedStatuses)', {
            excludedStatuses: FINANCIAL_INVOICE_EXCLUDED_STATUSES,
          }),
        context,
        'invoice',
        context.range,
        'selling',
      )
        .groupBy("DATE_FORMAT(invoice.date, '%Y-%m')")
        .orderBy('period', 'ASC')
        .getRawMany<{ period: string; value: string }>(),
      this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.PAYMENT)
        ? this.applyPaymentFilters(
            this.paymentRepository
              .createQueryBuilder('payment')
              .select("DATE_FORMAT(payment.date, '%Y-%m')", 'period')
              .addSelect('COALESCE(SUM(payment.amount), 0)', 'value')
              .andWhere('payment.activityType = :sellingActivity', {
                sellingActivity: ACTIVITY_TYPE.SELLING,
              })
              .andWhere(this.collectedPaymentWhere('payment')),
            context,
            'payment',
            context.range,
            'selling',
          )
            .groupBy("DATE_FORMAT(payment.date, '%Y-%m')")
            .orderBy('period', 'ASC')
            .getRawMany<{ period: string; value: string }>()
        : Promise.resolve([]),
    ]);

    const revenueByPeriod = new Map(
      revenueRows.map((r) => [r.period, this.toNumber(r.value)]),
    );
    const collectionByPeriod = new Map(
      collectionRows.map((r) => [r.period, this.toNumber(r.value)]),
    );

    return this.monthsInRange(
      context.range.startDate,
      context.range.endDate,
    ).map((month) => ({
      period: month,
      label: this.formatMonthLabel(month),
      revenue: revenueByPeriod.get(month) ?? 0,
      collected: collectionByPeriod.get(month) ?? 0,
    }));
  }

  private async getReceivablesAgingChart(
    context: DashboardContext,
  ): Promise<DashboardReceivablesAgingDto[]> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.INVOICE)
    ) {
      return [];
    }

    const today = startOfDay(new Date());
    const todaySql = this.toSqlDate(today);

    const agingCase = `
      CASE
        WHEN invoice.dueDate >= '${todaySql}' THEN 'current'
        WHEN DATEDIFF('${todaySql}', invoice.dueDate) BETWEEN 1 AND 30 THEN '1-30'
        WHEN DATEDIFF('${todaySql}', invoice.dueDate) BETWEEN 31 AND 60 THEN '31-60'
        WHEN DATEDIFF('${todaySql}', invoice.dueDate) BETWEEN 61 AND 90 THEN '61-90'
        ELSE '90+'
      END
    `;

    const rows = await this.applyInvoiceFilters(
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .select(agingCase, 'bucket')
        .addSelect('COUNT(invoice.id)', 'count')
        .addSelect(
          'COALESCE(SUM(GREATEST(COALESCE(invoice.total, 0) - COALESCE(invoice.amountPaid, 0) - COALESCE(invoice.amountSettled, 0), 0)), 0)',
          'amount',
        )
        .andWhere('invoice.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        })
        .andWhere('invoice.status IN (:...openStatuses)', {
          openStatuses: OPEN_INVOICE_STATUSES,
        }),
      context,
      'invoice',
      undefined,
      'selling',
    )
      .groupBy(agingCase)
      .getRawMany<{ bucket: string; count: string; amount: string }>();

    const bucketOrder = ['current', '1-30', '31-60', '61-90', '90+'];
    const bucketLabels: Record<string, string> = {
      current: 'À jour',
      '1-30': '1-30 jours',
      '31-60': '31-60 jours',
      '61-90': '61-90 jours',
      '90+': '90+ jours',
    };

    const byBucket = new Map(rows.map((r) => [r.bucket, r]));
    return bucketOrder.map((bucket) => {
      const row = byBucket.get(bucket);
      return {
        bucket,
        label: bucketLabels[bucket] ?? bucket,
        count: this.toNumber(row?.count),
        amount: this.toNumber(row?.amount),
      };
    });
  }

  private async getTopArticles(
    context: DashboardContext,
  ): Promise<DashboardTopArticleDto[]> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.INVOICE)
    ) {
      return [];
    }

    const rows = await this.articleInvoiceEntryRepository
      .createQueryBuilder('entry')
      .innerJoin('entry.invoice', 'invoice')
      .innerJoin('entry.article', 'article')
      .select('article.id', 'articleId')
      .addSelect('article.title', 'articleName')
      .addSelect('COALESCE(SUM(entry.total), 0)', 'revenue')
      .addSelect('COALESCE(SUM(entry.quantity), 0)', 'quantitySold')
      .addSelect('COUNT(DISTINCT invoice.id)', 'invoiceCount')
      .where('invoice.cabinetId = :cabinetId', {
        cabinetId: context.cabinetId,
      })
      .andWhere('invoice.activityType = :sellingActivity', {
        sellingActivity: ACTIVITY_TYPE.SELLING,
      })
      .andWhere('invoice.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: FINANCIAL_INVOICE_EXCLUDED_STATUSES,
      })
      .andWhere('invoice.date BETWEEN :startDate AND :endDate', {
        startDate: this.toSqlDate(context.range.startDate),
        endDate: this.toSqlDate(context.range.endDate),
      })
      .andWhere(
        context.currencyId ? 'invoice.currencyId = :currencyId' : '1 = 1',
        { currencyId: context.currencyId },
      )
      .groupBy('article.id')
      .addGroupBy('article.title')
      .orderBy('revenue', 'DESC')
      .limit(context.query.topLimit ?? 5)
      .getRawMany<{
        articleId: string;
        articleName: string;
        revenue: string;
        quantitySold: string;
        invoiceCount: string;
      }>();

    return rows.map((row) => ({
      articleId: this.toNumber(row.articleId),
      articleName: row.articleName ?? 'Article',
      revenue: this.toNumber(row.revenue),
      quantitySold: this.toNumber(row.quantitySold),
      invoiceCount: this.toNumber(row.invoiceCount),
    }));
  }

  private async getAvgDaysToPayment(
    context: DashboardContext,
    range: Pick<DashboardDateRange, 'startDate' | 'endDate'>,
  ): Promise<number> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.INVOICE)
    ) {
      return 0;
    }

    const row = await this.applyInvoiceFilters(
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .select('AVG(DATEDIFF(invoice.updatedAt, invoice.date))', 'avgDays')
        .andWhere('invoice.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        })
        .andWhere('invoice.status IN (:...paidStatuses)', {
          paidStatuses: PAID_INVOICE_STATUSES,
        }),
      context,
      'invoice',
      range,
      'selling',
    ).getRawOne<{ avgDays: string }>();

    return Math.round(this.toNumber(row?.avgDays));
  }

  private async getQuotationConversionRate(
    context: DashboardContext,
    range: Pick<DashboardDateRange, 'startDate' | 'endDate'>,
  ): Promise<number> {
    if (
      !this.includesDocumentType(
        context.query,
        DASHBOARD_DOCUMENT_TYPE.QUOTATION,
      )
    ) {
      return 0;
    }

    const [totalRow, convertedRow] = await Promise.all([
      this.applyQuotationFilters(
        this.quotationRepository
          .createQueryBuilder('quotation')
          .select('COUNT(quotation.id)', 'count')
          .andWhere('quotation.activityType = :sellingActivity', {
            sellingActivity: ACTIVITY_TYPE.SELLING,
          })
          .andWhere('quotation.status != :archivedStatus', {
            archivedStatus: QUOTATION_STATUS.Archived,
          }),
        context,
        range,
      ).getRawOne<{ count: string }>(),
      this.applyQuotationFilters(
        this.quotationRepository
          .createQueryBuilder('quotation')
          .select('COUNT(quotation.id)', 'count')
          .andWhere('quotation.activityType = :sellingActivity', {
            sellingActivity: ACTIVITY_TYPE.SELLING,
          })
          .andWhere('quotation.status = :invoicedStatus', {
            invoicedStatus: QUOTATION_STATUS.Invoiced,
          }),
        context,
        range,
      ).getRawOne<{ count: string }>(),
    ]);

    const total = this.toNumber(totalRow?.count);
    const converted = this.toNumber(convertedRow?.count);
    return total > 0 ? this.round((converted / total) * 100, 1) : 0;
  }

  private async getRecentActivity(
    context: DashboardContext,
  ): Promise<DashboardRecentActivityDto[]> {
    const [invoices, quotations, payments, customerOrders] = await Promise.all([
      this.getRecentInvoices(context),
      this.getRecentQuotations(context),
      this.getRecentPayments(context),
      this.getRecentCustomerOrders(context),
    ]);

    return [...invoices, ...quotations, ...payments, ...customerOrders]
      .sort(
        (a, b) =>
          new Date(b.createdAt ?? b.date ?? 0).getTime() -
          new Date(a.createdAt ?? a.date ?? 0).getTime(),
      )
      .slice(0, 12)
      .map((activity) => ({
        id: activity.id,
        type: activity.type,
        label: activity.label,
        reference: activity.reference,
        partnerName: activity.partnerName,
        amount: activity.amount,
        date: this.toIsoString(activity.date),
        status: activity.status,
        route: this.buildActivityRoute(activity),
      }));
  }

  private async getAlerts(
    context: DashboardContext,
  ): Promise<DashboardAlertDto[]> {
    const [overdueInvoices, paymentFollowUps, recentDrafts, highReceivables] =
      await Promise.all([
        this.getOverdueInvoiceAlerts(context),
        this.getPaymentFollowUpAlerts(context),
        this.getRecentDraftAlerts(context),
        this.getHighReceivableAlerts(context),
      ]);

    return [
      ...overdueInvoices,
      ...paymentFollowUps,
      ...recentDrafts,
      ...highReceivables,
    ].slice(0, 12);
  }

  private async sumInvoiceTotal(
    context: DashboardContext,
    range: Pick<DashboardDateRange, 'startDate' | 'endDate'>,
  ): Promise<number> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.INVOICE)
    ) {
      return 0;
    }

    const row = await this.applyInvoiceFilters(
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .select('COALESCE(SUM(invoice.total), 0)', 'total')
        .andWhere('invoice.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        })
        .andWhere('invoice.status NOT IN (:...excludedStatuses)', {
          excludedStatuses: FINANCIAL_INVOICE_EXCLUDED_STATUSES,
        }),
      context,
      'invoice',
      range,
      'selling',
    ).getRawOne<{ total: string }>();

    return this.toNumber(row?.total);
  }

  private async sumRemainingInvoices(
    context: DashboardContext,
    range: Pick<DashboardDateRange, 'startDate' | 'endDate'>,
  ): Promise<number> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.INVOICE)
    ) {
      return 0;
    }

    const row = await this.applyInvoiceFilters(
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .select(
          'COALESCE(SUM(GREATEST(COALESCE(invoice.total, 0) - COALESCE(invoice.amountPaid, 0) - COALESCE(invoice.amountSettled, 0), 0)), 0)',
          'total',
        )
        .andWhere('invoice.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        })
        .andWhere('invoice.status NOT IN (:...excludedStatuses)', {
          excludedStatuses: FINANCIAL_INVOICE_EXCLUDED_STATUSES,
        }),
      context,
      'invoice',
      range,
      'selling',
    ).getRawOne<{ total: string }>();

    return this.toNumber(row?.total);
  }

  private async getInvoiceStatusCounts(
    context: DashboardContext,
    range: Pick<DashboardDateRange, 'startDate' | 'endDate'>,
  ): Promise<{
    total: CountAmount;
    paid: CountAmount;
    unpaid: CountAmount;
    partiallyPaid: CountAmount;
  }> {
    const empty = {
      total: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      unpaid: { count: 0, amount: 0 },
      partiallyPaid: { count: 0, amount: 0 },
    };

    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.INVOICE)
    ) {
      return empty;
    }

    const statusCase = `
      CASE
        WHEN invoice.status IN (:...paidStatuses) THEN 'paid'
        WHEN invoice.status IN (:...partialStatuses) THEN 'partiallyPaid'
        ELSE 'unpaid'
      END
    `;

    const rows = await this.applyInvoiceFilters(
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .select(statusCase, 'status')
        .addSelect('COUNT(invoice.id)', 'count')
        .addSelect('COALESCE(SUM(invoice.total), 0)', 'amount')
        .andWhere('invoice.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        })
        .andWhere('invoice.status NOT IN (:...excludedStatuses)', {
          excludedStatuses: FINANCIAL_INVOICE_EXCLUDED_STATUSES,
        })
        .setParameters({
          paidStatuses: PAID_INVOICE_STATUSES,
          partialStatuses: PARTIAL_INVOICE_STATUSES,
        }),
      context,
      'invoice',
      range,
      'selling',
    )
      .groupBy(statusCase)
      .getRawMany<{
        status: 'paid' | 'partiallyPaid' | 'unpaid';
        count: string;
        amount: string;
      }>();

    return rows.reduce((acc, row) => {
      const entry = {
        count: this.toNumber(row.count),
        amount: this.toNumber(row.amount),
      };
      acc[row.status] = entry;
      acc.total.count += entry.count;
      acc.total.amount += entry.amount;
      return acc;
    }, empty);
  }

  private async sumCollectedPayments(
    context: DashboardContext,
    range: Pick<DashboardDateRange, 'startDate' | 'endDate'>,
  ): Promise<number> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.PAYMENT)
    ) {
      return 0;
    }

    const row = await this.applyPaymentFilters(
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'total')
        .andWhere('payment.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        })
        .andWhere(this.collectedPaymentWhere('payment'))
        .andWhere('payment.mode != :creditNoteSettlementMode', {
          creditNoteSettlementMode: PAYMENT_MODE.CreditNoteSettlement,
        }),
      context,
      'payment',
      range,
      'selling',
    ).getRawOne<{ total: string }>();

    return this.toNumber(row?.total);
  }

  private async countOverduePayments(
    context: DashboardContext,
    referenceDate: Date,
  ): Promise<number> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.PAYMENT)
    ) {
      return 0;
    }

    const row = await this.applyPaymentFilters(
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('COUNT(payment.id)', 'count')
        .andWhere('payment.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        })
        .andWhere('payment.mode IN (:...negotiableModes)', {
          negotiableModes: NEGOTIABLE_PAYMENT_MODES,
        })
        .andWhere(
          '(payment.collectionStatus IS NULL OR payment.collectionStatus IN (:...pendingStatuses))',
          {
            pendingStatuses: [
              PAYMENT_COLLECTION_STATUS.PENDING,
              PAYMENT_COLLECTION_STATUS.DEPOSITED,
            ],
          },
        )
        .andWhere('payment.dueDate < :referenceDate', {
          referenceDate: this.toSqlDate(startOfDay(referenceDate)),
        }),
      context,
      'payment',
      undefined,
      'selling',
    ).getRawOne<{ count: string }>();

    return this.toNumber(row?.count);
  }

  private async countFirms(
    context: DashboardContext,
    entityType: FIRM_ENTITY_TYPE,
  ): Promise<number> {
    if (
      entityType === FIRM_ENTITY_TYPE.CLIENTS &&
      context.query.supplierId &&
      !context.query.clientId
    ) {
      return 0;
    }
    if (
      entityType === FIRM_ENTITY_TYPE.SUPPLIERS &&
      context.query.clientId &&
      !context.query.supplierId
    ) {
      return 0;
    }

    const row = await this.firmRepository
      .createQueryBuilder('firm')
      .select('COUNT(firm.id)', 'count')
      .where('firm.cabinetId = :cabinetId', { cabinetId: context.cabinetId })
      .andWhere('firm.entityType = :entityType', { entityType })
      .andWhere(
        entityType === FIRM_ENTITY_TYPE.CLIENTS && context.query.clientId
          ? 'firm.id = :clientId'
          : '1 = 1',
        { clientId: context.query.clientId },
      )
      .andWhere(
        entityType === FIRM_ENTITY_TYPE.SUPPLIERS && context.query.supplierId
          ? 'firm.id = :supplierId'
          : '1 = 1',
        { supplierId: context.query.supplierId },
      )
      .andWhere(
        context.currencyId ? 'firm.currencyId = :currencyId' : '1 = 1',
        { currencyId: context.currencyId },
      )
      .getRawOne<{ count: string }>();

    return this.toNumber(row?.count);
  }

  private async countArticles(context: DashboardContext): Promise<number> {
    const row = await this.articleRepository
      .createQueryBuilder('article')
      .select('COUNT(article.id)', 'count')
      .where('article.cabinetId = :cabinetId', { cabinetId: context.cabinetId })
      .getRawOne<{ count: string }>();

    return this.toNumber(row?.count);
  }

  private async countQuotations(
    context: DashboardContext,
    range: Pick<DashboardDateRange, 'startDate' | 'endDate'>,
  ): Promise<number> {
    if (
      !this.includesDocumentType(
        context.query,
        DASHBOARD_DOCUMENT_TYPE.QUOTATION,
      )
    ) {
      return 0;
    }

    const row = await this.applyQuotationFilters(
      this.quotationRepository
        .createQueryBuilder('quotation')
        .select('COUNT(quotation.id)', 'count')
        .andWhere('quotation.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        })
        .andWhere('quotation.status != :archivedStatus', {
          archivedStatus: QUOTATION_STATUS.Archived,
        }),
      context,
      range,
    ).getRawOne<{ count: string }>();

    return this.toNumber(row?.count);
  }

  private async countCustomerOrders(
    context: DashboardContext,
    range: Pick<DashboardDateRange, 'startDate' | 'endDate'>,
  ): Promise<number> {
    if (
      !this.includesDocumentType(
        context.query,
        DASHBOARD_DOCUMENT_TYPE.CUSTOMER_ORDER,
      )
    ) {
      return 0;
    }

    const row = await this.applyCustomerOrderFilters(
      this.customerOrderRepository
        .createQueryBuilder('customerOrder')
        .select('COUNT(customerOrder.id)', 'count')
        .andWhere('customerOrder.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        })
        .andWhere('customerOrder.status != :cancelledStatus', {
          cancelledStatus: CUSTOMER_ORDER_STATUS.Cancelled,
        }),
      context,
      range,
    ).getRawOne<{ count: string }>();

    return this.toNumber(row?.count);
  }

  private async countPurchaseDocuments(
    context: DashboardContext,
    range: Pick<DashboardDateRange, 'startDate' | 'endDate'>,
  ): Promise<number> {
    if (
      !this.includesDocumentType(
        context.query,
        DASHBOARD_DOCUMENT_TYPE.PURCHASE,
      )
    ) {
      return 0;
    }

    const row = await this.applyInvoiceFilters(
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .select('COUNT(invoice.id)', 'count')
        .andWhere('invoice.activityType = :buyingActivity', {
          buyingActivity: ACTIVITY_TYPE.BUYING,
        })
        .andWhere('invoice.status NOT IN (:...excludedStatuses)', {
          excludedStatuses: FINANCIAL_INVOICE_EXCLUDED_STATUSES,
        }),
      context,
      'invoice',
      range,
      'buying',
    ).getRawOne<{ count: string }>();

    return this.toNumber(row?.count);
  }

  private async getRecentInvoices(
    context: DashboardContext,
  ): Promise<RecentActivityRaw[]> {
    if (
      !this.includesDocumentType(
        context.query,
        DASHBOARD_DOCUMENT_TYPE.INVOICE,
      ) &&
      !this.includesDocumentType(
        context.query,
        DASHBOARD_DOCUMENT_TYPE.PURCHASE,
      )
    ) {
      return [];
    }

    const selectedDocumentType =
      context.query.documentType ?? DASHBOARD_DOCUMENT_TYPE.ALL;
    const activityScope =
      selectedDocumentType === DASHBOARD_DOCUMENT_TYPE.PURCHASE ||
      (!context.query.clientId && context.query.supplierId)
        ? 'buying'
        : selectedDocumentType === DASHBOARD_DOCUMENT_TYPE.INVOICE ||
            context.query.clientId
          ? 'selling'
          : undefined;

    const qb = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoin('invoice.firm', 'firm')
      .select('invoice.id', 'id')
      .addSelect("'invoice'", 'type')
      .addSelect('invoice.sequential', 'label')
      .addSelect('invoice.reference', 'reference')
      .addSelect('firm.name', 'partnerName')
      .addSelect('COALESCE(invoice.total, 0)', 'amount')
      .addSelect('invoice.date', 'date')
      .addSelect('invoice.status', 'status')
      .addSelect('invoice.activityType', 'activityType')
      .addSelect('invoice.createdAt', 'createdAt')
      .orderBy('invoice.createdAt', 'DESC')
      .limit(12);

    if (activityScope) {
      qb.andWhere('invoice.activityType = :activityType', {
        activityType:
          activityScope === 'buying'
            ? ACTIVITY_TYPE.BUYING
            : ACTIVITY_TYPE.SELLING,
      });
    }

    this.applyInvoiceFilters(
      qb,
      context,
      'invoice',
      context.range,
      activityScope,
    );

    return qb.getRawMany<RecentActivityRaw>();
  }

  private async getRecentQuotations(
    context: DashboardContext,
  ): Promise<RecentActivityRaw[]> {
    if (
      !this.includesDocumentType(
        context.query,
        DASHBOARD_DOCUMENT_TYPE.QUOTATION,
      )
    ) {
      return [];
    }

    return this.applyQuotationFilters(
      this.quotationRepository
        .createQueryBuilder('quotation')
        .leftJoin('quotation.firm', 'firm')
        .select('quotation.id', 'id')
        .addSelect("'quotation'", 'type')
        .addSelect('quotation.sequential', 'label')
        .addSelect('NULL', 'reference')
        .addSelect('firm.name', 'partnerName')
        .addSelect('COALESCE(quotation.total, 0)', 'amount')
        .addSelect('quotation.date', 'date')
        .addSelect('quotation.status', 'status')
        .addSelect('quotation.activityType', 'activityType')
        .addSelect('quotation.createdAt', 'createdAt')
        .orderBy('quotation.createdAt', 'DESC')
        .limit(12),
      context,
      context.range,
    ).getRawMany<RecentActivityRaw>();
  }

  private async getRecentPayments(
    context: DashboardContext,
  ): Promise<RecentActivityRaw[]> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.PAYMENT)
    ) {
      return [];
    }

    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.firm', 'firm')
      .select('payment.id', 'id')
      .addSelect("'payment'", 'type')
      .addSelect('payment.reference', 'label')
      .addSelect('payment.reference', 'reference')
      .addSelect('firm.name', 'partnerName')
      .addSelect('COALESCE(payment.amount, 0)', 'amount')
      .addSelect('payment.date', 'date')
      .addSelect('payment.collectionStatus', 'status')
      .addSelect('payment.activityType', 'activityType')
      .addSelect('payment.createdAt', 'createdAt')
      .orderBy('payment.createdAt', 'DESC')
      .limit(12);

    this.applyPaymentFilters(qb, context, 'payment', context.range);

    return qb.getRawMany<RecentActivityRaw>();
  }

  private async getRecentCustomerOrders(
    context: DashboardContext,
  ): Promise<RecentActivityRaw[]> {
    if (
      !this.includesDocumentType(
        context.query,
        DASHBOARD_DOCUMENT_TYPE.CUSTOMER_ORDER,
      )
    ) {
      return [];
    }

    return this.applyCustomerOrderFilters(
      this.customerOrderRepository
        .createQueryBuilder('customerOrder')
        .leftJoin('customerOrder.firm', 'firm')
        .select('customerOrder.id', 'id')
        .addSelect("'customerOrder'", 'type')
        .addSelect('customerOrder.sequential', 'label')
        .addSelect('NULL', 'reference')
        .addSelect('firm.name', 'partnerName')
        .addSelect('COALESCE(customerOrder.total, 0)', 'amount')
        .addSelect('customerOrder.date', 'date')
        .addSelect('customerOrder.status', 'status')
        .addSelect('customerOrder.activityType', 'activityType')
        .addSelect('customerOrder.createdAt', 'createdAt')
        .orderBy('customerOrder.createdAt', 'DESC')
        .limit(12),
      context,
      context.range,
    ).getRawMany<RecentActivityRaw>();
  }

  private async getOverdueInvoiceAlerts(
    context: DashboardContext,
  ): Promise<DashboardAlertDto[]> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.INVOICE)
    ) {
      return [];
    }

    const rows = await this.applyInvoiceFilters(
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoin('invoice.firm', 'firm')
        .select('invoice.id', 'id')
        .addSelect('invoice.sequential', 'entityLabel')
        .addSelect('firm.name', 'partnerName')
        .addSelect(
          'GREATEST(COALESCE(invoice.total, 0) - COALESCE(invoice.amountPaid, 0) - COALESCE(invoice.amountSettled, 0), 0)',
          'amount',
        )
        .addSelect('invoice.dueDate', 'date')
        .andWhere('invoice.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        })
        .andWhere('invoice.status IN (:...openStatuses)', {
          openStatuses: OPEN_INVOICE_STATUSES,
        })
        .andWhere('invoice.dueDate < :today', {
          today: this.toSqlDate(startOfDay(new Date())),
        }),
      context,
      'invoice',
      undefined,
      'selling',
    )
      .orderBy('invoice.dueDate', 'ASC')
      .limit(4)
      .getRawMany<{
        id: string;
        entityLabel: string;
        partnerName: string;
        amount: string;
        date: Date;
      }>();

    return rows.map((row) => ({
      id: `overdue-invoice-${row.id}`,
      type: 'overdueInvoice',
      severity: 'danger',
      entityLabel: row.entityLabel,
      partnerName: row.partnerName,
      amount: this.toNumber(row.amount),
      date: this.toIsoString(row.date),
      route: `/selling/invoice/${row.id}`,
    }));
  }

  private async getPaymentFollowUpAlerts(
    context: DashboardContext,
  ): Promise<DashboardAlertDto[]> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.PAYMENT)
    ) {
      return [];
    }

    const rows = await this.applyPaymentFilters(
      this.paymentRepository
        .createQueryBuilder('payment')
        .leftJoin('payment.firm', 'firm')
        .select('payment.id', 'id')
        .addSelect('payment.reference', 'entityLabel')
        .addSelect('firm.name', 'partnerName')
        .addSelect('COALESCE(payment.amount, 0)', 'amount')
        .addSelect('payment.dueDate', 'date')
        .andWhere('payment.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        })
        .andWhere('payment.mode IN (:...negotiableModes)', {
          negotiableModes: NEGOTIABLE_PAYMENT_MODES,
        })
        .andWhere(
          '(payment.collectionStatus IS NULL OR payment.collectionStatus IN (:...pendingStatuses))',
          {
            pendingStatuses: [
              PAYMENT_COLLECTION_STATUS.PENDING,
              PAYMENT_COLLECTION_STATUS.DEPOSITED,
            ],
          },
        )
        .andWhere('payment.dueDate < :today', {
          today: this.toSqlDate(startOfDay(new Date())),
        }),
      context,
      'payment',
      undefined,
      'selling',
    )
      .orderBy('payment.dueDate', 'ASC')
      .limit(4)
      .getRawMany<{
        id: string;
        entityLabel: string;
        partnerName: string;
        amount: string;
        date: Date;
      }>();

    return rows.map((row) => ({
      id: `payment-follow-up-${row.id}`,
      type: 'paymentFollowUp',
      severity: 'warning',
      entityLabel: row.entityLabel,
      partnerName: row.partnerName,
      amount: this.toNumber(row.amount),
      date: this.toIsoString(row.date),
      route: `/selling/payment/${row.id}`,
    }));
  }

  private async getRecentDraftAlerts(
    context: DashboardContext,
  ): Promise<DashboardAlertDto[]> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.INVOICE)
    ) {
      return [];
    }

    const since = subDays(new Date(), 30);
    const rows = await this.applyInvoiceFilters(
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoin('invoice.firm', 'firm')
        .select('invoice.id', 'id')
        .addSelect('invoice.sequential', 'entityLabel')
        .addSelect('firm.name', 'partnerName')
        .addSelect('COALESCE(invoice.total, 0)', 'amount')
        .addSelect('invoice.createdAt', 'date')
        .andWhere('invoice.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        })
        .andWhere('invoice.status = :draftStatus', {
          draftStatus: INVOICE_STATUS.Draft,
        })
        .andWhere('invoice.createdAt >= :since', {
          since: this.toSqlDate(since),
        }),
      context,
      'invoice',
      undefined,
      'selling',
    )
      .orderBy('invoice.createdAt', 'DESC')
      .limit(2)
      .getRawMany<{
        id: string;
        entityLabel: string;
        partnerName: string;
        amount: string;
        date: Date;
      }>();

    return rows.map((row) => ({
      id: `recent-draft-${row.id}`,
      type: 'recentDraft',
      severity: 'info',
      entityLabel: row.entityLabel,
      partnerName: row.partnerName,
      amount: this.toNumber(row.amount),
      date: this.toIsoString(row.date),
      route: `/selling/invoice/${row.id}`,
    }));
  }

  private async getHighReceivableAlerts(
    context: DashboardContext,
  ): Promise<DashboardAlertDto[]> {
    if (
      !this.includesDocumentType(context.query, DASHBOARD_DOCUMENT_TYPE.INVOICE)
    ) {
      return [];
    }

    const rows = await this.applyInvoiceFilters(
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .innerJoin('invoice.firm', 'firm')
        .select('firm.id', 'clientId')
        .addSelect('firm.name', 'partnerName')
        .addSelect(
          'COALESCE(SUM(GREATEST(COALESCE(invoice.total, 0) - COALESCE(invoice.amountPaid, 0) - COALESCE(invoice.amountSettled, 0), 0)), 0)',
          'amount',
        )
        .andWhere('invoice.activityType = :sellingActivity', {
          sellingActivity: ACTIVITY_TYPE.SELLING,
        })
        .andWhere('invoice.status IN (:...openStatuses)', {
          openStatuses: OPEN_INVOICE_STATUSES,
        }),
      context,
      'invoice',
      context.range,
      'selling',
    )
      .groupBy('firm.id')
      .addGroupBy('firm.name')
      .having('amount > 0')
      .orderBy('amount', 'DESC')
      .limit(2)
      .getRawMany<{ clientId: string; partnerName: string; amount: string }>();

    return rows.map((row) => ({
      id: `high-receivable-client-${row.clientId}`,
      type: 'highReceivableClient',
      severity: 'warning',
      partnerName: row.partnerName,
      amount: this.toNumber(row.amount),
      route: `/clients/${row.clientId}`,
    }));
  }

  private applyInvoiceFilters(
    qb: SelectQueryBuilder<InvoiceEntity>,
    context: DashboardContext,
    alias: string,
    range?: Pick<DashboardDateRange, 'startDate' | 'endDate'>,
    partnerScope?: 'selling' | 'buying',
  ): SelectQueryBuilder<InvoiceEntity> {
    qb.andWhere(`${alias}.cabinetId = :cabinetId`, {
      cabinetId: context.cabinetId,
    });

    if (context.currencyId) {
      qb.andWhere(`${alias}.currencyId = :currencyId`, {
        currencyId: context.currencyId,
      });
    }

    if (range) {
      qb.andWhere(`${alias}.date BETWEEN :startDate AND :endDate`, {
        startDate: this.toSqlDate(range.startDate),
        endDate: this.toSqlDate(range.endDate),
      });
    }

    this.applyPartnerFilter(qb, alias, context.query, partnerScope);
    return qb;
  }

  private applyPaymentFilters(
    qb: SelectQueryBuilder<PaymentEntity>,
    context: DashboardContext,
    alias: string,
    range?: Pick<DashboardDateRange, 'startDate' | 'endDate'>,
    partnerScope?: 'selling' | 'buying',
  ): SelectQueryBuilder<PaymentEntity> {
    qb.andWhere(`${alias}.cabinetId = :cabinetId`, {
      cabinetId: context.cabinetId,
    });

    if (context.currencyId) {
      qb.andWhere(`${alias}.currencyId = :currencyId`, {
        currencyId: context.currencyId,
      });
    }

    if (range) {
      qb.andWhere(`${alias}.date BETWEEN :startDate AND :endDate`, {
        startDate: this.toSqlDate(range.startDate),
        endDate: this.toSqlDate(range.endDate),
      });
    }

    this.applyPartnerFilter(qb, alias, context.query, partnerScope);
    return qb;
  }

  private applyQuotationFilters(
    qb: SelectQueryBuilder<QuotationEntity>,
    context: DashboardContext,
    range?: Pick<DashboardDateRange, 'startDate' | 'endDate'>,
  ): SelectQueryBuilder<QuotationEntity> {
    qb.andWhere('quotation.cabinetId = :cabinetId', {
      cabinetId: context.cabinetId,
    });

    if (context.currencyId) {
      qb.andWhere('quotation.currencyId = :currencyId', {
        currencyId: context.currencyId,
      });
    }

    if (range) {
      qb.andWhere('quotation.date BETWEEN :startDate AND :endDate', {
        startDate: this.toSqlDate(range.startDate),
        endDate: this.toSqlDate(range.endDate),
      });
    }

    this.applyPartnerFilter(qb, 'quotation', context.query, 'selling');
    return qb;
  }

  private applyCustomerOrderFilters(
    qb: SelectQueryBuilder<CustomerOrderEntity>,
    context: DashboardContext,
    range?: Pick<DashboardDateRange, 'startDate' | 'endDate'>,
  ): SelectQueryBuilder<CustomerOrderEntity> {
    qb.andWhere('customerOrder.cabinetId = :cabinetId', {
      cabinetId: context.cabinetId,
    });

    if (context.currencyId) {
      qb.andWhere('customerOrder.currencyId = :currencyId', {
        currencyId: context.currencyId,
      });
    }

    if (range) {
      qb.andWhere('customerOrder.date BETWEEN :startDate AND :endDate', {
        startDate: this.toSqlDate(range.startDate),
        endDate: this.toSqlDate(range.endDate),
      });
    }

    this.applyPartnerFilter(qb, 'customerOrder', context.query, 'selling');
    return qb;
  }

  private applyPartnerFilter(
    qb: SelectQueryBuilder<any>,
    alias: string,
    query: DashboardQueryDto,
    scope?: 'selling' | 'buying',
  ) {
    if (scope === 'selling') {
      if (query.clientId) {
        qb.andWhere(`${alias}.firmId = :clientId`, {
          clientId: query.clientId,
        });
      }
      if (query.supplierId) {
        qb.andWhere('1 = 0');
      }
      return;
    }

    if (scope === 'buying') {
      if (query.supplierId) {
        qb.andWhere(`${alias}.firmId = :supplierId`, {
          supplierId: query.supplierId,
        });
      }
      if (query.clientId) {
        qb.andWhere('1 = 0');
      }
      return;
    }

    if (query.clientId) {
      qb.andWhere(`${alias}.firmId = :clientId`, {
        clientId: query.clientId,
      });
    }
    if (query.supplierId) {
      qb.andWhere(`${alias}.firmId = :supplierId`, {
        supplierId: query.supplierId,
      });
    }
  }

  private collectedPaymentWhere(alias: string): string {
    return `(
      ${alias}.collectionStatus = '${PAYMENT_COLLECTION_STATUS.PAID}'
      OR (
        ${alias}.collectionStatus IS NULL
        AND (${alias}.mode IS NULL OR ${alias}.mode NOT IN ('${PAYMENT_MODE.Check}', '${PAYMENT_MODE.BillOfExchange}'))
      )
    )`;
  }

  private resolveDateRange(
    query: DashboardQueryDto,
    now: Date = new Date(),
  ): DashboardDateRange {
    const current = endOfDay(now);
    let startDate: Date;
    let endDate: Date;

    switch (query.period ?? DASHBOARD_PERIOD.CURRENT_YEAR) {
      case DASHBOARD_PERIOD.TODAY:
        startDate = startOfDay(now);
        endDate = current;
        break;
      case DASHBOARD_PERIOD.LAST_7_DAYS:
        startDate = startOfDay(subDays(now, 6));
        endDate = current;
        break;
      case DASHBOARD_PERIOD.LAST_30_DAYS:
        startDate = startOfDay(subDays(now, 29));
        endDate = current;
        break;
      case DASHBOARD_PERIOD.CURRENT_MONTH:
        startDate = startOfMonth(now);
        endDate = current;
        break;
      case DASHBOARD_PERIOD.CUSTOM:
        startDate = startOfDay(new Date(query.startDate));
        endDate = endOfDay(new Date(query.endDate));
        if (
          Number.isNaN(startDate.getTime()) ||
          Number.isNaN(endDate.getTime()) ||
          startDate > endDate
        ) {
          throw new BadRequestException('Invalid dashboard date range');
        }
        break;
      case DASHBOARD_PERIOD.CURRENT_YEAR:
      default:
        startDate = startOfDay(new Date(now.getFullYear(), 0, 1));
        endDate = current;
        break;
    }

    const days = differenceInCalendarDays(endDate, startDate) + 1;
    const previousEndDate = endOfDay(subDays(startDate, 1));
    const previousStartDate = startOfDay(subDays(previousEndDate, days - 1));

    return { startDate, endDate, previousStartDate, previousEndDate };
  }

  private resolveCurrentMonthRange(): Pick<
    DashboardDateRange,
    'startDate' | 'endDate'
  > {
    const now = new Date();
    return {
      startDate: startOfMonth(now),
      endDate: endOfDay(now),
    };
  }

  private async resolveCurrency(
    requestedCurrencyId?: number,
    cabinetCurrencyId?: number,
    cabinetCurrency?: CurrencyEntity,
  ): Promise<CurrencyEntity | undefined> {
    const currencyId = requestedCurrencyId ?? cabinetCurrencyId;
    if (!currencyId) {
      return undefined;
    }

    if (cabinetCurrency?.id === currencyId) {
      return cabinetCurrency;
    }

    return this.currencyService.findOneById(currencyId);
  }

  private includesDocumentType(
    query: DashboardQueryDto,
    documentType: DASHBOARD_DOCUMENT_TYPE,
  ): boolean {
    const selected = query.documentType ?? DASHBOARD_DOCUMENT_TYPE.ALL;
    return (
      selected === DASHBOARD_DOCUMENT_TYPE.ALL || selected === documentType
    );
  }

  private kpi(
    value: number,
    previousValue?: number,
    positiveWhenIncreasing = true,
  ): DashboardKpiDto {
    const normalizedValue = this.round(value);
    const normalizedPrevious =
      typeof previousValue === 'number' ? this.round(previousValue) : undefined;

    if (typeof normalizedPrevious !== 'number') {
      return { value: normalizedValue, trend: 'neutral' };
    }

    let changePercent: number | null = null;
    if (normalizedPrevious === 0) {
      changePercent = normalizedValue === 0 ? 0 : 100;
    } else {
      changePercent = this.round(
        ((normalizedValue - normalizedPrevious) /
          Math.abs(normalizedPrevious)) *
          100,
        2,
      );
    }

    const delta = normalizedValue - normalizedPrevious;
    let trend: DashboardTrend = 'neutral';
    if (delta !== 0) {
      trend =
        (delta > 0 && positiveWhenIncreasing) ||
        (delta < 0 && !positiveWhenIncreasing)
          ? 'positive'
          : 'negative';
    }

    return {
      value: normalizedValue,
      previousValue: normalizedPrevious,
      changePercent,
      trend,
    };
  }

  private monthsInRange(startDate: Date, endDate: Date): string[] {
    const months: string[] = [];
    let cursor = startOfMonth(startDate);
    const last = startOfMonth(endDate);

    while (cursor <= last) {
      months.push(format(cursor, 'yyyy-MM'));
      cursor = addMonths(cursor, 1);
    }

    return months;
  }

  private formatMonthLabel(period: string): string {
    const [year, month] = period.split('-').map(Number);
    return format(new Date(year, month - 1, 1), 'MMM yyyy');
  }

  private buildActivityRoute(activity: RecentActivityRaw): string | null {
    if (activity.type === 'invoice') {
      return activity.activityType === ACTIVITY_TYPE.BUYING
        ? `/buying/facture-achat/${activity.id}`
        : `/selling/invoice/${activity.id}`;
    }
    if (activity.type === 'quotation') {
      return `/selling/quotation/${activity.id}`;
    }
    if (activity.type === 'payment') {
      return activity.activityType === ACTIVITY_TYPE.BUYING
        ? `/buying/payment/${activity.id}`
        : `/selling/payment/${activity.id}`;
    }
    if (activity.type === 'customerOrder') {
      return `/selling/customer-order/${activity.id}`;
    }
    return null;
  }

  private toSqlDate(value: Date): string {
    return format(value, 'yyyy-MM-dd HH:mm:ss');
  }

  private toIsoString(value?: Date | string | null): string | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private toNumber(value?: string | number | null): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private round(value: number, digits = 3): number {
    return Number(this.toNumber(value).toFixed(digits));
  }

  private async buildDebugInfo(
    context: DashboardContext,
    summary: DashboardSummaryDto,
  ): Promise<DashboardDebugDto> {
    const countQuery = async (
      repo: Repository<any>,
      alias: string,
    ): Promise<number> => {
      const row = await repo
        .createQueryBuilder(alias)
        .select(`COUNT(${alias}.id)`, 'count')
        .where(`${alias}.cabinetId = :cabinetId`, {
          cabinetId: context.cabinetId,
        })
        .getRawOne<{ count: string }>();
      return this.toNumber(row?.count);
    };

    // Filtered count: apply currency + date + status filters (same as actual queries)
    const filteredInvoiceCount = async (): Promise<number> => {
      const qb = this.invoiceRepository
        .createQueryBuilder('inv')
        .select('COUNT(inv.id)', 'count')
        .where('inv.cabinetId = :cabinetId', { cabinetId: context.cabinetId });
      if (context.currencyId) {
        qb.andWhere('inv.currencyId = :currencyId', {
          currencyId: context.currencyId,
        });
      }
      qb.andWhere('inv.date BETWEEN :startDate AND :endDate', {
        startDate: this.toSqlDate(context.range.startDate),
        endDate: this.toSqlDate(context.range.endDate),
      });
      qb.andWhere('inv.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: FINANCIAL_INVOICE_EXCLUDED_STATUSES,
      });
      const row = await qb.getRawOne<{ count: string }>();
      return this.toNumber(row?.count);
    };

    // Count invoices matching only cabinet + currency (no date/status filter)
    const currencyMatchCount = async (): Promise<number> => {
      const qb = this.invoiceRepository
        .createQueryBuilder('inv')
        .select('COUNT(inv.id)', 'count')
        .where('inv.cabinetId = :cabinetId', { cabinetId: context.cabinetId });
      if (context.currencyId) {
        qb.andWhere('inv.currencyId = :currencyId', {
          currencyId: context.currencyId,
        });
      }
      const row = await qb.getRawOne<{ count: string }>();
      return this.toNumber(row?.count);
    };

    const [
      invoices,
      payments,
      clients,
      suppliers,
      articles,
      quotations,
      customerOrders,
      filteredInvoices,
      currencyMatched,
    ] = await Promise.all([
      countQuery(this.invoiceRepository, 'invoice'),
      countQuery(this.paymentRepository, 'payment'),
      this.toNumber(summary.clients.value),
      this.toNumber(summary.suppliers.value),
      this.toNumber(summary.articles.value),
      countQuery(this.quotationRepository, 'quotation'),
      countQuery(this.customerOrderRepository, 'customerOrder'),
      filteredInvoiceCount(),
      currencyMatchCount(),
    ]);

    this.logger.debug(
      `Debug breakdown: totalInvoices=${invoices} matchCurrency(${context.currencyId})=${currencyMatched} ` +
        `matchAllFilters(currency+date+status)=${filteredInvoices}`,
    );

    return {
      appliedFilters: {
        period: context.query.period,
        documentType: context.query.documentType,
        clientId: context.query.clientId ?? null,
        supplierId: context.query.supplierId ?? null,
        currencyId: context.currencyId ?? null,
      },
      counts: {
        invoices,
        payments,
        clients,
        suppliers,
        articles,
        quotations,
        customerOrders,
      },
      periodRange: {
        startDate: context.range.startDate.toISOString(),
        endDate: context.range.endDate.toISOString(),
      },
    };
  }
}
