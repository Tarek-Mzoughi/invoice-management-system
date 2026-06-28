/**
 * Extended Dashboard Service — Purchases, Treasury, Withholding Tax analytics.
 * Follows the same patterns as the main DashboardService.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  endOfDay,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
  addMonths,
} from 'date-fns';
import { Repository } from 'typeorm';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { BankAccountEntity } from 'src/modules/bank-account/entities/bank-account.entity';
import { CabinetService } from 'src/modules/cabinet/services/cabinet.service';
import { CurrencyService } from 'src/modules/currency/services/currency.service';
import { FirmEntity } from 'src/modules/firm/entities/firm.entity';
import { InvoiceEntity } from 'src/modules/invoice/entities/invoice.entity';
import { INVOICE_STATUS } from 'src/modules/invoice/enums/invoice-status.enum';
import { PaymentEntity } from 'src/modules/payment/entities/payment.entity';
import { PAYMENT_COLLECTION_STATUS } from 'src/modules/payment/enums/payment-collection-status.enum';
import { TreasuryMovementEntity } from 'src/modules/treasury-movement/entities/treasury-movement.entity';
import { TREASURY_MOVEMENT_DIRECTION } from 'src/modules/treasury-movement/enums/treasury-movement-direction.enum';
import { TaxWithholdingEntity } from 'src/modules/tax-withholding/entities/tax-withholding.entity';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { DASHBOARD_PERIOD, DashboardQueryDto } from './dto/dashboard-query.dto';
import {
  DashboardBankBalanceDto,
  DashboardCashFlowPointDto,
  DashboardKpiDto,
  DashboardOverviewMetaDto,
  DashboardPaymentMethodPointDto,
  DashboardPurchasesDto,
  DashboardPurchasesSummaryDto,
  DashboardReceivablesAgingDto,
  DashboardStatusPointDto,
  DashboardTimeSeriesPointDto,
  DashboardTopSupplierDto,
  DashboardTreasuryDto,
  DashboardTreasurySummaryDto,
  DashboardTrend,
  DashboardMultiSeriesPointDto,
  DashboardWithholdingDto,
  DashboardWithholdingEntryDto,
  DashboardWithholdingSummaryDto,
} from './dto/dashboard-response.dto';

interface DateRange {
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
  previousEndDate: Date;
}

const FINANCIAL_EXCLUDED = [
  INVOICE_STATUS.Draft,
  INVOICE_STATUS.Nonexistent,
  INVOICE_STATUS.Archived,
];
const PAID_STATUSES = [INVOICE_STATUS.Paid, INVOICE_STATUS.Settled];
const PARTIAL_STATUSES = [
  INVOICE_STATUS.PartiallyPaid,
  INVOICE_STATUS.PartiallySettled,
];
const UNPAID_STATUSES = [
  INVOICE_STATUS.Unpaid,
  INVOICE_STATUS.Validated,
  INVOICE_STATUS.Sent,
  INVOICE_STATUS.Expired,
];
const OPEN_STATUSES = [...UNPAID_STATUSES, ...PARTIAL_STATUSES];

@Injectable()
export class DashboardExtendedService {
  private readonly logger = new Logger(DashboardExtendedService.name);

  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(FirmEntity)
    private readonly firmRepo: Repository<FirmEntity>,
    @InjectRepository(TreasuryMovementEntity)
    private readonly treasuryRepo: Repository<TreasuryMovementEntity>,
    @InjectRepository(BankAccountEntity)
    private readonly bankAccountRepo: Repository<BankAccountEntity>,
    @InjectRepository(TaxWithholdingEntity)
    private readonly taxWithholdingRepo: Repository<TaxWithholdingEntity>,
    private readonly tenantContextService: TenantContextService,
    private readonly cabinetService: CabinetService,
    private readonly currencyService: CurrencyService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // PURCHASES ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  async getPurchases(
    query: DashboardQueryDto,
    userId?: string,
  ): Promise<DashboardPurchasesDto> {
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

    const [
      summary,
      purchasesChart,
      purchasesVsPaymentsChart,
      buyingInvoiceStatusChart,
      payablesAgingChart,
      topSuppliers,
      buyingPaymentMethodsChart,
    ] = await Promise.all([
      this.getPurchasesSummary(cabinetId, currencyId, range),
      this.getPurchasesChart(cabinetId, currencyId, range),
      this.getPurchasesVsPaymentsChart(cabinetId, currencyId, range),
      this.getBuyingInvoiceStatusChart(cabinetId, currencyId, range),
      this.getPayablesAgingChart(cabinetId, currencyId),
      this.getTopSuppliers(cabinetId, currencyId, range, query.topLimit ?? 5),
      this.getBuyingPaymentMethodsChart(cabinetId, currencyId, range),
    ]);

    return {
      summary,
      purchasesChart,
      purchasesVsPaymentsChart,
      buyingInvoiceStatusChart,
      payablesAgingChart,
      topSuppliers,
      buyingPaymentMethodsChart,
      meta: this.buildMeta(cabinetId, displayCurrency, range),
    };
  }

  private async getPurchasesSummary(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardPurchasesSummaryDto> {
    const currentMonth = {
      startDate: startOfMonth(new Date()),
      endDate: endOfDay(new Date()),
    };
    const previousMonth = {
      startDate: startOfMonth(subMonths(new Date(), 1)),
      endDate: endOfDay(subDays(startOfMonth(new Date()), 1)),
    };

    const [
      totalPurchases,
      prevTotalPurchases,
      currentMonthPurch,
      prevMonthPurch,
      totalBuying,
      prevTotalBuying,
      paidBuying,
      prevPaidBuying,
      unpaidBuying,
      prevUnpaidBuying,
      paidToSuppliers,
      prevPaidToSuppliers,
      remainingPayables,
      prevRemainingPayables,
      overdueCount,
      prevOverdueCount,
    ] = await Promise.all([
      this.sumBuyingInvoices(cabinetId, currencyId, range),
      this.sumBuyingInvoices(cabinetId, currencyId, {
        startDate: range.previousStartDate,
        endDate: range.previousEndDate,
      }),
      this.sumBuyingInvoices(cabinetId, currencyId, currentMonth),
      this.sumBuyingInvoices(cabinetId, currencyId, previousMonth),
      this.countBuyingInvoices(cabinetId, currencyId, range, null),
      this.countBuyingInvoices(
        cabinetId,
        currencyId,
        { startDate: range.previousStartDate, endDate: range.previousEndDate },
        null,
      ),
      this.countBuyingInvoices(cabinetId, currencyId, range, PAID_STATUSES),
      this.countBuyingInvoices(
        cabinetId,
        currencyId,
        { startDate: range.previousStartDate, endDate: range.previousEndDate },
        PAID_STATUSES,
      ),
      this.countBuyingInvoices(cabinetId, currencyId, range, UNPAID_STATUSES),
      this.countBuyingInvoices(
        cabinetId,
        currencyId,
        { startDate: range.previousStartDate, endDate: range.previousEndDate },
        UNPAID_STATUSES,
      ),
      this.sumBuyingPayments(cabinetId, currencyId, range),
      this.sumBuyingPayments(cabinetId, currencyId, {
        startDate: range.previousStartDate,
        endDate: range.previousEndDate,
      }),
      this.sumBuyingRemaining(cabinetId, currencyId, range),
      this.sumBuyingRemaining(cabinetId, currencyId, {
        startDate: range.previousStartDate,
        endDate: range.previousEndDate,
      }),
      this.countOverdueBuying(cabinetId, currencyId, new Date()),
      this.countOverdueBuying(cabinetId, currencyId, subDays(new Date(), 30)),
    ]);

    return {
      totalPurchases: this.kpi(totalPurchases, prevTotalPurchases),
      currentMonthPurchases: this.kpi(currentMonthPurch, prevMonthPurch),
      totalBuyingInvoices: this.kpi(totalBuying, prevTotalBuying),
      paidBuyingInvoices: this.kpi(paidBuying, prevPaidBuying),
      unpaidBuyingInvoices: this.kpi(unpaidBuying, prevUnpaidBuying, false),
      amountPaidToSuppliers: this.kpi(paidToSuppliers, prevPaidToSuppliers),
      remainingPayables: this.kpi(
        remainingPayables,
        prevRemainingPayables,
        false,
      ),
      payablesAgingOverdue: this.kpi(overdueCount, prevOverdueCount, false),
    };
  }

  private async sumBuyingInvoices(
    cabinetId: number,
    currencyId: number | undefined,
    range: Pick<DateRange, 'startDate' | 'endDate'>,
  ): Promise<number> {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.total), 0)', 'total')
      .where('inv.cabinetId = :cabinetId', { cabinetId })
      .andWhere('inv.activityType = :buying', { buying: ACTIVITY_TYPE.BUYING })
      .andWhere('inv.status NOT IN (:...excluded)', {
        excluded: FINANCIAL_EXCLUDED,
      })
      .andWhere('inv.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      });
    if (currencyId) qb.andWhere('inv.currencyId = :cid', { cid: currencyId });
    const row = await qb.getRawOne<{ total: string }>();
    return this.n(row?.total);
  }

  private async countBuyingInvoices(
    cabinetId: number,
    currencyId: number | undefined,
    range: Pick<DateRange, 'startDate' | 'endDate'>,
    statuses: INVOICE_STATUS[] | null,
  ): Promise<number> {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .select('COUNT(inv.id)', 'count')
      .where('inv.cabinetId = :cabinetId', { cabinetId })
      .andWhere('inv.activityType = :buying', { buying: ACTIVITY_TYPE.BUYING })
      .andWhere('inv.status NOT IN (:...excluded)', {
        excluded: FINANCIAL_EXCLUDED,
      })
      .andWhere('inv.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      });
    if (currencyId) qb.andWhere('inv.currencyId = :cid', { cid: currencyId });
    if (statuses) qb.andWhere('inv.status IN (:...statuses)', { statuses });
    const row = await qb.getRawOne<{ count: string }>();
    return this.n(row?.count);
  }

  private async sumBuyingPayments(
    cabinetId: number,
    currencyId: number | undefined,
    range: Pick<DateRange, 'startDate' | 'endDate'>,
  ): Promise<number> {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.cabinetId = :cabinetId', { cabinetId })
      .andWhere('p.activityType = :buying', { buying: ACTIVITY_TYPE.BUYING })
      .andWhere('p.collectionStatus != :rejected', {
        rejected: PAYMENT_COLLECTION_STATUS.REJECTED,
      })
      .andWhere('p.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      });
    if (currencyId) qb.andWhere('p.currencyId = :cid', { cid: currencyId });
    const row = await qb.getRawOne<{ total: string }>();
    return this.n(row?.total);
  }

  private async sumBuyingRemaining(
    cabinetId: number,
    currencyId: number | undefined,
    range: Pick<DateRange, 'startDate' | 'endDate'>,
  ): Promise<number> {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .select(
        'COALESCE(SUM(GREATEST(COALESCE(inv.total, 0) - COALESCE(inv.amountPaid, 0) - COALESCE(inv.amountSettled, 0), 0)), 0)',
        'total',
      )
      .where('inv.cabinetId = :cabinetId', { cabinetId })
      .andWhere('inv.activityType = :buying', { buying: ACTIVITY_TYPE.BUYING })
      .andWhere('inv.status IN (:...open)', { open: OPEN_STATUSES })
      .andWhere('inv.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      });
    if (currencyId) qb.andWhere('inv.currencyId = :cid', { cid: currencyId });
    const row = await qb.getRawOne<{ total: string }>();
    return this.n(row?.total);
  }

  private async countOverdueBuying(
    cabinetId: number,
    currencyId: number | undefined,
    asOfDate: Date,
  ): Promise<number> {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .select('COUNT(inv.id)', 'count')
      .where('inv.cabinetId = :cabinetId', { cabinetId })
      .andWhere('inv.activityType = :buying', { buying: ACTIVITY_TYPE.BUYING })
      .andWhere('inv.status IN (:...open)', { open: OPEN_STATUSES })
      .andWhere('inv.dueDate < :asOf', { asOf: this.toSqlDate(asOfDate) });
    if (currencyId) qb.andWhere('inv.currencyId = :cid', { cid: currencyId });
    const row = await qb.getRawOne<{ count: string }>();
    return this.n(row?.count);
  }

  private async getPurchasesChart(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardTimeSeriesPointDto[]> {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .select("DATE_FORMAT(inv.date, '%Y-%m')", 'period')
      .addSelect('COALESCE(SUM(inv.total), 0)', 'value')
      .where('inv.cabinetId = :cabinetId', { cabinetId })
      .andWhere('inv.activityType = :buying', { buying: ACTIVITY_TYPE.BUYING })
      .andWhere('inv.status NOT IN (:...excluded)', {
        excluded: FINANCIAL_EXCLUDED,
      })
      .andWhere('inv.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      })
      .groupBy("DATE_FORMAT(inv.date, '%Y-%m')")
      .orderBy('period', 'ASC');
    if (currencyId) qb.andWhere('inv.currencyId = :cid', { cid: currencyId });

    const rows = await qb.getRawMany<{ period: string; value: string }>();
    const byPeriod = new Map(rows.map((r) => [r.period, this.n(r.value)]));
    return this.monthsInRange(range.startDate, range.endDate).map((m) => ({
      period: m,
      label: this.fmtMonth(m),
      value: byPeriod.get(m) ?? 0,
    }));
  }

  private async getPurchasesVsPaymentsChart(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardMultiSeriesPointDto[]> {
    const purchasesQb = this.invoiceRepo
      .createQueryBuilder('inv')
      .select("DATE_FORMAT(inv.date, '%Y-%m')", 'period')
      .addSelect('COALESCE(SUM(inv.total), 0)', 'value')
      .where('inv.cabinetId = :cabinetId', { cabinetId })
      .andWhere('inv.activityType = :buying', { buying: ACTIVITY_TYPE.BUYING })
      .andWhere('inv.status NOT IN (:...excluded)', {
        excluded: FINANCIAL_EXCLUDED,
      })
      .andWhere('inv.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      })
      .groupBy("DATE_FORMAT(inv.date, '%Y-%m')")
      .orderBy('period', 'ASC');
    if (currencyId)
      purchasesQb.andWhere('inv.currencyId = :cid', { cid: currencyId });

    const paymentsQb = this.paymentRepo
      .createQueryBuilder('p')
      .select("DATE_FORMAT(p.date, '%Y-%m')", 'period')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'value')
      .where('p.cabinetId = :cabinetId', { cabinetId })
      .andWhere('p.activityType = :buying', { buying: ACTIVITY_TYPE.BUYING })
      .andWhere('p.collectionStatus != :rejected', {
        rejected: PAYMENT_COLLECTION_STATUS.REJECTED,
      })
      .andWhere('p.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      })
      .groupBy("DATE_FORMAT(p.date, '%Y-%m')")
      .orderBy('period', 'ASC');
    if (currencyId)
      paymentsQb.andWhere('p.currencyId = :cid', { cid: currencyId });

    const [purchRows, payRows] = await Promise.all([
      purchasesQb.getRawMany<{ period: string; value: string }>(),
      paymentsQb.getRawMany<{ period: string; value: string }>(),
    ]);

    const purchMap = new Map(purchRows.map((r) => [r.period, this.n(r.value)]));
    const payMap = new Map(payRows.map((r) => [r.period, this.n(r.value)]));

    return this.monthsInRange(range.startDate, range.endDate).map((m) => ({
      period: m,
      label: this.fmtMonth(m),
      revenue: purchMap.get(m) ?? 0,
      collected: payMap.get(m) ?? 0,
    }));
  }

  private async getBuyingInvoiceStatusChart(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardStatusPointDto[]> {
    const statusCase = `
      CASE
        WHEN inv.status IN (:...paidStatuses) THEN 'paid'
        WHEN inv.status IN (:...partialStatuses) THEN 'partiallyPaid'
        ELSE 'unpaid'
      END
    `;
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .select(statusCase, 'statusGroup')
      .addSelect('COUNT(inv.id)', 'count')
      .addSelect('COALESCE(SUM(inv.total), 0)', 'amount')
      .where('inv.cabinetId = :cabinetId', { cabinetId })
      .andWhere('inv.activityType = :buying', { buying: ACTIVITY_TYPE.BUYING })
      .andWhere('inv.status NOT IN (:...excluded)', {
        excluded: FINANCIAL_EXCLUDED,
      })
      .andWhere('inv.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      })
      .setParameters({
        paidStatuses: PAID_STATUSES,
        partialStatuses: PARTIAL_STATUSES,
      })
      .groupBy(statusCase);
    if (currencyId) qb.andWhere('inv.currencyId = :cid', { cid: currencyId });

    const rows = await qb.getRawMany<{
      statusGroup: string;
      count: string;
      amount: string;
    }>();
    const byStatus = new Map(rows.map((r) => [r.statusGroup, r]));

    return ['paid', 'unpaid', 'partiallyPaid'].map((s) => ({
      status: s,
      label: `invoice.status.${s === 'partiallyPaid' ? 'partially_paid' : s}`,
      value: this.n(byStatus.get(s)?.count),
      amount: this.n(byStatus.get(s)?.amount),
    }));
  }

  private async getPayablesAgingChart(
    cabinetId: number,
    currencyId: number | undefined,
  ): Promise<DashboardReceivablesAgingDto[]> {
    const today = this.toSqlDate(startOfDay(new Date()));
    const agingCase = `
      CASE
        WHEN inv.dueDate >= '${today}' THEN 'current'
        WHEN DATEDIFF('${today}', inv.dueDate) BETWEEN 1 AND 30 THEN '1-30'
        WHEN DATEDIFF('${today}', inv.dueDate) BETWEEN 31 AND 60 THEN '31-60'
        WHEN DATEDIFF('${today}', inv.dueDate) BETWEEN 61 AND 90 THEN '61-90'
        ELSE '90+'
      END
    `;
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .select(agingCase, 'bucket')
      .addSelect('COUNT(inv.id)', 'count')
      .addSelect(
        'COALESCE(SUM(GREATEST(COALESCE(inv.total,0) - COALESCE(inv.amountPaid,0) - COALESCE(inv.amountSettled,0), 0)), 0)',
        'amount',
      )
      .where('inv.cabinetId = :cabinetId', { cabinetId })
      .andWhere('inv.activityType = :buying', { buying: ACTIVITY_TYPE.BUYING })
      .andWhere('inv.status IN (:...open)', { open: OPEN_STATUSES })
      .groupBy(agingCase);
    if (currencyId) qb.andWhere('inv.currencyId = :cid', { cid: currencyId });

    const rows = await qb.getRawMany<{
      bucket: string;
      count: string;
      amount: string;
    }>();
    const byBucket = new Map(rows.map((r) => [r.bucket, r]));
    const buckets = ['current', '1-30', '31-60', '61-90', '90+'];
    const labels: Record<string, string> = {
      current: 'À jour',
      '1-30': '1-30 jours',
      '31-60': '31-60 jours',
      '61-90': '61-90 jours',
      '90+': '90+ jours',
    };

    return buckets.map((b) => ({
      bucket: b,
      label: labels[b] ?? b,
      count: this.n(byBucket.get(b)?.count),
      amount: this.n(byBucket.get(b)?.amount),
    }));
  }

  private async getTopSuppliers(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
    limit: number,
  ): Promise<DashboardTopSupplierDto[]> {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .innerJoin('inv.firm', 'firm')
      .select('firm.id', 'supplierId')
      .addSelect('firm.name', 'supplierName')
      .addSelect('COUNT(inv.id)', 'invoiceCount')
      .addSelect('COALESCE(SUM(inv.total), 0)', 'totalPurchases')
      .addSelect(
        'COALESCE(SUM(GREATEST(COALESCE(inv.total,0) - COALESCE(inv.amountPaid,0) - COALESCE(inv.amountSettled,0), 0)), 0)',
        'remainingAmount',
      )
      .where('inv.cabinetId = :cabinetId', { cabinetId })
      .andWhere('inv.activityType = :buying', { buying: ACTIVITY_TYPE.BUYING })
      .andWhere('inv.status NOT IN (:...excluded)', {
        excluded: FINANCIAL_EXCLUDED,
      })
      .andWhere('inv.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      })
      .groupBy('firm.id')
      .addGroupBy('firm.name')
      .orderBy('totalPurchases', 'DESC')
      .limit(limit);
    if (currencyId) qb.andWhere('inv.currencyId = :cid', { cid: currencyId });

    const rows = await qb.getRawMany<{
      supplierId: string;
      supplierName: string;
      invoiceCount: string;
      totalPurchases: string;
      remainingAmount: string;
    }>();
    return rows.map((r) => ({
      supplierId: this.n(r.supplierId),
      supplierName: r.supplierName,
      totalPurchases: this.n(r.totalPurchases),
      invoiceCount: this.n(r.invoiceCount),
      remainingAmount: this.n(r.remainingAmount),
    }));
  }

  private async getBuyingPaymentMethodsChart(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardPaymentMethodPointDto[]> {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .select('p.mode', 'method')
      .addSelect('COUNT(p.id)', 'value')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'amount')
      .where('p.cabinetId = :cabinetId', { cabinetId })
      .andWhere('p.activityType = :buying', { buying: ACTIVITY_TYPE.BUYING })
      .andWhere('p.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      })
      .groupBy('p.mode')
      .orderBy('amount', 'DESC');
    if (currencyId) qb.andWhere('p.currencyId = :cid', { cid: currencyId });

    const rows = await qb.getRawMany<{
      method: string;
      value: string;
      amount: string;
    }>();
    return rows.map((r) => ({
      method: r.method ?? 'unknown',
      label: r.method ?? 'unknown',
      value: this.n(r.value),
      amount: this.n(r.amount),
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TREASURY ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  async getTreasury(
    query: DashboardQueryDto,
    userId?: string,
  ): Promise<DashboardTreasuryDto> {
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

    const [
      summary,
      bankBalances,
      cashFlowChart,
      inflowsByCategory,
      outflowsByCategory,
    ] = await Promise.all([
      this.getTreasurySummary(cabinetId, currencyId, range),
      this.getBankBalances(cabinetId, currencyId, range),
      this.getCashFlowChart(cabinetId, currencyId, range),
      this.getMovementsByCategory(
        cabinetId,
        currencyId,
        range,
        TREASURY_MOVEMENT_DIRECTION.IN,
      ),
      this.getMovementsByCategory(
        cabinetId,
        currencyId,
        range,
        TREASURY_MOVEMENT_DIRECTION.OUT,
      ),
    ]);

    return {
      summary,
      bankBalances,
      cashFlowChart,
      inflowsByCategory,
      outflowsByCategory,
      meta: this.buildMeta(cabinetId, displayCurrency, range),
    };
  }

  private async getTreasurySummary(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardTreasurySummaryDto> {
    const [inflows, prevInflows, outflows, prevOutflows, count, prevCount] =
      await Promise.all([
        this.sumMovements(
          cabinetId,
          currencyId,
          range,
          TREASURY_MOVEMENT_DIRECTION.IN,
        ),
        this.sumMovements(
          cabinetId,
          currencyId,
          {
            startDate: range.previousStartDate,
            endDate: range.previousEndDate,
          },
          TREASURY_MOVEMENT_DIRECTION.IN,
        ),
        this.sumMovements(
          cabinetId,
          currencyId,
          range,
          TREASURY_MOVEMENT_DIRECTION.OUT,
        ),
        this.sumMovements(
          cabinetId,
          currencyId,
          {
            startDate: range.previousStartDate,
            endDate: range.previousEndDate,
          },
          TREASURY_MOVEMENT_DIRECTION.OUT,
        ),
        this.countMovements(cabinetId, currencyId, range),
        this.countMovements(cabinetId, currencyId, {
          startDate: range.previousStartDate,
          endDate: range.previousEndDate,
        }),
      ]);

    const net = inflows - outflows;
    const prevNet = prevInflows - prevOutflows;
    const totalBalance = inflows - outflows; // Simplified: total inflows - outflows in period

    return {
      totalBalance: this.kpi(totalBalance, prevNet),
      totalInflows: this.kpi(inflows, prevInflows),
      totalOutflows: this.kpi(outflows, prevOutflows, false),
      netCashFlow: this.kpi(net, prevNet),
      movementsCount: this.kpi(count, prevCount),
    };
  }

  private async sumMovements(
    cabinetId: number,
    currencyId: number | undefined,
    range: Pick<DateRange, 'startDate' | 'endDate'>,
    direction: TREASURY_MOVEMENT_DIRECTION,
  ): Promise<number> {
    const qb = this.treasuryRepo
      .createQueryBuilder('tm')
      .innerJoin('tm.account', 'ba')
      .select('COALESCE(SUM(tm.amount), 0)', 'total')
      .where('ba.cabinetId = :cabinetId', { cabinetId })
      .andWhere('tm.direction = :dir', { dir: direction })
      .andWhere('tm.movementDate BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      });
    if (currencyId) qb.andWhere('tm.currencyId = :cid', { cid: currencyId });
    const row = await qb.getRawOne<{ total: string }>();
    return this.n(row?.total);
  }

  private async countMovements(
    cabinetId: number,
    currencyId: number | undefined,
    range: Pick<DateRange, 'startDate' | 'endDate'>,
  ): Promise<number> {
    const qb = this.treasuryRepo
      .createQueryBuilder('tm')
      .innerJoin('tm.account', 'ba')
      .select('COUNT(tm.id)', 'count')
      .where('ba.cabinetId = :cabinetId', { cabinetId })
      .andWhere('tm.movementDate BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      });
    if (currencyId) qb.andWhere('tm.currencyId = :cid', { cid: currencyId });
    const row = await qb.getRawOne<{ count: string }>();
    return this.n(row?.count);
  }

  private async getBankBalances(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardBankBalanceDto[]> {
    const qb = this.treasuryRepo
      .createQueryBuilder('tm')
      .innerJoin('tm.account', 'ba')
      .select('ba.id', 'bankAccountId')
      .addSelect('ba.name', 'bankAccountName')
      .addSelect('ba.type', 'accountType')
      .addSelect(
        "COALESCE(SUM(CASE WHEN tm.direction = 'in' THEN tm.amount ELSE 0 END), 0)",
        'inflowsTotal',
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN tm.direction = 'out' THEN tm.amount ELSE 0 END), 0)",
        'outflowsTotal',
      )
      .where('ba.cabinetId = :cabinetId', { cabinetId })
      .andWhere('tm.movementDate BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      })
      .groupBy('ba.id')
      .addGroupBy('ba.name')
      .addGroupBy('ba.type')
      .orderBy('inflowsTotal', 'DESC');
    if (currencyId) qb.andWhere('tm.currencyId = :cid', { cid: currencyId });

    const rows = await qb.getRawMany<{
      bankAccountId: string;
      bankAccountName: string;
      accountType: string;
      inflowsTotal: string;
      outflowsTotal: string;
    }>();
    return rows.map((r) => ({
      bankAccountId: this.n(r.bankAccountId),
      bankAccountName: r.bankAccountName,
      accountType: r.accountType ?? 'bank',
      balance: this.n(r.inflowsTotal) - this.n(r.outflowsTotal),
      inflowsTotal: this.n(r.inflowsTotal),
      outflowsTotal: this.n(r.outflowsTotal),
    }));
  }

  private async getCashFlowChart(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardCashFlowPointDto[]> {
    const qb = this.treasuryRepo
      .createQueryBuilder('tm')
      .innerJoin('tm.account', 'ba')
      .select("DATE_FORMAT(tm.movementDate, '%Y-%m')", 'period')
      .addSelect(
        "COALESCE(SUM(CASE WHEN tm.direction = 'in' THEN tm.amount ELSE 0 END), 0)",
        'inflows',
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN tm.direction = 'out' THEN tm.amount ELSE 0 END), 0)",
        'outflows',
      )
      .where('ba.cabinetId = :cabinetId', { cabinetId })
      .andWhere('tm.movementDate BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      })
      .groupBy("DATE_FORMAT(tm.movementDate, '%Y-%m')")
      .orderBy('period', 'ASC');
    if (currencyId) qb.andWhere('tm.currencyId = :cid', { cid: currencyId });

    const rows = await qb.getRawMany<{
      period: string;
      inflows: string;
      outflows: string;
    }>();
    const byPeriod = new Map(
      rows.map((r) => [
        r.period,
        { inflows: this.n(r.inflows), outflows: this.n(r.outflows) },
      ]),
    );

    return this.monthsInRange(range.startDate, range.endDate).map((m) => {
      const data = byPeriod.get(m) ?? { inflows: 0, outflows: 0 };
      return {
        period: m,
        label: this.fmtMonth(m),
        inflows: data.inflows,
        outflows: data.outflows,
        net: data.inflows - data.outflows,
      };
    });
  }

  private async getMovementsByCategory(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
    direction: TREASURY_MOVEMENT_DIRECTION,
  ): Promise<DashboardPaymentMethodPointDto[]> {
    const qb = this.treasuryRepo
      .createQueryBuilder('tm')
      .innerJoin('tm.account', 'ba')
      .select('tm.kind', 'method')
      .addSelect('COUNT(tm.id)', 'value')
      .addSelect('COALESCE(SUM(tm.amount), 0)', 'amount')
      .where('ba.cabinetId = :cabinetId', { cabinetId })
      .andWhere('tm.direction = :dir', { dir: direction })
      .andWhere('tm.movementDate BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      })
      .groupBy('tm.kind')
      .orderBy('amount', 'DESC');
    if (currencyId) qb.andWhere('tm.currencyId = :cid', { cid: currencyId });

    const rows = await qb.getRawMany<{
      method: string;
      value: string;
      amount: string;
    }>();
    return rows.map((r) => ({
      method: r.method ?? 'unknown',
      label: r.method ?? 'unknown',
      value: this.n(r.value),
      amount: this.n(r.amount),
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WITHHOLDING TAX ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  async getWithholding(
    query: DashboardQueryDto,
    userId?: string,
  ): Promise<DashboardWithholdingDto> {
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

    const [summary, withholdingByTax, withholdingEvolution] = await Promise.all(
      [
        this.getWithholdingSummary(cabinetId, currencyId, range),
        this.getWithholdingByTax(cabinetId, currencyId, range),
        this.getWithholdingEvolution(cabinetId, currencyId, range),
      ],
    );

    return {
      summary,
      withholdingByTax,
      withholdingEvolution,
      meta: this.buildMeta(cabinetId, displayCurrency, range),
    };
  }

  private async getWithholdingSummary(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardWithholdingSummaryDto> {
    const [current, previous] = await Promise.all([
      this.sumWithholding(cabinetId, currencyId, range),
      this.sumWithholding(cabinetId, currencyId, {
        startDate: range.previousStartDate,
        endDate: range.previousEndDate,
      }),
    ]);

    return {
      totalWithheld: this.kpi(current.totalWithheld, previous.totalWithheld),
      totalBase: this.kpi(current.totalBase, previous.totalBase),
      averageRate: this.kpi(current.avgRate, previous.avgRate),
      entriesCount: this.kpi(current.count, previous.count),
    };
  }

  private async sumWithholding(
    cabinetId: number,
    currencyId: number | undefined,
    range: Pick<DateRange, 'startDate' | 'endDate'>,
  ): Promise<{
    totalWithheld: number;
    totalBase: number;
    avgRate: number;
    count: number;
  }> {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.taxWithholdingAmount), 0)', 'totalWithheld')
      .addSelect('COALESCE(SUM(inv.total), 0)', 'totalBase')
      .addSelect('COUNT(inv.id)', 'count')
      .where('inv.cabinetId = :cabinetId', { cabinetId })
      .andWhere('inv.taxWithholdingId IS NOT NULL')
      .andWhere('inv.taxWithholdingAmount > 0')
      .andWhere('inv.status NOT IN (:...excluded)', {
        excluded: FINANCIAL_EXCLUDED,
      })
      .andWhere('inv.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      });
    if (currencyId) qb.andWhere('inv.currencyId = :cid', { cid: currencyId });

    const row = await qb.getRawOne<{
      totalWithheld: string;
      totalBase: string;
      count: string;
    }>();
    const totalWithheld = this.n(row?.totalWithheld);
    const totalBase = this.n(row?.totalBase);
    const count = this.n(row?.count);
    const avgRate =
      totalBase > 0 ? Math.round((totalWithheld / totalBase) * 10000) / 100 : 0;

    return { totalWithheld, totalBase, avgRate, count };
  }

  private async getWithholdingByTax(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardWithholdingEntryDto[]> {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .innerJoin('inv.taxWithholding', 'tw')
      .select('tw.id', 'taxId')
      .addSelect('tw.label', 'taxLabel')
      .addSelect('tw.rate', 'rate')
      .addSelect('COALESCE(SUM(inv.total), 0)', 'totalBase')
      .addSelect('COALESCE(SUM(inv.taxWithholdingAmount), 0)', 'totalWithheld')
      .addSelect('COUNT(inv.id)', 'invoiceCount')
      .where('inv.cabinetId = :cabinetId', { cabinetId })
      .andWhere('inv.taxWithholdingId IS NOT NULL')
      .andWhere('inv.taxWithholdingAmount > 0')
      .andWhere('inv.status NOT IN (:...excluded)', {
        excluded: FINANCIAL_EXCLUDED,
      })
      .andWhere('inv.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      })
      .groupBy('tw.id')
      .addGroupBy('tw.label')
      .addGroupBy('tw.rate')
      .orderBy('totalWithheld', 'DESC');
    if (currencyId) qb.andWhere('inv.currencyId = :cid', { cid: currencyId });

    const rows = await qb.getRawMany<{
      taxId: string;
      taxLabel: string;
      rate: string;
      totalBase: string;
      totalWithheld: string;
      invoiceCount: string;
    }>();
    return rows.map((r) => ({
      taxId: this.n(r.taxId),
      taxLabel: r.taxLabel ?? 'N/A',
      rate: this.n(r.rate),
      totalBase: this.n(r.totalBase),
      totalWithheld: this.n(r.totalWithheld),
      invoiceCount: this.n(r.invoiceCount),
    }));
  }

  private async getWithholdingEvolution(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardTimeSeriesPointDto[]> {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .select("DATE_FORMAT(inv.date, '%Y-%m')", 'period')
      .addSelect('COALESCE(SUM(inv.taxWithholdingAmount), 0)', 'value')
      .where('inv.cabinetId = :cabinetId', { cabinetId })
      .andWhere('inv.taxWithholdingId IS NOT NULL')
      .andWhere('inv.taxWithholdingAmount > 0')
      .andWhere('inv.status NOT IN (:...excluded)', {
        excluded: FINANCIAL_EXCLUDED,
      })
      .andWhere('inv.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      })
      .groupBy("DATE_FORMAT(inv.date, '%Y-%m')")
      .orderBy('period', 'ASC');
    if (currencyId) qb.andWhere('inv.currencyId = :cid', { cid: currencyId });

    const rows = await qb.getRawMany<{ period: string; value: string }>();
    const byPeriod = new Map(rows.map((r) => [r.period, this.n(r.value)]));
    return this.monthsInRange(range.startDate, range.endDate).map((m) => ({
      period: m,
      label: this.fmtMonth(m),
      value: byPeriod.get(m) ?? 0,
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC ACCESSORS — used by DashboardService for cross-cutting endpoints
  // ═══════════════════════════════════════════════════════════════════════════

  /** Buying aggregates for the Global (Vue globale) tab */
  async getBuyingAggregatesForGlobal(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<{
    totalPurchases: number;
    prevTotalPurchases: number;
    paidToSuppliers: number;
    prevPaidToSuppliers: number;
    remainingPayables: number;
    prevRemainingPayables: number;
    totalBuyingInvoices: number;
    prevTotalBuyingInvoices: number;
    buyingPaymentsCount: number;
    prevBuyingPaymentsCount: number;
  }> {
    const prev = {
      startDate: range.previousStartDate,
      endDate: range.previousEndDate,
    };
    const [
      totalPurchases,
      prevTotalPurchases,
      paidToSuppliers,
      prevPaidToSuppliers,
      remainingPayables,
      prevRemainingPayables,
      totalBuyingInvoices,
      prevTotalBuyingInvoices,
      buyingPaymentsCount,
      prevBuyingPaymentsCount,
    ] = await Promise.all([
      this.sumBuyingInvoices(cabinetId, currencyId, range),
      this.sumBuyingInvoices(cabinetId, currencyId, prev),
      this.sumBuyingPayments(cabinetId, currencyId, range),
      this.sumBuyingPayments(cabinetId, currencyId, prev),
      this.sumBuyingRemaining(cabinetId, currencyId, range),
      this.sumBuyingRemaining(cabinetId, currencyId, prev),
      this.countBuyingInvoices(cabinetId, currencyId, range, null),
      this.countBuyingInvoices(cabinetId, currencyId, prev, null),
      this.countBuyingPayments(cabinetId, currencyId, range),
      this.countBuyingPayments(cabinetId, currencyId, prev),
    ]);

    return {
      totalPurchases,
      prevTotalPurchases,
      paidToSuppliers,
      prevPaidToSuppliers,
      remainingPayables,
      prevRemainingPayables,
      totalBuyingInvoices,
      prevTotalBuyingInvoices,
      buyingPaymentsCount,
      prevBuyingPaymentsCount,
    };
  }

  /** Treasury balance KPI for Global tab */
  async getTreasuryBalanceForGlobal(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<{ balance: number; prevBalance: number }> {
    const prev = {
      startDate: range.previousStartDate,
      endDate: range.previousEndDate,
    };
    const [inflows, outflows, prevInflows, prevOutflows] = await Promise.all([
      this.sumMovements(
        cabinetId,
        currencyId,
        range,
        TREASURY_MOVEMENT_DIRECTION.IN,
      ),
      this.sumMovements(
        cabinetId,
        currencyId,
        range,
        TREASURY_MOVEMENT_DIRECTION.OUT,
      ),
      this.sumMovements(
        cabinetId,
        currencyId,
        prev,
        TREASURY_MOVEMENT_DIRECTION.IN,
      ),
      this.sumMovements(
        cabinetId,
        currencyId,
        prev,
        TREASURY_MOVEMENT_DIRECTION.OUT,
      ),
    ]);
    return {
      balance: inflows - outflows,
      prevBalance: prevInflows - prevOutflows,
    };
  }

  /** Monthly purchases chart data for Global tab */
  async getPurchasesChartPublic(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardTimeSeriesPointDto[]> {
    return this.getPurchasesChart(cabinetId, currencyId, range);
  }

  /** Cash flow chart for Global tab */
  async getCashFlowChartPublic(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardCashFlowPointDto[]> {
    return this.getCashFlowChart(cabinetId, currencyId, range);
  }

  /** Buying invoice status chart for Global tab */
  async getBuyingInvoiceStatusChartPublic(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardStatusPointDto[]> {
    return this.getBuyingInvoiceStatusChart(cabinetId, currencyId, range);
  }

  /** Top suppliers for Referentials tab */
  async getTopSuppliersPublic(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
    limit: number,
  ): Promise<DashboardTopSupplierDto[]> {
    return this.getTopSuppliers(cabinetId, currencyId, range, limit);
  }

  /** Buying payment evolution for Payments tab */
  async getBuyingPaymentEvolution(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardTimeSeriesPointDto[]> {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .select("DATE_FORMAT(p.date, '%Y-%m')", 'period')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'value')
      .where('p.cabinetId = :cabinetId', { cabinetId })
      .andWhere('p.activityType = :buying', { buying: ACTIVITY_TYPE.BUYING })
      .andWhere('p.collectionStatus != :rejected', {
        rejected: PAYMENT_COLLECTION_STATUS.REJECTED,
      })
      .andWhere('p.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      })
      .groupBy("DATE_FORMAT(p.date, '%Y-%m')")
      .orderBy('period', 'ASC');
    if (currencyId) qb.andWhere('p.currencyId = :cid', { cid: currencyId });

    const rows = await qb.getRawMany<{ period: string; value: string }>();
    const byPeriod = new Map(rows.map((r) => [r.period, this.n(r.value)]));
    return this.monthsInRange(range.startDate, range.endDate).map((m) => ({
      period: m,
      label: this.fmtMonth(m),
      value: byPeriod.get(m) ?? 0,
    }));
  }

  /** Buying payment methods for Payments tab */
  async getBuyingPaymentMethodsPublic(
    cabinetId: number,
    currencyId: number | undefined,
    range: DateRange,
  ): Promise<DashboardPaymentMethodPointDto[]> {
    return this.getBuyingPaymentMethodsChart(cabinetId, currencyId, range);
  }

  /** Payables aging for Payments tab */
  async getPayablesAgingPublic(
    cabinetId: number,
    currencyId: number | undefined,
  ): Promise<DashboardReceivablesAgingDto[]> {
    return this.getPayablesAgingChart(cabinetId, currencyId);
  }

  /** Average days to payment for buying invoices */
  async getAvgDaysToPaymentBuying(
    cabinetId: number,
    currencyId: number | undefined,
    range: Pick<DateRange, 'startDate' | 'endDate'>,
  ): Promise<number> {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .select('AVG(DATEDIFF(inv.updatedAt, inv.date))', 'avgDays')
      .where('inv.cabinetId = :cabinetId', { cabinetId })
      .andWhere('inv.activityType = :buying', { buying: ACTIVITY_TYPE.BUYING })
      .andWhere('inv.status IN (:...paidStatuses)', {
        paidStatuses: PAID_STATUSES,
      })
      .andWhere('inv.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      });
    if (currencyId) qb.andWhere('inv.currencyId = :cid', { cid: currencyId });
    const row = await qb.getRawOne<{ avgDays: string }>();
    return Math.round(this.n(row?.avgDays));
  }

  /** Expose resolveDateRange & buildMeta for DashboardService coordination */
  public resolveRange(query: DashboardQueryDto): DateRange {
    return this.resolveDateRange(query);
  }

  public meta(
    cabinetId: number,
    currency: any,
    range: DateRange,
  ): DashboardOverviewMetaDto {
    return this.buildMeta(cabinetId, currency, range);
  }

  /** Count buying payments */
  private async countBuyingPayments(
    cabinetId: number,
    currencyId: number | undefined,
    range: Pick<DateRange, 'startDate' | 'endDate'>,
  ): Promise<number> {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .select('COUNT(p.id)', 'count')
      .where('p.cabinetId = :cabinetId', { cabinetId })
      .andWhere('p.activityType = :buying', { buying: ACTIVITY_TYPE.BUYING })
      .andWhere('p.collectionStatus != :rejected', {
        rejected: PAYMENT_COLLECTION_STATUS.REJECTED,
      })
      .andWhere('p.date BETWEEN :s AND :e', {
        s: this.toSqlDate(range.startDate),
        e: this.toSqlDate(range.endDate),
      });
    if (currencyId) qb.andWhere('p.currencyId = :cid', { cid: currencyId });
    const row = await qb.getRawOne<{ count: string }>();
    return this.n(row?.count);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private kpi(
    value: number,
    previousValue?: number,
    positiveIsGood = true,
  ): DashboardKpiDto {
    if (previousValue === undefined || previousValue === null) {
      return { value, trend: 'neutral' };
    }
    const changePercent =
      previousValue !== 0
        ? Math.round(
            ((value - previousValue) / Math.abs(previousValue)) * 1000,
          ) / 10
        : value > 0
          ? 100
          : 0;
    let trend: DashboardTrend = 'neutral';
    if (changePercent > 0) trend = positiveIsGood ? 'positive' : 'negative';
    else if (changePercent < 0)
      trend = positiveIsGood ? 'negative' : 'positive';
    return { value, previousValue, changePercent, trend };
  }

  private n(value?: string | number | null): number {
    if (value === null || value === undefined) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : Math.round(num * 1000) / 1000;
  }

  private toSqlDate(value: Date): string {
    return format(value, 'yyyy-MM-dd HH:mm:ss');
  }

  private monthsInRange(start: Date, end: Date): string[] {
    const months: string[] = [];
    let current = startOfMonth(start);
    const endMonth = startOfMonth(end);
    while (current <= endMonth) {
      months.push(format(current, 'yyyy-MM'));
      current = addMonths(current, 1);
    }
    return months;
  }

  private fmtMonth(period: string): string {
    const [year, month] = period.split('-');
    const monthNames = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Jun',
      'Jul',
      'Aoû',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  }

  private resolveDateRange(query: DashboardQueryDto): DateRange {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(now);

    switch (query.period) {
      case DASHBOARD_PERIOD.TODAY:
        startDate = startOfDay(now);
        break;
      case DASHBOARD_PERIOD.LAST_7_DAYS:
        startDate = startOfDay(subDays(now, 7));
        break;
      case DASHBOARD_PERIOD.LAST_30_DAYS:
        startDate = startOfDay(subDays(now, 30));
        break;
      case DASHBOARD_PERIOD.CURRENT_MONTH:
        startDate = startOfMonth(now);
        break;
      case DASHBOARD_PERIOD.CUSTOM:
        startDate = query.startDate
          ? startOfDay(new Date(query.startDate))
          : startOfDay(subMonths(now, 12));
        endDate = query.endDate
          ? endOfDay(new Date(query.endDate))
          : endOfDay(now);
        break;
      case DASHBOARD_PERIOD.CURRENT_YEAR:
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const durationMs = endDate.getTime() - startDate.getTime();
    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousStartDate = new Date(previousEndDate.getTime() - durationMs);

    return { startDate, endDate, previousStartDate, previousEndDate };
  }

  private async resolveCurrency(
    requestedCurrencyId: number | undefined,
    cabinetCurrencyId: number,
    cabinetCurrency?: any,
  ) {
    if (requestedCurrencyId) {
      try {
        return await this.currencyService.findOneById(requestedCurrencyId);
      } catch {
        return (
          cabinetCurrency ?? {
            id: cabinetCurrencyId,
            code: 'TND',
            symbol: 'TND',
            digitAfterComma: 3,
          }
        );
      }
    }
    return (
      cabinetCurrency ?? {
        id: cabinetCurrencyId,
        code: 'TND',
        symbol: 'TND',
        digitAfterComma: 3,
      }
    );
  }

  private buildMeta(
    cabinetId: number,
    currency: any,
    range: DateRange,
  ): DashboardOverviewMetaDto {
    return {
      cabinetId,
      currency: {
        id: currency?.id,
        code: currency?.code,
        symbol: currency?.symbol,
        digitAfterComma: currency?.digitAfterComma,
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
}
