import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { InvoiceEntity } from 'src/modules/invoice/entities/invoice.entity';
import { INVOICE_STATUS } from 'src/modules/invoice/enums/invoice-status.enum';
import { PaymentEntity } from 'src/modules/payment/entities/payment.entity';
import { QuotationEntity } from 'src/modules/quotation/entities/quotation.entity';
import { FirmEntity } from 'src/modules/firm/entities/firm.entity';
import { FIRM_ENTITY_TYPE } from 'src/modules/firm/enums/firm-entity-type.enum';
import { ArticleEntity } from 'src/modules/article/entities/article.entity';
import { CustomerOrderEntity } from 'src/modules/customer-order/entities/customer-order.entity';
import { DeliveryNoteEntity } from 'src/modules/delivery-note/entities/delivery-note.entity';
import { CreditNoteEntity } from 'src/modules/credit-note/entities/credit-note.entity';
// QUOTATION_STATUS kept available for future quotation analytics
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { QUOTATION_STATUS } from 'src/modules/quotation/enums/quotation-status.enum';

@Injectable()
export class AnalyticsToolsService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(QuotationEntity)
    private readonly quotationRepo: Repository<QuotationEntity>,
    @InjectRepository(FirmEntity)
    private readonly firmRepo: Repository<FirmEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    @InjectRepository(CustomerOrderEntity)
    private readonly customerOrderRepo: Repository<CustomerOrderEntity>,
    @InjectRepository(DeliveryNoteEntity)
    private readonly deliveryNoteRepo: Repository<DeliveryNoteEntity>,
    @InjectRepository(CreditNoteEntity)
    private readonly creditNoteRepo: Repository<CreditNoteEntity>,
  ) {}

  async getInvoiceSummary(cabinetId: number) {
    const invoices = await this.invoiceRepo.find({
      where: { cabinetId },
      relations: ['interlocutor', 'currency'],
    });

    const total = invoices.length;
    const paid = invoices.filter(
      (i) => i.status === INVOICE_STATUS.Paid,
    ).length;
    const unpaid = invoices.filter((i) =>
      [
        INVOICE_STATUS.Unpaid,
        INVOICE_STATUS.Validated,
        INVOICE_STATUS.Sent,
      ].includes(i.status),
    ).length;
    const partiallyPaid = invoices.filter(
      (i) => i.status === INVOICE_STATUS.PartiallyPaid,
    ).length;
    const overdue = invoices.filter(
      (i) =>
        i.dueDate &&
        new Date(i.dueDate) < new Date() &&
        ![
          INVOICE_STATUS.Paid,
          INVOICE_STATUS.Settled,
          INVOICE_STATUS.Draft,
        ].includes(i.status),
    ).length;
    const totalAmount = invoices.reduce((sum, i) => sum + (i.total ?? 0), 0);
    const totalPaid = invoices.reduce((sum, i) => sum + (i.amountPaid ?? 0), 0);

    return {
      total,
      paid,
      unpaid,
      partiallyPaid,
      overdue,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalRemaining: Math.round((totalAmount - totalPaid) * 100) / 100,
    };
  }

  async getPaidInvoices(cabinetId: number) {
    return this.invoiceRepo.find({
      where: { cabinetId, status: INVOICE_STATUS.Paid },
      relations: ['interlocutor', 'currency'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getUnpaidInvoices(cabinetId: number) {
    const invoices = await this.invoiceRepo.find({
      where: { cabinetId },
      relations: ['interlocutor', 'currency'],
      order: { createdAt: 'DESC' },
    });
    return invoices.filter((i) =>
      [
        INVOICE_STATUS.Unpaid,
        INVOICE_STATUS.Validated,
        INVOICE_STATUS.Sent,
        INVOICE_STATUS.Expired,
      ].includes(i.status),
    );
  }

  async getOverdueInvoices(cabinetId: number) {
    const invoices = await this.invoiceRepo.find({
      where: { cabinetId },
      relations: ['interlocutor', 'currency'],
    });
    const now = new Date();
    return invoices.filter(
      (i) =>
        i.dueDate &&
        new Date(i.dueDate) < now &&
        ![
          INVOICE_STATUS.Paid,
          INVOICE_STATUS.Settled,
          INVOICE_STATUS.Draft,
        ].includes(i.status),
    );
  }

  async getPartiallyPaidInvoices(cabinetId: number) {
    return this.invoiceRepo.find({
      where: { cabinetId, status: INVOICE_STATUS.PartiallyPaid },
      relations: ['interlocutor', 'currency'],
      order: { createdAt: 'DESC' },
    });
  }

  async getInvoicesByStatus(cabinetId: number, status: INVOICE_STATUS) {
    return this.invoiceRepo.find({
      where: { cabinetId, status },
      relations: ['interlocutor', 'currency'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getRecentInvoices(cabinetId: number, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const invoices = await this.invoiceRepo.find({
      where: { cabinetId },
      relations: ['interlocutor', 'currency'],
      order: { createdAt: 'DESC' },
    });
    return invoices.filter(
      (i) => i.createdAt && new Date(i.createdAt) >= since,
    );
  }

  async getTopCustomersByRevenue(cabinetId: number, limit = 5) {
    const result = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .select('invoice.interlocutorId', 'interlocutorId')
      .addSelect('interlocutor.surname', 'customerName')
      .addSelect('SUM(invoice.total)', 'totalRevenue')
      .addSelect('COUNT(invoice.id)', 'invoiceCount')
      .innerJoin('invoice.interlocutor', 'interlocutor')
      .where('invoice.cabinetId = :cabinetId', { cabinetId })
      .andWhere('invoice.deletedAt IS NULL')
      .groupBy('invoice.interlocutorId')
      .addGroupBy('interlocutor.surname')
      .orderBy('totalRevenue', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((r) => ({
      interlocutorId: r.interlocutorId,
      customerName: r.customerName,
      totalRevenue: Math.round(parseFloat(r.totalRevenue) * 100) / 100,
      invoiceCount: parseInt(r.invoiceCount),
    }));
  }

  async getMonthlyRevenue(cabinetId: number, months = 6) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const result = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .select("DATE_FORMAT(invoice.date, '%Y-%m')", 'month')
      .addSelect('SUM(invoice.total)', 'total')
      .addSelect('COUNT(invoice.id)', 'count')
      .where('invoice.cabinetId = :cabinetId', { cabinetId })
      .andWhere('invoice.date >= :since', { since })
      .andWhere('invoice.deletedAt IS NULL')
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return result.map((r) => ({
      month: r.month,
      total: Math.round(parseFloat(r.total || '0') * 100) / 100,
      count: parseInt(r.count || '0'),
    }));
  }

  async getPaymentsByMethod(cabinetId: number) {
    const result = await this.paymentRepo
      .createQueryBuilder('payment')
      .select('payment.mode', 'method')
      .addSelect('SUM(payment.amount)', 'total')
      .addSelect('COUNT(payment.id)', 'count')
      .where('payment.cabinetId = :cabinetId', { cabinetId })
      .andWhere('payment.deletedAt IS NULL')
      .groupBy('payment.mode')
      .getRawMany();

    return result.map((r) => ({
      method: r.method,
      total: Math.round(parseFloat(r.total || '0') * 100) / 100,
      count: parseInt(r.count || '0'),
    }));
  }

  async getRecentPayments(cabinetId: number, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const payments = await this.paymentRepo.find({
      where: { cabinetId },
      relations: ['firm'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return payments.filter(
      (p) => p.createdAt && new Date(p.createdAt) >= since,
    );
  }

  async getQuotesStatusSummary(cabinetId: number) {
    const quotations = await this.quotationRepo.find({
      where: { cabinetId },
    });

    const statusCounts: Record<string, number> = {};
    for (const q of quotations) {
      const status = q.status ?? 'unknown';
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    }

    return {
      total: quotations.length,
      byStatus: statusCounts,
      totalAmount:
        Math.round(
          quotations.reduce((sum, q) => sum + (q.total ?? 0), 0) * 100,
        ) / 100,
    };
  }

  async getCustomerBalance(cabinetId: number, interlocutorId: number) {
    const invoices = await this.invoiceRepo.find({
      where: { cabinetId, interlocutorId },
      relations: ['interlocutor', 'currency'],
    });

    const totalInvoiced = invoices.reduce((sum, i) => sum + (i.total ?? 0), 0);
    const totalPaid = invoices.reduce((sum, i) => sum + (i.amountPaid ?? 0), 0);

    return {
      interlocutorId,
      totalInvoiced: Math.round(totalInvoiced * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      balance: Math.round((totalInvoiced - totalPaid) * 100) / 100,
      invoiceCount: invoices.length,
    };
  }

  async getDashboardKpis(cabinetId: number) {
    const [invoiceSummary, quoteSummary, monthlyRevenue, topCustomers] =
      await Promise.all([
        this.getInvoiceSummary(cabinetId),
        this.getQuotesStatusSummary(cabinetId),
        this.getMonthlyRevenue(cabinetId, 3),
        this.getTopCustomersByRevenue(cabinetId, 3),
      ]);

    return {
      invoices: invoiceSummary,
      quotations: quoteSummary,
      recentRevenue: monthlyRevenue,
      topCustomers,
    };
  }

  /* ── Clients / Suppliers (Firms) ──────────────────────────── */

  async getClients(cabinetId: number, limit = 50) {
    const firms = await this.firmRepo.find({
      where: { cabinetId, entityType: FIRM_ENTITY_TYPE.CLIENTS },
      relations: ['currency', 'invoicingAddress'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return firms.map((f) => ({
      id: f.id,
      name: f.name,
      phone: f.phone ?? '',
      taxIdNumber: f.taxIdNumber ?? '',
      currency: f.currency?.code ?? 'TND',
      address: this.formatAddress(f.invoicingAddress),
    }));
  }

  async getSuppliers(cabinetId: number, limit = 50) {
    const firms = await this.firmRepo.find({
      where: { cabinetId, entityType: FIRM_ENTITY_TYPE.SUPPLIERS },
      relations: ['currency', 'invoicingAddress'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return firms.map((f) => ({
      id: f.id,
      name: f.name,
      phone: f.phone ?? '',
      taxIdNumber: f.taxIdNumber ?? '',
      currency: f.currency?.code ?? 'TND',
      address: this.formatAddress(f.invoicingAddress),
    }));
  }

  async getClientsSummary(cabinetId: number) {
    const [clients, suppliers] = await Promise.all([
      this.firmRepo.count({
        where: { cabinetId, entityType: FIRM_ENTITY_TYPE.CLIENTS },
      }),
      this.firmRepo.count({
        where: { cabinetId, entityType: FIRM_ENTITY_TYPE.SUPPLIERS },
      }),
    ]);
    return { totalClients: clients, totalSuppliers: suppliers };
  }

  async searchClient(cabinetId: number, query: string) {
    const firms = await this.firmRepo.find({
      where: [
        {
          cabinetId,
          entityType: FIRM_ENTITY_TYPE.CLIENTS,
          name: Like(`%${query}%`),
        },
      ],
      relations: ['currency', 'invoicingAddress'],
      take: 20,
    });
    return firms.map((f) => ({
      id: f.id,
      name: f.name,
      phone: f.phone ?? '',
      taxIdNumber: f.taxIdNumber ?? '',
      currency: f.currency?.code ?? 'TND',
      address: this.formatAddress(f.invoicingAddress),
    }));
  }

  private formatAddress(addr: any): string {
    if (!addr) return '';
    return [addr.address, addr.region, addr.country?.name]
      .filter(Boolean)
      .join(', ');
  }

  /* ── Articles ─────────────────────────────────────────────── */

  async getArticles(cabinetId: number, limit = 50) {
    const articles = await this.articleRepo.find({
      where: { cabinetId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return articles.map((a) => ({
      id: a.id,
      title: a.title ?? '',
      reference: a.reference ?? '',
      articleType: a.articleType,
      salePrice: a.salePrice ? Number(a.salePrice) : 0,
      purchasePrice: a.purchasePrice ? Number(a.purchasePrice) : 0,
      unit: a.unit ?? '',
      family: a.family ?? '',
    }));
  }

  async getArticleSummary(cabinetId: number) {
    const articles = await this.articleRepo.find({ where: { cabinetId } });
    const products = articles.filter((a) => !a.isService).length;
    const services = articles.filter((a) => a.isService).length;
    return { total: articles.length, products, services };
  }

  async searchArticle(cabinetId: number, query: string) {
    const articles = await this.articleRepo.find({
      where: [
        { cabinetId, title: Like(`%${query}%`) },
        { cabinetId, reference: Like(`%${query}%`) },
      ],
      take: 20,
    });
    return articles.map((a) => ({
      id: a.id,
      title: a.title ?? '',
      reference: a.reference ?? '',
      articleType: a.articleType,
      salePrice: a.salePrice ? Number(a.salePrice) : 0,
      purchasePrice: a.purchasePrice ? Number(a.purchasePrice) : 0,
      unit: a.unit ?? '',
      family: a.family ?? '',
    }));
  }

  /* ── Customer Orders ──────────────────────────────────────── */

  async getCustomerOrders(cabinetId: number, limit = 50) {
    const orders = await this.customerOrderRepo.find({
      where: { cabinetId },
      relations: ['interlocutor', 'currency'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return orders.map((o) => ({
      id: o.id,
      sequential: o.sequential,
      date: o.date,
      dueDate: o.dueDate,
      status: o.status,
      total: o.total ?? 0,
      customerName: o.interlocutor?.surname ?? o.interlocutor?.name ?? 'N/A',
      currency: o.currency?.code ?? 'TND',
    }));
  }

  async getCustomerOrderSummary(cabinetId: number) {
    const orders = await this.customerOrderRepo.find({ where: { cabinetId } });
    const statusCounts: Record<string, number> = {};
    for (const o of orders) {
      const status = o.status ?? 'unknown';
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    }
    const totalAmount = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
    return {
      total: orders.length,
      byStatus: statusCounts,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  /* ── Delivery Notes ───────────────────────────────────────── */

  async getDeliveryNotes(cabinetId: number, limit = 50) {
    const notes = await this.deliveryNoteRepo.find({
      where: { cabinetId },
      relations: ['interlocutor', 'currency'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return notes.map((n) => ({
      id: n.id,
      sequential: n.sequential,
      date: n.date,
      status: n.status,
      total: n.total ?? 0,
      customerName: n.interlocutor?.surname ?? n.interlocutor?.name ?? 'N/A',
      currency: n.currency?.code ?? 'TND',
    }));
  }

  async getDeliveryNoteSummary(cabinetId: number) {
    const notes = await this.deliveryNoteRepo.find({ where: { cabinetId } });
    const statusCounts: Record<string, number> = {};
    for (const n of notes) {
      const status = n.status ?? 'unknown';
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    }
    const totalAmount = notes.reduce((sum, n) => sum + (n.total ?? 0), 0);
    return {
      total: notes.length,
      byStatus: statusCounts,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  /* ── Credit Notes ─────────────────────────────────────────── */

  async getCreditNotes(cabinetId: number, limit = 50) {
    const notes = await this.creditNoteRepo.find({
      where: { cabinetId },
      relations: ['interlocutor', 'currency'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return notes.map((n) => ({
      id: n.id,
      sequential: n.sequential,
      date: n.date,
      status: n.status,
      total: n.total ?? 0,
      amountPaid: n.amountPaid ?? 0,
      customerName: n.interlocutor?.surname ?? n.interlocutor?.name ?? 'N/A',
      currency: n.currency?.code ?? 'TND',
    }));
  }

  async getCreditNoteSummary(cabinetId: number) {
    const notes = await this.creditNoteRepo.find({ where: { cabinetId } });
    const statusCounts: Record<string, number> = {};
    for (const n of notes) {
      const status = n.status ?? 'unknown';
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    }
    const totalAmount = notes.reduce((sum, n) => sum + (n.total ?? 0), 0);
    return {
      total: notes.length,
      byStatus: statusCounts,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }
}
