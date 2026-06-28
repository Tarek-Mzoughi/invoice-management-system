import { Injectable, Logger } from '@nestjs/common';
import { GeminiProvider } from '../providers/gemini.provider';
import { AiContextService, AiUserContext } from './ai-context.service';
import { AiPermissionService } from './ai-permission.service';
import { AiAuditService } from './ai-audit.service';
import {
  AiToolRegistryService,
  ToolResult,
} from '../tools/ai-tool-registry.service';
import { ChartToolsService } from '../tools/chart-tools.service';
import { SYSTEM_PROMPT } from '../prompts/system.prompt';
import { buildBusinessContextPrompt } from '../prompts/business-context.prompt';
import { CHART_GENERATION_PROMPT } from '../prompts/chart-generation.prompt';
import { AI_INTENT } from '../enums/ai-intent.enum';
import { AI_MESSAGE_ROLE } from '../enums/ai-message-role.enum';
import { AI_CHART_TYPE } from '../enums/ai-chart-type.enum';
import { AiChatDto } from '../dto/ai-chat.dto';
import {
  AiChatResponseDto,
  AiChartResponseDto,
  AiTablePayloadDto,
  AiTableColumnDto,
  AiActionPreviewDto,
  AiKpiDto,
} from '../dto/ai-chat-response.dto';

interface ParsedAiResponse {
  intent: AI_INTENT;
  confidence: number;
  language: string;
  requiresAction: boolean;
  requiresConfirmation: boolean;
  toolCalls?: Array<{ tool: string; arguments: Record<string, unknown> }>;
  arguments?: Record<string, unknown>;
  missingFields?: string[];
  userMessage: string;
  chartConfig?: {
    chartType: string;
    title: string;
    description?: string;
  };
}

/* ── Column definitions for structured table responses ──────── */

const INVOICE_COLUMNS: AiTableColumnDto[] = [
  { key: 'sequential', label: 'N° Facture', type: 'text' },
  { key: 'customerName', label: 'Client', type: 'text' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'dueDate', label: 'Échéance', type: 'date' },
  { key: 'total', label: 'Montant', type: 'currency', align: 'right' },
  { key: 'amountPaid', label: 'Payé', type: 'currency', align: 'right' },
  { key: 'status', label: 'Statut', type: 'status' },
];

const TOP_CUSTOMERS_COLUMNS: AiTableColumnDto[] = [
  { key: 'customerName', label: 'Client', type: 'text' },
  {
    key: 'totalRevenue',
    label: "Chiffre d'affaires",
    type: 'currency',
    align: 'right',
  },
  { key: 'invoiceCount', label: 'Nb factures', type: 'number', align: 'right' },
];

const MONTHLY_REVENUE_COLUMNS: AiTableColumnDto[] = [
  { key: 'month', label: 'Mois', type: 'text' },
  {
    key: 'total',
    label: "Chiffre d'affaires",
    type: 'currency',
    align: 'right',
  },
];

const PAYMENTS_BY_METHOD_COLUMNS: AiTableColumnDto[] = [
  { key: 'method', label: 'Méthode', type: 'text' },
  { key: 'total', label: 'Montant', type: 'currency', align: 'right' },
  { key: 'count', label: 'Nombre', type: 'number', align: 'right' },
];

const RECENT_PAYMENTS_COLUMNS: AiTableColumnDto[] = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'amount', label: 'Montant', type: 'currency', align: 'right' },
  { key: 'mode', label: 'Méthode', type: 'text' },
  { key: 'reference', label: 'Référence', type: 'text' },
];

const CLIENTS_COLUMNS: AiTableColumnDto[] = [
  { key: 'name', label: 'Nom', type: 'text' },
  { key: 'phone', label: 'Téléphone', type: 'text' },
  { key: 'taxIdNumber', label: 'MF / TVA', type: 'text' },
  { key: 'currency', label: 'Devise', type: 'text' },
  { key: 'address', label: 'Adresse', type: 'text' },
];

const ARTICLES_COLUMNS: AiTableColumnDto[] = [
  { key: 'title', label: 'Titre', type: 'text' },
  { key: 'reference', label: 'Référence', type: 'text' },
  { key: 'articleType', label: 'Type', type: 'text' },
  { key: 'salePrice', label: 'Prix vente', type: 'currency', align: 'right' },
  {
    key: 'purchasePrice',
    label: 'Prix achat',
    type: 'currency',
    align: 'right',
  },
  { key: 'unit', label: 'Unité', type: 'text' },
  { key: 'family', label: 'Famille', type: 'text' },
];

