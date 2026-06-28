import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { AI_INTENT } from '../enums/ai-intent.enum';
import { InvoiceService } from 'src/modules/invoice/services/invoice.service';
import { QuotationService } from 'src/modules/quotation/services/quotation.service';
import { InterlocutorService } from 'src/modules/interlocutor/services/interlocutor.service';
import { FirmService } from 'src/modules/firm/services/firm.service';
import { INVOICE_STATUS } from 'src/modules/invoice/enums/invoice-status.enum';
import { QUOTATION_STATUS } from 'src/modules/quotation/enums/quotation-status.enum';
import { AiActionLogEntity } from '../entities/ai-action-log.entity';

@Injectable()
export class AiActionExecutorService {
  private readonly logger = new Logger(AiActionExecutorService.name);

  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly quotationService: QuotationService,
    private readonly interlocutorService: InterlocutorService,
    private readonly firmService: FirmService,
  ) {}

  @Transactional()
  async executeAction(
    action: AiActionLogEntity,
    userId: string,
  ): Promise<Record<string, unknown>> {
    const args = action.payloadJson ?? {};
    const cabinetId = action.cabinetId;

    switch (action.actionType) {
      case AI_INTENT.CREATE_INVOICE_DRAFT:
        return this.createInvoiceDraft(args, userId, cabinetId);
      case AI_INTENT.CREATE_QUOTE_DRAFT:
        return this.createQuoteDraft(args, userId, cabinetId);
      case AI_INTENT.CREATE_CUSTOMER:
        return this.createCustomer(args);
      case AI_INTENT.TRANSFORM_QUOTE_TO_INVOICE:
        return this.transformQuoteToInvoice(args, userId);
      default:
        throw new BadRequestException(
          `Action non supportée: ${action.actionType}`,
        );
    }
  }

  private async createInvoiceDraft(
    args: Record<string, unknown>,
    userId: string,
    cabinetId: number,
  ): Promise<Record<string, unknown>> {
    const interlocutorId = await this.resolveInterlocutorId(
      args.interlocutorId as number | undefined,
      args.customerName as string | undefined,
    );

    const firmId = await this.resolveFirmId(
      args.firmId as number | undefined,
      cabinetId,
    );

    const items = (args.items as any[]) ?? [];
    const articleEntries = this.buildArticleEntries(items);

    const invoice = await this.invoiceService.save(
      {
        status: INVOICE_STATUS.Draft,
        interlocutorId,
        firmId,
        currencyId: args.currencyId ? Number(args.currencyId) : undefined,
        bankAccountId: args.bankAccountId
          ? Number(args.bankAccountId)
          : undefined,
        discount: 0,
        discount_type: 'AMOUNT',
        date: new Date(),
        dueDate: args.dueDate
          ? new Date(args.dueDate as string)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        object: (args.object as string) ?? 'Facture créée par assistant IA',
        articleInvoiceEntries: articleEntries,
        invoiceMetaData: {
          showDeliveryAddress: true,
          showInvoiceAddress: true,
          hasBankingDetails: true,
          hasGeneralConditions: false,
          showArticleDescription: true,
        },
      } as any,
      userId,
    );

    return {
      type: 'invoice',
      id: invoice.id,
      sequential: invoice.sequential,
      total: invoice.total,
      status: invoice.status,
    };
  }

  private async createQuoteDraft(
    args: Record<string, unknown>,
    userId: string,
    cabinetId: number,
  ): Promise<Record<string, unknown>> {
    const interlocutorId = await this.resolveInterlocutorId(
      args.interlocutorId as number | undefined,
      args.customerName as string | undefined,
    );

    const firmId = await this.resolveFirmId(
      args.firmId as number | undefined,
      cabinetId,
    );

    const items = (args.items as any[]) ?? [];
    const articleEntries = this.buildArticleEntries(items);

    const quotation = await this.quotationService.save(
      {
        status: QUOTATION_STATUS.Draft,
        interlocutorId,
        firmId,
        currencyId: args.currencyId ? Number(args.currencyId) : undefined,
        bankAccountId: args.bankAccountId
          ? Number(args.bankAccountId)
          : undefined,
        discount: 0,
        discount_type: 'AMOUNT',
        date: new Date(),
        dueDate: args.dueDate
          ? new Date(args.dueDate as string)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        object: (args.object as string) ?? 'Devis créé par assistant IA',
        articleQuotationEntries: articleEntries,
        quotationMetaData: {
          showDeliveryAddress: true,
          showInvoiceAddress: true,
          hasBankingDetails: true,
          hasGeneralConditions: false,
          showArticleDescription: true,
        },
      } as any,
      userId,
    );

    return {
      type: 'quotation',
      id: quotation.id,
      sequential: quotation.sequential,
      total: quotation.total,
      status: quotation.status,
    };
  }

  private async createCustomer(
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const customer = await this.interlocutorService.save({
      surname: args.name as string,
      email: args.email as string,
      phone: args.phone as string,
    } as any);

    return {
      type: 'interlocutor',
      id: customer.id,
      name: customer.surname,
    };
  }

  private async transformQuoteToInvoice(
    args: Record<string, unknown>,
    userId: string,
  ): Promise<Record<string, unknown>> {
    const quotationId = args.quotationId as number;
    if (!quotationId) {
      throw new BadRequestException('quotationId est requis');
    }

    const invoice = await this.invoiceService.save(
      { quotationId } as any,
      userId,
    );

    return {
      type: 'invoice',
      id: invoice.id,
      sequential: invoice.sequential,
      total: invoice.total,
      fromQuotationId: quotationId,
    };
  }

  private buildArticleEntries(items: any[]) {
    return items.map((item) => ({
      ...(item.articleId
        ? { articleId: Number(item.articleId) }
        : {
            article: {
              title: String(item.title ?? item.name ?? 'Article'),
              description: item.description
                ? String(item.description)
                : undefined,
            },
          }),
      quantity: Number(item.quantity) || 1,
      unit_price:
        Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0) || 0,
      discount: Number(item.discount) || 0,
      discount_type: item.discountType ?? item.discount_type ?? 'AMOUNT',
    }));
  }

  private async resolveFirmId(
    firmId?: number,
    cabinetId?: number,
  ): Promise<number> {
    if (firmId) return firmId;

    if (cabinetId) {
      // Find the first firm in the user's cabinet
      const firms = await this.firmService.findOneByCondition({
        filter: `cabinetId||$eq||${cabinetId}`,
      });
      if (firms) return firms.id;
    }

    throw new BadRequestException(
      'Aucune entreprise trouvée. Veuillez configurer une entreprise dans votre cabinet.',
    );
  }

  private async resolveInterlocutorId(
    interlocutorId?: number,
    customerName?: string,
  ): Promise<number> {
    if (interlocutorId) return interlocutorId;

    if (customerName) {
      this.logger.debug(`Searching interlocutor by name: "${customerName}"`);

      // 1. Search both name and surname fields using OR (contains)
      const found = await this.interlocutorService.findOneByCondition({
        filter: `surname||$cont||${customerName}||$or||name||$cont||${customerName}`,
      });
      if (found) return found.id;

      // 2. If full name, try splitting and searching parts individually
      const nameParts = customerName.trim().split(/\s+/);
      if (nameParts.length > 1) {
        for (const part of nameParts) {
          if (part.length < 2) continue;
          const partial = await this.interlocutorService.findOneByCondition({
            filter: `surname||$cont||${part}||$or||name||$cont||${part}`,
          });
          if (partial) {
            this.logger.debug(
              `Found interlocutor by partial name "${part}": id=${partial.id}`,
            );
            return partial.id;
          }
        }
      }

      this.logger.warn(`No interlocutor found for name: "${customerName}"`);
    }

    throw new BadRequestException(
      `Client non trouvé${customerName ? ` pour "${customerName}"` : ''}. Veuillez préciser l'ID du client ou vérifier le nom.`,
    );
  }
}
