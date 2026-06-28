import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsToolsService } from './analytics-tools.service';
import { ChartToolsService } from './chart-tools.service';
import { INVOICE_STATUS } from 'src/modules/invoice/enums/invoice-status.enum';

export interface ToolCall {
  tool: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  tool: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

/* ── Status name mapping (AI-friendly → enum value) ────────── */

const STATUS_MAP: Record<string, INVOICE_STATUS> = {
  // English keys
  draft: INVOICE_STATUS.Draft,
  sent: INVOICE_STATUS.Sent,
  validated: INVOICE_STATUS.Validated,
  paid: INVOICE_STATUS.Paid,
  settled: INVOICE_STATUS.Settled,
  partially_paid: INVOICE_STATUS.PartiallyPaid,
  partiallypaid: INVOICE_STATUS.PartiallyPaid,
  partially_settled: INVOICE_STATUS.PartiallySettled,
  unpaid: INVOICE_STATUS.Unpaid,
  expired: INVOICE_STATUS.Expired,
  archived: INVOICE_STATUS.Archived,
  // French keys
  brouillon: INVOICE_STATUS.Draft,
  envoyée: INVOICE_STATUS.Sent,
  envoyee: INVOICE_STATUS.Sent,
  validée: INVOICE_STATUS.Validated,
  validee: INVOICE_STATUS.Validated,
  payée: INVOICE_STATUS.Paid,
  payee: INVOICE_STATUS.Paid,
  réglée: INVOICE_STATUS.Settled,
  reglee: INVOICE_STATUS.Settled,
  partiellement_payée: INVOICE_STATUS.PartiallyPaid,
  partiellement_payee: INVOICE_STATUS.PartiallyPaid,
  impayée: INVOICE_STATUS.Unpaid,
  impayee: INVOICE_STATUS.Unpaid,
  expirée: INVOICE_STATUS.Expired,
  expiree: INVOICE_STATUS.Expired,
  archivée: INVOICE_STATUS.Archived,
  archivee: INVOICE_STATUS.Archived,
};

@Injectable()
export class AiToolRegistryService {
  private readonly logger = new Logger(AiToolRegistryService.name);

  constructor(
    private readonly analyticsTools: AnalyticsToolsService,
    private readonly chartTools: ChartToolsService,
  ) {}

  async executeTool(
    toolCall: ToolCall,
    cabinetId: number,
  ): Promise<ToolResult> {
    const { tool, arguments: args } = toolCall;

    try {
      const data = await this.dispatch(tool, args, cabinetId);
      return { tool, success: true, data };
    } catch (error) {
      this.logger.warn(`Tool ${tool} failed: ${(error as Error).message}`);
      return {
        tool,
        success: false,
        error: `L'outil "${tool}" a échoué: ${(error as Error).message}`,
      };
    }
  }

  async executeToolCalls(
    toolCalls: ToolCall[],
    cabinetId: number,
  ): Promise<ToolResult[]> {
    return Promise.all(toolCalls.map((tc) => this.executeTool(tc, cabinetId)));
  }