const CUSTOMER_ORDER_COLUMNS: AiTableColumnDto[] = [
  { key: 'sequential', label: 'N° Commande', type: 'text' },
  { key: 'customerName', label: 'Client', type: 'text' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'dueDate', label: 'Échéance', type: 'date' },
  { key: 'total', label: 'Montant', type: 'currency', align: 'right' },
  { key: 'status', label: 'Statut', type: 'status' },
];

const DELIVERY_NOTE_COLUMNS: AiTableColumnDto[] = [
  { key: 'sequential', label: 'N° BL', type: 'text' },
  { key: 'customerName', label: 'Client', type: 'text' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'total', label: 'Montant', type: 'currency', align: 'right' },
  { key: 'status', label: 'Statut', type: 'status' },
];

const CREDIT_NOTE_COLUMNS: AiTableColumnDto[] = [
  { key: 'sequential', label: 'N° Avoir', type: 'text' },
  { key: 'customerName', label: 'Client', type: 'text' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'total', label: 'Montant', type: 'currency', align: 'right' },
  { key: 'amountPaid', label: 'Payé', type: 'currency', align: 'right' },
  { key: 'status', label: 'Statut', type: 'status' },
];

/* ── Intent to entity type mapping ─────────────────────────── */

const INTENT_ENTITY_MAP: Record<string, string> = {
  [AI_INTENT.CREATE_INVOICE_DRAFT]: 'invoice',
  [AI_INTENT.CREATE_QUOTE_DRAFT]: 'quote',
  [AI_INTENT.CREATE_CUSTOMER]: 'customer',
  [AI_INTENT.CREATE_PAYMENT]: 'payment',
  [AI_INTENT.TRANSFORM_QUOTE_TO_INVOICE]: 'invoice',
};

const INTENT_TITLE_MAP: Record<string, string> = {
  [AI_INTENT.CREATE_INVOICE_DRAFT]: 'Création de facture',
  [AI_INTENT.CREATE_QUOTE_DRAFT]: 'Création de devis',
  [AI_INTENT.CREATE_CUSTOMER]: 'Création de client',
  [AI_INTENT.CREATE_PAYMENT]: 'Enregistrement de paiement',
  [AI_INTENT.TRANSFORM_QUOTE_TO_INVOICE]: 'Transformation devis → facture',
};

/* ── Tool name sets for response routing ───────────────────── */

const INVOICE_LIST_TOOLS = new Set([
  'getPaidInvoices',
  'getUnpaidInvoices',
  'getOverdueInvoices',
  'getPartiallyPaidInvoices',
  'getInvoicesByStatus',
  'getRecentInvoices',
]);

const CLIENT_LIST_TOOLS = new Set([
  'getClients',
  'getSuppliers',
  'searchClient',
]);

const ARTICLE_LIST_TOOLS = new Set(['getArticles', 'searchArticle']);

const SUMMARY_KPI_TOOLS = new Set([
  'getClientsSummary',
  'getArticleSummary',
  'getCustomerOrderSummary',
  'getDeliveryNoteSummary',
  'getCreditNoteSummary',
]);

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(
    private readonly gemini: GeminiProvider,
    private readonly contextService: AiContextService,
    private readonly permissionService: AiPermissionService,
    private readonly auditService: AiAuditService,
    private readonly toolRegistry: AiToolRegistryService,
    private readonly chartTools: ChartToolsService,
  ) {}

  async chat(dto: AiChatDto, userSub: string): Promise<AiChatResponseDto> {
    this.permissionService.assertCanUseAi();

    const userContext = await this.contextService.resolveUserContext(userSub);
    const conversation = await this.auditService.getOrCreateConversation(
      dto.conversationId,
      userContext.userId,
      userContext.cabinetId,
    );

    // Save user message
    await this.auditService.saveMessage(
      conversation.id,
      userContext.cabinetId,
      userContext.userId,
      AI_MESSAGE_ROLE.User,
      dto.message,
    );

    try {
      // Build full prompt
      const contextPrompt = buildBusinessContextPrompt({
        page: dto.context?.page,
        entityType: dto.context?.entityType,
        entityId: dto.context?.entityId,
        cabinetName: userContext.cabinetName,
        userName: userContext.userName,
      });

      const fullSystemPrompt = SYSTEM_PROMPT + contextPrompt;

      // Call Gemini for intent classification (with optional file attachments)
      const parsed = await this.gemini.generateStructured<ParsedAiResponse>({
        systemPrompt: fullSystemPrompt,
        userMessage: dto.message,
        attachments: dto.attachments?.map((a) => ({
          mimeType: a.mimeType,
          data: a.data,
          fileName: a.fileName,
        })),
        parseResponse: (raw) => this.parseGeminiResponse(raw),
      });

      // Check permissions for the detected intent
      this.permissionService.assertCanExecuteIntent(parsed.intent);

      // Handle based on intent
      const response = await this.handleParsedResponse(
        parsed,
        userContext,
        conversation.id,
        dto.message,
      );

      response.conversationId = conversation.id;

      // Save assistant message
      await this.auditService.saveMessage(
        conversation.id,
        userContext.cabinetId,
        userContext.userId,
        AI_MESSAGE_ROLE.Assistant,
        response.message,
        { type: response.type, intent: parsed.intent },
      );

      return response;
    } catch (error) {
      this.logger.error('AI chat error', (error as Error).stack);

      const errorResponse: AiChatResponseDto = {
        type: 'error',
        message:
          error instanceof Error && error.message.includes('indisponible')
            ? error.message
            : 'Une erreur est survenue. Veuillez réessayer.',
        conversationId: conversation.id,
      };

      await this.auditService.saveMessage(
        conversation.id,
        userContext.cabinetId,
        userContext.userId,
        AI_MESSAGE_ROLE.Assistant,
        errorResponse.message,
        { type: 'error', error: (error as Error).message },
      );

      return errorResponse;
    }
  }

  async generateChart(
    message: string,
    conversationId: string | undefined,
    userSub: string,
  ): Promise<AiChatResponseDto> {
    this.permissionService.assertCanUseAi();

    const userContext = await this.contextService.resolveUserContext(userSub);
    const conversation = await this.auditService.getOrCreateConversation(
      conversationId,
      userContext.userId,
      userContext.cabinetId,
    );

    await this.auditService.saveMessage(
      conversation.id,
      userContext.cabinetId,
      userContext.userId,
      AI_MESSAGE_ROLE.User,
      message,
    );

    try {
      // Ask Gemini what chart to build
      const chartIntent = await this.gemini.generateStructured<{
        chartType: string;
        title: string;
        description: string;
        dataSource: string;
        insights: string[];
      }>({
        systemPrompt:
          CHART_GENERATION_PROMPT +
          '\n\nDATASOURCES DISPONIBLES: monthlyRevenue, invoicesByStatus, paymentsByMethod, topCustomers, quotesStatus, paidVsUnpaid' +
          '\n\nRetourne un JSON avec: chartType, title, description, dataSource (une des sources ci-dessus), insights (tableau de strings)',
        userMessage: message,
        parseResponse: (raw) => JSON.parse(raw),
      });

      // Validate chart type
      const allowedTypes = Object.values(AI_CHART_TYPE) as string[];
      if (!allowedTypes.includes(chartIntent.chartType)) {
        chartIntent.chartType = AI_CHART_TYPE.Bar;
      }

      // Build chart from real data
      const { echartsOption, sourceData } =
        await this.chartTools.buildChartFromData(
          chartIntent.chartType,
          chartIntent.title,
          chartIntent.dataSource,
          userContext.cabinetId,
        );

      const chart: AiChartResponseDto = {
        title: chartIntent.title,
        description: chartIntent.description,
        chartType: chartIntent.chartType,
        echartsOption,
        sourceData,
        insights: chartIntent.insights,
      };

      const response: AiChatResponseDto = {
        type: 'chart',
        message:
          chartIntent.description ??
          `Voici le graphique : ${chartIntent.title}`,
        conversationId: conversation.id,
        chart,
      };

      await this.auditService.saveMessage(
        conversation.id,
        userContext.cabinetId,
        userContext.userId,
        AI_MESSAGE_ROLE.Assistant,
        response.message,
        { type: 'chart', chartType: chartIntent.chartType },
      );

      return response;
    } catch (error) {
      this.logger.error('Chart generation error', (error as Error).stack);
      return {
        type: 'error',
        message:
          'Impossible de générer le graphique. Veuillez reformuler votre demande.',
        conversationId: conversation.id,
      };
    }
  }

  private async handleParsedResponse(
    parsed: ParsedAiResponse,
    userContext: AiUserContext,
    conversationId: string,
    originalMessage: string,
  ): Promise<AiChatResponseDto> {
    // Execute tool calls if any
    let toolResults: ToolResult[] = [];
    if (parsed.toolCalls?.length) {
      toolResults = await this.toolRegistry.executeToolCalls(
        parsed.toolCalls,
        userContext.cabinetId,
      );
    }

    // Handle supplier invoice analysis
    if (parsed.intent === AI_INTENT.ANALYZE_SUPPLIER_INVOICE) {
      return this.handleInvoiceAnalysis(parsed);
    }

    // Handle chart intent
    if (parsed.intent === AI_INTENT.GENERATE_CHART) {
      return this.generateChart(
        originalMessage,
        conversationId,
        String(userContext.userId),
      );
    }

    // Handle action intents
    if (parsed.requiresAction && parsed.requiresConfirmation) {
      return this.handleActionIntent(
        parsed,
        userContext,
        conversationId,
        originalMessage,
      );
    }

    // Handle missing fields - ask for clarification
    if (parsed.missingFields?.length) {
      return {
        type: 'clarification',
        message: parsed.userMessage,
      };
    }

    // Safeguard: if SUMMARIZE_DASHBOARD but no tool calls were made, auto-fetch KPIs
    if (
      parsed.intent === AI_INTENT.SUMMARIZE_DASHBOARD &&
      toolResults.length === 0
    ) {
      toolResults = await this.toolRegistry.executeToolCalls(
        [{ tool: 'getDashboardKpis', arguments: {} }],
        userContext.cabinetId,
      );
    }

    // Handle business Q&A with tool results
    if (toolResults.length > 0) {
      return this.handleToolResults(parsed, toolResults);
    }

    // Simple text answer
    return {
      type: 'text',
      message: parsed.userMessage,
    };
  }

  private async handleActionIntent(
    parsed: ParsedAiResponse,
    userContext: AiUserContext,
    conversationId: string,
    originalMessage: string,
  ): Promise<AiChatResponseDto> {
    // If missing fields, ask for them
    if (parsed.missingFields?.length) {
      return {
        type: 'clarification',
        message: parsed.userMessage,
      };
    }

    const args = parsed.arguments ?? {};
    const currency = (args.currency as string) || 'TND';

    // Build structured preview
    const items = Array.isArray(args.items)
      ? (args.items as Array<Record<string, unknown>>).map((item) => ({
          title: String(item.title || ''),
          description: item.description ? String(item.description) : undefined,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          currency,
          taxes: item.taxes as string[] | undefined,
          lineTotal:
            (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
        }))
      : undefined;

    const subtotal =
      items?.reduce((sum, i) => sum + (i.lineTotal ?? 0), 0) ?? 0;

    // Create pending action
    const action = await this.auditService.createPendingAction({
      userId: userContext.userId,
      cabinetId: userContext.cabinetId,
      conversationId,
      intent: parsed.intent,
      inputMessage: originalMessage,
      extractedArguments: args,
      previewPayload: {
        intent: parsed.intent,
        summary: parsed.userMessage,
        arguments: args,
      },
    });

    const actionPreview: AiActionPreviewDto = {
      actionId: action.id,
      intent: parsed.intent,
      entityType: INTENT_ENTITY_MAP[parsed.intent] ?? 'unknown',
      title: INTENT_TITLE_MAP[parsed.intent] ?? 'Action',
      description: parsed.userMessage,
      confirmationRequired: true,
      status: 'pending',
      preview: {
        customer: args.customerName
          ? {
              name: String(args.customerName),
              email: args.email ? String(args.email) : undefined,
              phone: args.phone ? String(args.phone) : undefined,
            }
          : undefined,
        document: items
          ? {
              type: INTENT_ENTITY_MAP[parsed.intent] ?? 'invoice',
              currency,
              status: 'brouillon',
            }
          : undefined,
        items,
        totals: items ? { subtotal, total: subtotal, currency } : undefined,
      },
      warnings: [],
    };

    return {
      type: 'action_preview',
      message: parsed.userMessage,
      action: actionPreview,
    };
  }

  private handleInvoiceAnalysis(parsed: ParsedAiResponse): AiChatResponseDto {
    const args = parsed.arguments ?? {};
    const supplier = args.supplier as Record<string, unknown> | undefined;
    const items = Array.isArray(args.items)
      ? (args.items as Array<Record<string, unknown>>).map((item) => ({
          title: String(item.title || ''),
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          taxRate:
            item.taxRate !== undefined ? Number(item.taxRate) : undefined,
          lineTotal: Number(item.lineTotal) || 0,
        }))
      : [];
    const totals = args.totals as Record<string, unknown> | undefined;
    const currency = (args.currency as string) || 'TND';

    return {
      type: 'invoice_analysis',
      message: parsed.userMessage,
      data: [
        {
          supplier: supplier
            ? {
                name: supplier.name || '',
                address: supplier.address || '',
                taxId: supplier.taxId || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
              }
            : undefined,
          invoiceNumber: args.invoiceNumber || '',
          date: args.date || '',
          dueDate: args.dueDate || '',
          currency,
          items,
          totals: totals
            ? {
                subtotal: Number(totals.subtotal) || 0,
                taxTotal: Number(totals.taxTotal) || 0,
                total: Number(totals.total) || 0,
              }
            : undefined,
          paymentTerms: args.paymentTerms || '',
          notes: args.notes || '',
        },
      ],
    };
  }

  private handleToolResults(
    parsed: ParsedAiResponse,
    toolResults: ToolResult[],
  ): AiChatResponseDto {
    const successResults = toolResults.filter((r) => r.success);
    if (!successResults.length) {
      return {
        type: 'text',
        message: parsed.userMessage || 'Aucune donnée disponible.',
      };
    }

    // Determine response type based on the primary tool called
    const primaryTool = successResults[0].tool;
    const primaryData = successResults[0].data;

    // Invoice list tools → table response
    if (INVOICE_LIST_TOOLS.has(primaryTool)) {
      const rows = Array.isArray(primaryData) ? primaryData : [];
      const totalAmount = rows.reduce(
        (sum, r: any) => sum + (Number(r.total) || 0),
        0,
      );
      const currency =
        rows.length > 0 ? (rows[0] as any).currency || 'TND' : 'TND';

      const table: AiTablePayloadDto = {
        columns: INVOICE_COLUMNS,
        rows,
        totals: [{ label: 'Total', value: totalAmount, currency }],
        emptyMessage: 'Aucune facture trouvée.',
      };

      return {
        type: 'table',
        message: parsed.userMessage,
        table,
      };
    }

    // KPI tools → kpi_summary response
    if (
      primaryTool === 'getInvoiceSummary' ||
      primaryTool === 'getDashboardKpis'
    ) {
      const kpis = this.buildKpisFromData(primaryTool, primaryData);
      return {
        type: 'kpi_summary',
        message: parsed.userMessage,
        kpis,
      };
    }

    // Top customers → table
    if (primaryTool === 'getTopCustomersByRevenue') {
      const rows = Array.isArray(primaryData) ? primaryData : [];
      const table: AiTablePayloadDto = {
        columns: TOP_CUSTOMERS_COLUMNS,
        rows,
      };
      return {
        type: 'table',
        message: parsed.userMessage,
        table,
      };
    }

    // Monthly revenue → table
    if (primaryTool === 'getMonthlyRevenue') {
      const rows = Array.isArray(primaryData) ? primaryData : [];
      const table: AiTablePayloadDto = {
        columns: MONTHLY_REVENUE_COLUMNS,
        rows,
      };
      return {
        type: 'table',
        message: parsed.userMessage,
        table,
      };
    }

    // Payments by method → table
    if (primaryTool === 'getPaymentsByMethod') {
      const rows = Array.isArray(primaryData) ? primaryData : [];
      const table: AiTablePayloadDto = {
        columns: PAYMENTS_BY_METHOD_COLUMNS,
        rows,
      };
      return {
        type: 'table',
        message: parsed.userMessage,
        table,
      };
    }

    // Recent payments → table
    if (primaryTool === 'getRecentPayments') {
      const rows = Array.isArray(primaryData) ? primaryData : [];
      const table: AiTablePayloadDto = {
        columns: RECENT_PAYMENTS_COLUMNS,
        rows,
      };
      return {
        type: 'table',
        message: parsed.userMessage,
        table,
      };
    }

    // Clients / Suppliers → table
    if (CLIENT_LIST_TOOLS.has(primaryTool)) {
      const rows = Array.isArray(primaryData) ? primaryData : [];
      const table: AiTablePayloadDto = {
        columns: CLIENTS_COLUMNS,
        rows,
        emptyMessage: 'Aucun client trouvé.',
      };
      return { type: 'table', message: parsed.userMessage, table };
    }

    // Articles → table
    if (ARTICLE_LIST_TOOLS.has(primaryTool)) {
      const rows = Array.isArray(primaryData) ? primaryData : [];
      const table: AiTablePayloadDto = {
        columns: ARTICLES_COLUMNS,
        rows,
        emptyMessage: 'Aucun article trouvé.',
      };
      return { type: 'table', message: parsed.userMessage, table };
    }

    // Customer orders → table
    if (primaryTool === 'getCustomerOrders') {
      const rows = Array.isArray(primaryData) ? primaryData : [];
      const table: AiTablePayloadDto = {
        columns: CUSTOMER_ORDER_COLUMNS,
        rows,
        emptyMessage: 'Aucune commande trouvée.',
      };
      return { type: 'table', message: parsed.userMessage, table };
    }

    // Delivery notes → table
    if (primaryTool === 'getDeliveryNotes') {
      const rows = Array.isArray(primaryData) ? primaryData : [];
      const table: AiTablePayloadDto = {
        columns: DELIVERY_NOTE_COLUMNS,
        rows,
        emptyMessage: 'Aucun bon de livraison trouvé.',
      };
      return { type: 'table', message: parsed.userMessage, table };
    }

    // Credit notes → table
    if (primaryTool === 'getCreditNotes') {
      const rows = Array.isArray(primaryData) ? primaryData : [];
      const table: AiTablePayloadDto = {
        columns: CREDIT_NOTE_COLUMNS,
        rows,
        emptyMessage: 'Aucune note de crédit trouvée.',
      };
      return { type: 'table', message: parsed.userMessage, table };
    }

    // Summary KPIs (clients, articles, orders, delivery, credit notes)
    if (SUMMARY_KPI_TOOLS.has(primaryTool)) {
      const kpis = this.buildKpisFromData(primaryTool, primaryData);
      return { type: 'kpi_summary', message: parsed.userMessage, kpis };
    }

    // Quotes status → kpi_summary
    if (primaryTool === 'getQuotesStatusSummary') {
      const kpis = this.buildKpisFromData(primaryTool, primaryData);
      return {
        type: 'kpi_summary',
        message: parsed.userMessage,
        kpis,
      };
    }

    // Customer balance → kpi_summary
    if (primaryTool === 'getCustomerBalance') {
      const kpis = this.buildKpisFromData(primaryTool, primaryData);
      return {
        type: 'kpi_summary',
        message: parsed.userMessage,
        kpis,
      };
    }

    // Fallback: return as text with raw data
    const allData = successResults.flatMap((r) =>
      Array.isArray(r.data) ? r.data : [r.data],
    );

    return {
      type: 'text',
      message: parsed.userMessage,
      data: allData,
    };
  }

  private buildKpisFromData(tool: string, data: unknown): AiKpiDto[] {
    if (!data || typeof data !== 'object') return [];

    const record = data as Record<string, unknown>;

    if (tool === 'getInvoiceSummary') {
      return [
        { label: 'Total factures', value: Number(record.totalInvoices) || 0 },
        { label: 'Factures payées', value: Number(record.paidCount) || 0 },
        { label: 'Factures impayées', value: Number(record.unpaidCount) || 0 },
        { label: 'En retard', value: Number(record.overdueCount) || 0 },
        {
          label: 'Montant total',
          value: Number(record.totalAmount) || 0,
          currency: 'TND',
        },
        {
          label: 'Montant payé',
          value: Number(record.paidAmount) || 0,
          currency: 'TND',
        },
      ];
    }

    if (tool === 'getDashboardKpis') {
      const kpis: AiKpiDto[] = [];
      const inv = record.invoices as Record<string, unknown> | undefined;
      const quotations = record.quotations;
      const recentRev = record.recentRevenue;

      if (inv) {
        kpis.push({
          label: 'Factures',
          value: Number(inv.total) || 0,
        });
        kpis.push({
          label: "Chiffre d'affaires",
          value: Number(inv.totalAmount) || 0,
          currency: 'TND',
        });
        kpis.push({
          label: 'Payé',
          value: Number(inv.totalPaid) || 0,
          currency: 'TND',
        });
        kpis.push({
          label: 'Impayé',
          value: Number(inv.totalRemaining) || 0,
          currency: 'TND',
        });
        if (Number(inv.overdue) > 0) {
          kpis.push({
            label: 'En retard',
            value: Number(inv.overdue) || 0,
          });
        }
      }

      if (quotations && typeof quotations === 'object') {
        const q = quotations as Record<string, unknown>;
        if (q.total !== undefined) {
          kpis.push({ label: 'Devis', value: Number(q.total) || 0 });
        }
      }

      if (Array.isArray(recentRev) && recentRev.length > 0) {
        const lastMonth = recentRev[recentRev.length - 1] as Record<
          string,
          unknown
        >;
        if (lastMonth?.total !== undefined) {
          kpis.push({
            label: 'CA du mois',
            value: Number(lastMonth.total) || 0,
            currency: 'TND',
          });
        }
      }

      return kpis;
    }

    if (tool === 'getQuotesStatusSummary') {
      if (Array.isArray(data)) {
        return (data as Array<Record<string, unknown>>).map((item) => ({
          label: String(item.status || item.label || ''),
          value: Number(item.count ?? item.value) || 0,
        }));
      }
      return Object.entries(record).map(([key, val]) => ({
        label: key,
        value: Number(val) || 0,
      }));
    }

    if (tool === 'getCustomerBalance') {
      return [
        {
          label: 'Total facturé',
          value: Number(record.totalInvoiced) || 0,
          currency: 'TND',
        },
        {
          label: 'Total payé',
          value: Number(record.totalPaid) || 0,
          currency: 'TND',
        },
        { label: 'Solde', value: Number(record.balance) || 0, currency: 'TND' },
      ];
    }

    if (tool === 'getClientsSummary') {
      return [
        { label: 'Clients', value: Number(record.totalClients) || 0 },
        { label: 'Fournisseurs', value: Number(record.totalSuppliers) || 0 },
      ];
    }

    if (tool === 'getArticleSummary') {
      return [
        { label: 'Total articles', value: Number(record.total) || 0 },
        { label: 'Produits', value: Number(record.products) || 0 },
        { label: 'Services', value: Number(record.services) || 0 },
      ];
    }

    if (
      tool === 'getCustomerOrderSummary' ||
      tool === 'getDeliveryNoteSummary' ||
      tool === 'getCreditNoteSummary'
    ) {
      const kpis: AiKpiDto[] = [
        { label: 'Total', value: Number(record.total) || 0 },
      ];
      if (record.totalAmount !== undefined) {
        kpis.push({
          label: 'Montant total',
          value: Number(record.totalAmount) || 0,
          currency: 'TND',
        });
      }
      const byStatus = record.byStatus as Record<string, number> | undefined;
      if (byStatus) {
        for (const [status, count] of Object.entries(byStatus)) {
          const shortLabel = status.includes('.')
            ? (status.split('.').pop() ?? status)
            : status;
          kpis.push({ label: shortLabel, value: Number(count) || 0 });
        }
      }
      return kpis;
    }

    return [];
  }

  private parseGeminiResponse(raw: string): ParsedAiResponse {
    try {
      const parsed = JSON.parse(raw);
      return {
        intent: parsed.intent ?? AI_INTENT.UNKNOWN_INTENT,
        confidence: parsed.confidence ?? 0.5,
        language: parsed.language ?? 'fr',
        requiresAction: parsed.requiresAction ?? false,
        requiresConfirmation: parsed.requiresConfirmation ?? false,
        toolCalls: parsed.toolCalls ?? [],
        arguments: parsed.arguments ?? {},
        missingFields: parsed.missingFields ?? [],
        userMessage: parsed.userMessage ?? "Je n'ai pas compris votre demande.",
        chartConfig: parsed.chartConfig,
      };
    } catch {
      this.logger.warn('Failed to parse Gemini response as JSON');
      return {
        intent: AI_INTENT.ANSWER_BUSINESS_QUESTION,
        confidence: 0.3,
        language: 'fr',
        requiresAction: false,
        requiresConfirmation: false,
        toolCalls: [],
        arguments: {},
        missingFields: [],
        userMessage: raw,
      };
    }
  }
}