  private async dispatch(
    tool: string,
    args: Record<string, unknown>,
    cabinetId: number,
  ): Promise<unknown> {
    switch (tool) {
      case 'getInvoiceSummary':
        return this.analyticsTools.getInvoiceSummary(cabinetId);
      case 'getPaidInvoices':
        return this.formatInvoiceList(
          await this.analyticsTools.getPaidInvoices(cabinetId),
        );
      case 'getUnpaidInvoices':
        return this.formatInvoiceList(
          await this.analyticsTools.getUnpaidInvoices(cabinetId),
        );
      case 'getOverdueInvoices':
        return this.formatInvoiceList(
          await this.analyticsTools.getOverdueInvoices(cabinetId),
        );
      case 'getPartiallyPaidInvoices':
        return this.formatInvoiceList(
          await this.analyticsTools.getPartiallyPaidInvoices(cabinetId),
        );
      case 'getTopCustomersByRevenue':
        return this.analyticsTools.getTopCustomersByRevenue(
          cabinetId,
          (args.limit as number) ?? 5,
        );
      case 'getMonthlyRevenue':
        return this.analyticsTools.getMonthlyRevenue(
          cabinetId,
          (args.months as number) ?? 6,
        );
      case 'getPaymentsByMethod':
        return this.analyticsTools.getPaymentsByMethod(cabinetId);
      case 'getQuotesStatusSummary':
        return this.analyticsTools.getQuotesStatusSummary(cabinetId);
      case 'getCustomerBalance':
        return this.analyticsTools.getCustomerBalance(
          cabinetId,
          args.interlocutorId as number,
        );
      case 'getDashboardKpis':
        return this.analyticsTools.getDashboardKpis(cabinetId);
      case 'getInvoicesByStatus':
        return this.formatInvoiceList(
          await this.analyticsTools.getInvoicesByStatus(
            cabinetId,
            this.resolveInvoiceStatus(args.status as string),
          ),
        );
      case 'getRecentInvoices':
        return this.formatInvoiceList(
          await this.analyticsTools.getRecentInvoices(
            cabinetId,
            (args.days as number) ?? 7,
          ),
        );
      case 'getRecentPayments':
        return this.analyticsTools.getRecentPayments(
          cabinetId,
          (args.days as number) ?? 30,
        );

      // Clients / Suppliers
      case 'getClients':
        return this.analyticsTools.getClients(
          cabinetId,
          (args.limit as number) ?? 50,
        );
      case 'getSuppliers':
        return this.analyticsTools.getSuppliers(
          cabinetId,
          (args.limit as number) ?? 50,
        );
      case 'getClientsSummary':
        return this.analyticsTools.getClientsSummary(cabinetId);
      case 'searchClient':
        return this.analyticsTools.searchClient(
          cabinetId,
          (args.query as string) ?? '',
        );

      // Articles
      case 'getArticles':
        return this.analyticsTools.getArticles(
          cabinetId,
          (args.limit as number) ?? 50,
        );
      case 'getArticleSummary':
        return this.analyticsTools.getArticleSummary(cabinetId);
      case 'searchArticle':
        return this.analyticsTools.searchArticle(
          cabinetId,
          (args.query as string) ?? '',
        );

      // Customer Orders
      case 'getCustomerOrders':
        return this.formatDocumentList(
          await this.analyticsTools.getCustomerOrders(
            cabinetId,
            (args.limit as number) ?? 50,
          ),
        );
      case 'getCustomerOrderSummary':
        return this.analyticsTools.getCustomerOrderSummary(cabinetId);

      // Delivery Notes
      case 'getDeliveryNotes':
        return this.formatDocumentList(
          await this.analyticsTools.getDeliveryNotes(
            cabinetId,
            (args.limit as number) ?? 50,
          ),
        );
      case 'getDeliveryNoteSummary':
        return this.analyticsTools.getDeliveryNoteSummary(cabinetId);

      // Credit Notes
      case 'getCreditNotes':
        return this.formatDocumentList(
          await this.analyticsTools.getCreditNotes(
            cabinetId,
            (args.limit as number) ?? 50,
          ),
        );
      case 'getCreditNoteSummary':
        return this.analyticsTools.getCreditNoteSummary(cabinetId);

      default:
        throw new Error(`Outil inconnu: ${tool}`);
    }
  }

  private resolveInvoiceStatus(rawStatus: string): INVOICE_STATUS {
    if (!rawStatus) return INVOICE_STATUS.Draft;

    // If it's already a full enum value (e.g. "invoice.status.draft"), use directly
    const enumValues = Object.values(INVOICE_STATUS) as string[];
    if (enumValues.includes(rawStatus)) {
      return rawStatus as INVOICE_STATUS;
    }

    // Normalize: lowercase, trim, remove accents for matching
    const normalized = rawStatus.toLowerCase().trim();
    const mapped = STATUS_MAP[normalized];
    if (mapped) return mapped;

    // Try without accents
    const noAccents = normalized
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const mappedNoAccent = STATUS_MAP[noAccents];
    if (mappedNoAccent) return mappedNoAccent;

    this.logger.warn(`Unknown status "${rawStatus}", defaulting to Draft`);
    return INVOICE_STATUS.Draft;
  }

  private formatDocumentList(docs: any[]): unknown[] {
    return docs;
  }

  private formatInvoiceList(invoices: any[]): unknown[] {
    return invoices.map((i) => ({
      id: i.id,
      sequential: i.sequential,
      status: i.status,
      total: i.total,
      amountPaid: i.amountPaid ?? 0,
      date: i.date,
      dueDate: i.dueDate,
      customerName: i.interlocutor?.surname ?? i.interlocutor?.name ?? 'N/A',
      currency: i.currency?.code ?? 'TND',
    }));
  }
}
