import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  StreamableFile,
} from '@nestjs/common';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { CurrencyService } from 'src/modules/currency/services/currency.service';
import { FirmService } from 'src/modules/firm/services/firm.service';
import { InterlocutorService } from 'src/modules/interlocutor/services/interlocutor.service';
import { InvoicingCalculationsService } from 'src/shared/calculations/services/invoicing.calculations.service';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { DocumentTemplateRendererService } from 'src/modules/document-template/services/document-template-renderer.service';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from 'src/modules/document-template/enums/document-template-document-type.enum';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { BankAccountService } from 'src/modules/bank-account/services/bank-account.service';
import { Transactional } from '@nestjs-cls/transactional';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { ArticleInvoiceEntryService } from './article-invoice-entry.service';
import { InvoiceStorageService } from './invoice-upload.service';
import { InvoiceMetaDataService } from './invoice-meta-data.service';
import { InvoiceSequenceService } from './invoice-sequence.service';
import { InvoiceNotFoundException } from '../errors/invoice.notfound.error';
import { InvoiceEntity } from '../entities/invoice.entity';
import { ResponseInvoiceDto } from '../dtos/invoice.response.dto';
import { CreateInvoiceDto } from '../dtos/invoice.create.dto';
import { UpdateInvoiceDto } from '../dtos/invoice.update.dto';
import { ArticleInvoiceEntryEntity } from '../entities/article-invoice-entry.entity';
import { DuplicateInvoiceDto } from '../dtos/invoice.duplicate.dto';
import { INVOICE_STATUS } from '../enums/invoice-status.enum';
import { UpdateInvoiceSequenceDto } from '../dtos/invoice-seqence.update.dto';
import { InvoiceSequence } from '../interfaces/invoice-sequence.interface';
import { QuotationEntity } from 'src/modules/quotation/entities/quotation.entity';
import { DeliveryNoteEntity } from 'src/modules/delivery-note/entities/delivery-note.entity';
import { GoodsIssueNoteEntity } from 'src/modules/goods-issue-note/entities/goods-issue-note.entity';
import { CustomerOrderEntity } from 'src/modules/customer-order/entities/customer-order.entity';
import { ReturnNoteEntity } from 'src/modules/return-note/entities/return-note.entity';
import { TaxWithholdingService } from 'src/modules/tax-withholding/services/tax-withholding.service';
import { ciel } from 'src/utils/number.utils';
import { findSequentialNeighbors } from 'src/modules/sequence/utils/sequence.utils';
import { ResponseInvoiceRangeDto } from '../dtos/invoice-range.response.dto';
import { InvoiceStorageEntity } from '../entities/invoice-file.entity';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { FIRM_ENTITY_TYPE } from 'src/modules/firm/enums/firm-entity-type.enum';
import { QuotationService } from 'src/modules/quotation/services/quotation.service';
import { CustomerOrderLifecycleService } from 'src/modules/customer-order/services/customer-order-lifecycle.service';
import { CABINET_INVOICE_DISPLAY_TYPE } from 'src/modules/cabinet/enums/cabinet-invoice-display-type.enum';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { ArticleService } from 'src/modules/article/services/article.service';
import { MailService } from 'src/shared/mail/services/mail.service';
import { SendInvoiceEmailDto } from '../dtos/invoice-send-email.dto';

interface SaveInvoiceOptions {
  autoReferenceFromSequential?: boolean;
}

@Injectable()
export class InvoiceService {
  constructor(
    //repositories
    private readonly invoiceRepository: InvoiceRepository,
    //entity services
    private readonly articleInvoiceEntryService: ArticleInvoiceEntryService,
    private readonly articleService: ArticleService,
    private readonly invoiceStorageService: InvoiceStorageService,
    private readonly bankAccountService: BankAccountService,
    private readonly currencyService: CurrencyService,
    private readonly firmService: FirmService,
    private readonly interlocutorService: InterlocutorService,
    private readonly invoiceSequenceService: InvoiceSequenceService,
    private readonly invoiceMetaDataService: InvoiceMetaDataService,
    private readonly taxService: TaxService,
    private readonly taxWithholdingService: TaxWithholdingService,

    //abstract services
    private readonly calculationsService: InvoicingCalculationsService,
    @Inject(forwardRef(() => DocumentTemplateRendererService))
    private readonly rendererService: DocumentTemplateRendererService,

    @Inject(forwardRef(() => QuotationService))
    private readonly quotationService: QuotationService,

    private readonly customerOrderLifecycleService: CustomerOrderLifecycleService,
    private readonly tenantContextService: TenantContextService,
    private readonly mailService: MailService,
  ) {}

  private async getCabinetIdForUser(
    userId?: string,
  ): Promise<number | undefined> {
    return userId
      ? await this.tenantContextService.getCurrentCabinetIdOrFail(userId)
      : undefined;
  }

  private async scopeQueryForUser(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<IQueryObject> {
    const cabinetId = await this.getCabinetIdForUser(userId);
    return cabinetId
      ? this.tenantContextService.scopeQueryToCabinet(query, cabinetId)
      : { ...query };
  }

  private normalizeActivityType(activityType?: ACTIVITY_TYPE): ACTIVITY_TYPE {
    return activityType === ACTIVITY_TYPE.BUYING
      ? ACTIVITY_TYPE.BUYING
      : ACTIVITY_TYPE.SELLING;
  }

  private normalizeReference(reference?: string | null): string | null {
    const normalizedReference = reference?.trim();
    return normalizedReference ? normalizedReference : null;
  }

  private normalizeSellingInvoiceStatus(
    activityType: ACTIVITY_TYPE,
    status?: INVOICE_STATUS | null,
  ): INVOICE_STATUS | null | undefined {
    if (!status || activityType !== ACTIVITY_TYPE.SELLING) {
      return status;
    }

    if (
      [
        INVOICE_STATUS.Validated,
        INVOICE_STATUS.Sent,
        INVOICE_STATUS.Expired,
      ].includes(status)
    ) {
      return INVOICE_STATUS.Unpaid;
    }

    return status;
  }

  private normalizeSellingInvoiceEntity<T extends InvoiceEntity | null>(
    invoice: T,
  ): T {
    if (!invoice) {
      return invoice;
    }

    invoice.status =
      this.normalizeSellingInvoiceStatus(
        invoice.activityType,
        invoice.status,
      ) ?? invoice.status;

    return invoice;
  }

  private normalizeSellingInvoiceEntities(
    invoices: InvoiceEntity[],
  ): InvoiceEntity[] {
    return invoices.map((invoice) =>
      this.normalizeSellingInvoiceEntity(invoice),
    );
  }

  private normalizeSellingInvoiceQuery(query: IQueryObject): IQueryObject {
    if (
      !query.filter?.includes(`activityType||$eq||${ACTIVITY_TYPE.SELLING}`) ||
      !query.filter.includes(`status||$eq||${INVOICE_STATUS.Unpaid}`)
    ) {
      return query;
    }

    return {
      ...query,
      filter: query.filter.replace(
        `status||$eq||${INVOICE_STATUS.Unpaid}`,
        `status||$in||${[
          INVOICE_STATUS.Unpaid,
          INVOICE_STATUS.Validated,
          INVOICE_STATUS.Sent,
          INVOICE_STATUS.Expired,
        ].join(',')}`,
      ),
    };
  }

  private isSellingHonoraryDisplay(
    invoice: Pick<InvoiceEntity, 'activityType' | 'cabinet'>,
  ): boolean {
    return (
      this.normalizeActivityType(invoice.activityType) ===
        ACTIVITY_TYPE.SELLING &&
      invoice.cabinet?.invoiceDisplayType ===
        CABINET_INVOICE_DISPLAY_TYPE.HONORARY_NOTE
    );
  }

  private getInvoiceDocumentTypeLabel(
    invoice: Pick<InvoiceEntity, 'activityType' | 'cabinet'>,
  ): string {
    return this.isSellingHonoraryDisplay(invoice)
      ? "NOTE D'HONORAIRES"
      : 'FACTURE';
  }

  private sanitizeDownloadSegment(value: string): string {
    const sanitized = value
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return sanitized || 'document';
  }

  private getInvoiceDownloadFilename(
    invoice: Pick<InvoiceEntity, 'activityType' | 'cabinet'>,
    visibleSequential: string,
  ): string {
    if (
      this.normalizeActivityType(invoice.activityType) === ACTIVITY_TYPE.BUYING
    ) {
      return `invoice-${this.sanitizeDownloadSegment(visibleSequential)}.pdf`;
    }

    const documentSlug = this.isSellingHonoraryDisplay(invoice)
      ? 'note-honoraires'
      : 'facture';

    return `${documentSlug}-${this.sanitizeDownloadSegment(visibleSequential)}.pdf`;
  }

  private assertBuyingReference(
    activityType: ACTIVITY_TYPE,
    reference: string | null,
  ) {
    if (activityType === ACTIVITY_TYPE.BUYING && !reference) {
      throw new BadRequestException(
        "La référence de la facture d'achat est obligatoire",
      );
    }
  }

  private assertFirmEntityType(
    activityType: ACTIVITY_TYPE,
    entityType?: FIRM_ENTITY_TYPE | null,
  ) {
    const expectedEntityType =
      activityType === ACTIVITY_TYPE.BUYING
        ? FIRM_ENTITY_TYPE.SUPPLIERS
        : FIRM_ENTITY_TYPE.CLIENTS;

    if ((entityType ?? FIRM_ENTITY_TYPE.CLIENTS) !== expectedEntityType) {
      throw new BadRequestException(
        activityType === ACTIVITY_TYPE.BUYING
          ? 'Les factures d’achat doivent être liées à un fournisseur.'
          : 'Les factures de vente doivent être liées à un client.',
      );
    }
  }

  private assertCustomerOrderHasArticleEntries(
    customerOrder: Pick<CustomerOrderEntity, 'articleCustomerOrderEntries'>,
  ) {
    if ((customerOrder.articleCustomerOrderEntries?.length ?? 0) === 0) {
      throw new BadRequestException(
        'customerOrder.errors.missing_article_entries',
      );
    }
  }

  private assertDeliveryNoteHasArticleEntries(
    deliveryNote: Pick<DeliveryNoteEntity, 'articleDeliveryNoteEntries'>,
  ) {
    if ((deliveryNote.articleDeliveryNoteEntries?.length ?? 0) === 0) {
      throw new BadRequestException(
        'deliveryNote.errors.missing_article_entries',
      );
    }
  }

  private async resolveBankAccount(
    bankAccountId?: number | null,
    cabinetId?: number,
  ): Promise<{ id: number } | null> {
    if (bankAccountId) {
      return cabinetId
        ? this.bankAccountService.findOneByIdInCabinet(bankAccountId, cabinetId)
        : this.bankAccountService.findOneById(bankAccountId);
    }

    return this.bankAccountService.findMainAccount(cabinetId);
  }

  async downloadPdf(
    id: number,
    template: string,
    userId?: string,
  ): Promise<StreamableFile> {
    const { filename, pdfBuffer } = await this.generateInvoicePdf(
      id,
      template,
      userId,
    );

    return new StreamableFile(new Uint8Array(pdfBuffer), {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  private async generateInvoicePdf(
    id: number,
    template: string,
    userId?: string,
  ): Promise<{ filename: string; pdfBuffer: Buffer | Uint8Array }> {
    const invoice = await this.findOneById(id, userId);
    if (!invoice) {
      throw new InvoiceNotFoundException();
    }

    const visibleSequential =
      this.normalizeActivityType(invoice.activityType) === ACTIVITY_TYPE.BUYING
        ? invoice.reference || invoice.sequential
        : invoice.sequential;
    const downloadFilename = this.getInvoiceDownloadFilename(
      invoice,
      visibleSequential,
    );

    const templateId = Number(template);
    const pdfBuffer = await this.rendererService.generateDocument(
      {
        documentId: id,
        documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.INVOICE,
        templateId: Number.isNaN(templateId) ? undefined : templateId,
      },
      userId,
    );

    return { filename: downloadFilename, pdfBuffer };
  }

  async sendEmail(
    id: number,
    payload: SendInvoiceEmailDto,
    userId?: string,
  ): Promise<{ success: boolean }> {
    const { filename, pdfBuffer } = await this.generateInvoicePdf(
      id,
      payload.template || 'template1',
      userId,
    );
    const html = payload.message.replace(/\n/g, '<br />');

    await this.mailService.sendMailWithAttachments(
      payload.to,
      payload.subject,
      html,
      payload.message,
      payload.cc,
      [
        {
          filename,
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf',
        },
      ],
    );

    return { success: true };
  }

  async findOneById(id: number, userId?: string): Promise<InvoiceEntity> {
    const invoice = userId
      ? await this.findOneByCondition({ filter: `id||$eq||${id}` }, userId)
      : await this.invoiceRepository.findOneById(id);
    if (!invoice) {
      throw new InvoiceNotFoundException();
    }
    return this.normalizeSellingInvoiceEntity(invoice as InvoiceEntity);
  }

  async findOneByCondition(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<InvoiceEntity | null> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(
      this.normalizeSellingInvoiceQuery(scopedQuery),
    );
    const invoice = await this.invoiceRepository.findOne(
      queryOptions as FindOneOptions<InvoiceEntity>,
    );
    if (!invoice) return null;
    return this.normalizeSellingInvoiceEntity(invoice);
  }

  async findAll(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<InvoiceEntity[]> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(
      this.normalizeSellingInvoiceQuery(scopedQuery),
    );
    const invoices = await this.invoiceRepository.findAll(
      queryOptions as FindManyOptions<InvoiceEntity>,
    );
    return this.normalizeSellingInvoiceEntities(invoices);
  }

  async findAllPaginated(
    query: IQueryObject,
    userId?: string,
  ): Promise<PageDto<ResponseInvoiceDto>> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const normalizedQuery = this.normalizeSellingInvoiceQuery(scopedQuery);
    const queryOptions = queryBuilder.build(normalizedQuery);
    const count = await this.invoiceRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.invoiceRepository.findAll(
      queryOptions as FindManyOptions<InvoiceEntity>,
    );

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: {
        page: parseInt(query.page),
        take: parseInt(query.limit),
      },
      itemCount: count,
    });

    return new PageDto(
      this.normalizeSellingInvoiceEntities(entities),
      pageMetaDto,
    );
  }

  async findInvoicesByRange(
    id: number,
    userId?: string,
  ): Promise<ResponseInvoiceRangeDto> {
    const invoice = await this.findOneById(id, userId);
    const activityType = this.normalizeActivityType(invoice.activityType);
    const invoices = await this.findAll(
      { filter: `activityType||$eq||${activityType}` },
      userId,
    );

    return findSequentialNeighbors(invoice, invoices);
  }

  @Transactional()
  async save(
    createInvoiceDto: CreateInvoiceDto,
    userIdOrOptions?: string | SaveInvoiceOptions,
    options: SaveInvoiceOptions = {},
  ): Promise<InvoiceEntity> {
    const userId =
      typeof userIdOrOptions === 'string' ? userIdOrOptions : undefined;
    const saveOptions =
      typeof userIdOrOptions === 'object' ? userIdOrOptions : options;
    const cabinetId =
      (await this.getCabinetIdForUser(userId)) ??
      (createInvoiceDto as CreateInvoiceDto & { cabinetId?: number }).cabinetId;
    const activityType = this.normalizeActivityType(
      createInvoiceDto.activityType,
    );
    const status =
      this.normalizeSellingInvoiceStatus(
        activityType,
        createInvoiceDto.status,
      ) ?? createInvoiceDto.status;
    const reference = this.normalizeReference(createInvoiceDto.reference);
    const shouldAutoReferenceFromSequential =
      activityType === ACTIVITY_TYPE.BUYING &&
      saveOptions.autoReferenceFromSequential;

    if (!shouldAutoReferenceFromSequential) {
      this.assertBuyingReference(activityType, reference);
    }

    // Parallelize fetching firm, bank account, and currency, as they are independent
    const [firm, bankAccount, currency] = await Promise.all([
      cabinetId
        ? this.firmService.findOneByIdInCabinet(
            createInvoiceDto.firmId,
            cabinetId,
          )
        : this.firmService.findOneByCondition({
            filter: `id||$eq||${createInvoiceDto.firmId}`,
          }),
      this.resolveBankAccount(createInvoiceDto.bankAccountId, cabinetId),
      createInvoiceDto.currencyId
        ? this.currencyService.findOneById(createInvoiceDto.currencyId)
        : Promise.resolve(null),
    ]);

    if (!firm) {
      throw new Error('Firm not found');
    }

    this.assertFirmEntityType(activityType, firm.entityType);

    if (!bankAccount) {
      throw new BadRequestException(
        'Aucun compte bancaire principal n’est configuré.',
      );
    }

    // Check interlocutor existence
    await this.interlocutorService.findOneById(createInvoiceDto.interlocutorId);

    // Save article entries if provided
    await this.articleService.assertArticlesBelongToCabinet(
      (createInvoiceDto.articleInvoiceEntries ?? []).map(
        (entry) => entry.articleId,
      ),
      cabinetId,
    );
    const articleEntries =
      createInvoiceDto.articleInvoiceEntries &&
      (await this.articleInvoiceEntryService.saveMany(
        createInvoiceDto.articleInvoiceEntries,
        cabinetId,
      ));

    if (!articleEntries?.length) {
      throw new BadRequestException(
        'Ajoutez au moins un article à la facture.',
      );
    }

    // Calculate financial information
    const { subTotal, total } =
      this.calculationsService.calculateLineItemsTotal(
        articleEntries.map((entry) => entry.total),
        articleEntries.map((entry) => entry.subTotal),
      );

    // Fetch tax stamp if provided
    const taxStamp = createInvoiceDto.taxStampId
      ? await this.taxService.findOneAuthorizedForCabinet(
          createInvoiceDto.taxStampId,
          cabinetId,
          true,
        )
      : null;

    // Apply general discount
    const totalAfterGeneralDiscount =
      this.calculationsService.calculateTotalDiscount(
        total,
        createInvoiceDto.discount,
        createInvoiceDto.discount_type,
        taxStamp?.value || 0,
      );

    // Format articleEntries as lineItems for tax calculations
    const lineItems = await this.articleInvoiceEntryService.findManyAsLineItem(
      articleEntries.map((entry) => entry.id),
    );

    // Calculate tax summary and fetch tax details in parallel
    const taxSummary = await Promise.all(
      this.calculationsService
        .calculateTaxSummary(lineItems)
        .map(async (item) => {
          const tax = await this.taxService.findOneAuthorizedForCabinet(
            item.taxId,
            cabinetId,
            true,
          );

          return {
            ...item,
            label: tax.label,
            // If the tax is a rate (percentage), multiply by 100 for percentage display,
            // otherwise use the fixed amount directly.
            value: tax.isRate ? tax.value * 100 : tax.value,
            isRate: tax.isRate, // You can also return this flag for further use.
          };
        }),
    );

    // Fetch the latest sequential number for invoice
    const sequential =
      await this.invoiceSequenceService.getSequential(activityType);
    const resolvedReference =
      reference ?? (shouldAutoReferenceFromSequential ? sequential : null);
    this.assertBuyingReference(activityType, resolvedReference);

    // Save invoice metadata
    const invoiceMetaData = await this.invoiceMetaDataService.save({
      ...createInvoiceDto.invoiceMetaData,
      taxSummary,
    });

    // Ensure taxWithholding.rate is valid and calculate the withholding amount
    let taxWithholdingAmount = 0;
    if (createInvoiceDto.taxWithholdingId) {
      const taxWithholding = await this.taxWithholdingService.findOneById(
        createInvoiceDto.taxWithholdingId,
      );

      if (taxWithholding.rate !== undefined && taxWithholding.rate !== null) {
        taxWithholdingAmount =
          totalAfterGeneralDiscount * (taxWithholding.rate / 100);
      }
    }

    // Save the invoice entity
    const invoice = await this.invoiceRepository.save({
      ...createInvoiceDto,
      activityType,
      status,
      amountSettled: 0,
      bankAccountId: bankAccount.id,
      currencyId: currency ? currency.id : firm.currencyId,
      cabinetId,
      sequential,
      reference: resolvedReference,
      articleInvoiceEntries: articleEntries,
      invoiceMetaData,
      subTotal,
      taxWithholdingAmount: taxWithholdingAmount || 0,
      total: totalAfterGeneralDiscount,
    });

    // Handle file uploads if they exist
    if (createInvoiceDto.uploads) {
      await Promise.all(
        createInvoiceDto.uploads.map((u) =>
          this.invoiceStorageService.save(invoice.id, u.uploadId),
        ),
      );
    }

    return this.normalizeSellingInvoiceEntity(invoice);
  }

  async saveMany(
    createInvoiceDtos: CreateInvoiceDto[],
  ): Promise<InvoiceEntity[]> {
    const invoices = [];
    for (const createInvoiceDto of createInvoiceDtos) {
      const invoice = await this.save(createInvoiceDto);
      invoices.push(invoice);
    }
    return invoices;
  }

  @Transactional()
  async saveFromQuotation(quotation: QuotationEntity): Promise<InvoiceEntity> {
    const activityType = this.normalizeActivityType(quotation.activityType);
    if (activityType === ACTIVITY_TYPE.BUYING) {
      throw new BadRequestException(
        "La transformation automatique d'un devis d'achat en facture est désactivée",
      );
    }

    return this.save({
      activityType,
      quotationId: quotation.id,
      cabinetId: quotation.cabinetId,
      currencyId: quotation.currencyId,
      bankAccountId: quotation.bankAccountId,
      interlocutorId: quotation.interlocutorId,
      firmId: quotation.firmId,
      discount: quotation.discount,
      discount_type: quotation.discount_type,
      object: quotation.object,
      status: INVOICE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleInvoiceEntries: quotation.articleQuotationEntries.map((entry) => {
        return {
          unit_price: entry.unit_price,
          quantity: entry.quantity,
          discount: entry.discount,
          discount_type: entry.discount_type,
          subTotal: entry.subTotal,
          total: entry.total,
          articleId: entry.article.id,
          article: entry.article,
          taxes: entry.articleQuotationEntryTaxes.map((entry) => {
            return entry.taxId;
          }),
        };
      }),
    });
  }

  @Transactional()
  async saveFromCustomerOrder(
    customerOrder: CustomerOrderEntity,
  ): Promise<InvoiceEntity> {
    const activityType = this.normalizeActivityType(customerOrder.activityType);
    this.assertCustomerOrderHasArticleEntries(customerOrder);

    return this.save(
      {
        activityType,
        customerOrderId: customerOrder.id,
        cabinetId: customerOrder.cabinetId,
        currencyId: customerOrder.currencyId,
        bankAccountId: customerOrder.bankAccountId,
        interlocutorId: customerOrder.interlocutorId,
        firmId: customerOrder.firmId,
        discount: customerOrder.discount,
        discount_type: customerOrder.discount_type,
        object: customerOrder.object,
        status: INVOICE_STATUS.Draft,
        date: new Date(),
        dueDate: null,
        articleInvoiceEntries: customerOrder.articleCustomerOrderEntries.map(
          (entry) => ({
            unit_price: entry.unit_price,
            quantity: entry.quantity,
            discount: entry.discount,
            discount_type: entry.discount_type,
            subTotal: entry.subTotal,
            total: entry.total,
            articleId: entry.article.id,
            article: entry.article,
            taxes: entry.articleCustomerOrderEntryTaxes.map((entry) => {
              return entry.taxId;
            }),
          }),
        ),
      },
      {
        autoReferenceFromSequential: activityType === ACTIVITY_TYPE.BUYING,
      },
    );
  }

  @Transactional()
  async saveFromCustomerOrderAndValidate(
    customerOrder: CustomerOrderEntity,
  ): Promise<InvoiceEntity> {
    this.customerOrderLifecycleService.assertCanTransformToInvoice(
      customerOrder,
    );
    this.assertCustomerOrderHasArticleEntries(customerOrder);
    const activityType = this.normalizeActivityType(customerOrder.activityType);
    const invoice = await this.save(
      {
        activityType,
        customerOrderId: customerOrder.id,
        cabinetId: customerOrder.cabinetId,
        currencyId: customerOrder.currencyId,
        bankAccountId: customerOrder.bankAccountId,
        interlocutorId: customerOrder.interlocutorId,
        firmId: customerOrder.firmId,
        discount: customerOrder.discount,
        discount_type: customerOrder.discount_type,
        object: customerOrder.object,
        status: INVOICE_STATUS.Unpaid,
        date: new Date(),
        dueDate: null,
        articleInvoiceEntries: customerOrder.articleCustomerOrderEntries.map(
          (entry) => ({
            unit_price: entry.unit_price,
            quantity: entry.quantity,
            discount: entry.discount,
            discount_type: entry.discount_type,
            subTotal: entry.subTotal,
            total: entry.total,
            articleId: entry.article.id,
            article: entry.article,
            taxes: entry.articleCustomerOrderEntryTaxes.map((entry) => {
              return entry.taxId;
            }),
          }),
        ),
      },
      {
        autoReferenceFromSequential: activityType === ACTIVITY_TYPE.BUYING,
      },
    );
    await this.customerOrderLifecycleService.markValidatedByTransformation(
      customerOrder.id,
    );
    return invoice;
  }

  @Transactional()
  async saveFromDeliveryNote(
    deliveryNote: DeliveryNoteEntity,
  ): Promise<InvoiceEntity> {
    const activityType = this.normalizeActivityType(deliveryNote.activityType);
    this.assertDeliveryNoteHasArticleEntries(deliveryNote);

    return this.save(
      {
        activityType,
        deliveryNoteId: deliveryNote.id,
        cabinetId: deliveryNote.cabinetId,
        customerOrderId: deliveryNote.customerOrderId ?? null,
        currencyId: deliveryNote.currencyId,
        bankAccountId: deliveryNote.bankAccountId,
        interlocutorId: deliveryNote.interlocutorId,
        firmId: deliveryNote.firmId,
        discount: deliveryNote.discount,
        discount_type: deliveryNote.discount_type,
        object: deliveryNote.object,
        status: INVOICE_STATUS.Draft,
        date: new Date(),
        dueDate: null,
        articleInvoiceEntries: deliveryNote.articleDeliveryNoteEntries.map(
          (entry) => ({
            unit_price: entry.unit_price,
            quantity: entry.quantity,
            discount: entry.discount,
            discount_type: entry.discount_type,
            subTotal: entry.subTotal,
            total: entry.total,
            articleId: entry.article.id,
            article: entry.article,
            taxes: entry.articleDeliveryNoteEntryTaxes.map(
              (taxEntry) => taxEntry.taxId,
            ),
          }),
        ),
      },
      {
        autoReferenceFromSequential: activityType === ACTIVITY_TYPE.BUYING,
      },
    );
  }

  @Transactional()
  async saveFromGoodsIssueNote(
    goodsIssueNote: GoodsIssueNoteEntity,
  ): Promise<InvoiceEntity> {
    const activityType = this.normalizeActivityType(
      goodsIssueNote.activityType,
    );
    if (activityType === ACTIVITY_TYPE.BUYING) {
      throw new BadRequestException(
        "La transformation automatique d'un bon de sortie d'achat en facture est désactivée",
      );
    }

    return this.save({
      activityType,
      goodsIssueNoteId: goodsIssueNote.id,
      cabinetId: goodsIssueNote.cabinetId,
      currencyId: goodsIssueNote.currencyId,
      bankAccountId: goodsIssueNote.bankAccountId,
      interlocutorId: goodsIssueNote.interlocutorId,
      firmId: goodsIssueNote.firmId,
      discount: goodsIssueNote.discount,
      discount_type: goodsIssueNote.discount_type,
      object: goodsIssueNote.object,
      status: INVOICE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleInvoiceEntries: goodsIssueNote.articleGoodsIssueNoteEntries.map(
        (entry) => ({
          unit_price: entry.unit_price,
          quantity: entry.quantity,
          discount: entry.discount,
          discount_type: entry.discount_type,
          subTotal: entry.subTotal,
          total: entry.total,
          articleId: entry.article.id,
          article: entry.article,
          taxes: entry.articleGoodsIssueNoteEntryTaxes.map(
            (taxEntry) => taxEntry.taxId,
          ),
        }),
      ),
    });
  }

  @Transactional()
  async saveFromReturnNote(
    returnNote: ReturnNoteEntity,
  ): Promise<InvoiceEntity> {
    const activityType = this.normalizeActivityType(returnNote.activityType);
    if (activityType === ACTIVITY_TYPE.BUYING) {
      throw new BadRequestException(
        "La transformation automatique d'un bon de retour d'achat en facture est désactivée",
      );
    }

    return this.save({
      activityType,
      returnNoteId: returnNote.id,
      cabinetId: returnNote.cabinetId,
      currencyId: returnNote.currencyId,
      bankAccountId: returnNote.bankAccountId,
      interlocutorId: returnNote.interlocutorId,
      firmId: returnNote.firmId,
      discount: returnNote.discount,
      discount_type: returnNote.discount_type,
      object: returnNote.object,
      status: INVOICE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleInvoiceEntries: returnNote.articleReturnNoteEntries.map(
        (entry) => ({
          unit_price: entry.unit_price,
          quantity: entry.quantity,
          discount: entry.discount,
          discount_type: entry.discount_type,
          subTotal: entry.subTotal,
          total: entry.total,
          articleId: entry.article.id,
          article: entry.article,
          taxes: entry.articleReturnNoteEntryTaxes.map(
            (taxEntry) => taxEntry.taxId,
          ),
        }),
      ),
    });
  }

  @Transactional()
  async update(
    id: number,
    updateInvoiceDto: UpdateInvoiceDto,
    userId?: string,
  ): Promise<InvoiceEntity> {
    // Retrieve the existing invoice with necessary relations
    const existingInvoiceWithUploads = await this.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'articleInvoiceEntries,invoiceMetaData,uploads,taxWithholding',
      },
      userId,
    );

    if (!existingInvoiceWithUploads) {
      throw new InvoiceNotFoundException();
    }

    const { uploads: existingUploads, ...existingInvoice } =
      existingInvoiceWithUploads;
    const cabinetId = existingInvoice.cabinetId;

    const activityType = this.normalizeActivityType(
      updateInvoiceDto.activityType ?? existingInvoice.activityType,
    );
    const status =
      this.normalizeSellingInvoiceStatus(
        activityType,
        updateInvoiceDto.status,
      ) ??
      this.normalizeSellingInvoiceStatus(
        activityType,
        existingInvoice.status,
      ) ??
      existingInvoice.status;
    const reference = this.normalizeReference(
      updateInvoiceDto.reference ?? existingInvoice.reference,
    );
    this.assertBuyingReference(activityType, reference);

    // Fetch and validate related entities
    const [firm, bankAccount, currency, interlocutor] = await Promise.all([
      this.firmService.findOneByIdInCabinet(
        updateInvoiceDto.firmId ?? existingInvoice.firmId,
        cabinetId,
      ),
      this.resolveBankAccount(
        updateInvoiceDto.bankAccountId ?? existingInvoice.bankAccountId,
        cabinetId,
      ),
      updateInvoiceDto.currencyId
        ? this.currencyService.findOneById(updateInvoiceDto.currencyId)
        : null,
      updateInvoiceDto.interlocutorId
        ? this.interlocutorService.findOneById(updateInvoiceDto.interlocutorId)
        : null,
    ]);

    if (firm) {
      this.assertFirmEntityType(activityType, firm.entityType);
    }

    if (!bankAccount) {
      throw new BadRequestException(
        'Aucun compte bancaire principal n’est configuré.',
      );
    }

    // Soft delete old article entries to prepare for new ones
    const existingArticles =
      await this.articleInvoiceEntryService.softDeleteMany(
        existingInvoice.articleInvoiceEntries.map((entry) => entry.id),
      );

    // Save new article entries
    const articleEntries: ArticleInvoiceEntryEntity[] =
      updateInvoiceDto.articleInvoiceEntries
        ? (await this.articleService.assertArticlesBelongToCabinet(
            updateInvoiceDto.articleInvoiceEntries.map(
              (entry) => entry.articleId,
            ),
            cabinetId,
          ),
          await this.articleInvoiceEntryService.saveMany(
            updateInvoiceDto.articleInvoiceEntries,
            cabinetId,
          ))
        : existingArticles;

    // Calculate the subtotal and total for the new entries
    const { subTotal, total } =
      this.calculationsService.calculateLineItemsTotal(
        articleEntries.map((entry) => entry.total),
        articleEntries.map((entry) => entry.subTotal),
      );

    // Fetch tax stamp if provided
    const taxStamp = updateInvoiceDto.taxStampId
      ? await this.taxService.findOneAuthorizedForCabinet(
          updateInvoiceDto.taxStampId,
          cabinetId,
          true,
        )
      : null;

    // Apply general discount
    const totalAfterGeneralDiscount =
      this.calculationsService.calculateTotalDiscount(
        total,
        updateInvoiceDto.discount,
        updateInvoiceDto.discount_type,
        taxStamp?.value || 0,
      );

    // Convert article entries to line items for further calculations
    const lineItems = await this.articleInvoiceEntryService.findManyAsLineItem(
      articleEntries.map((entry) => entry.id),
    );

    // Calculate tax summary (handle both percentage and fixed taxes)
    const taxSummary = await Promise.all(
      this.calculationsService
        .calculateTaxSummary(lineItems)
        .map(async (item) => {
          const tax = await this.taxService.findOneAuthorizedForCabinet(
            item.taxId,
            cabinetId,
            true,
          );

          return {
            ...item,
            label: tax.label,
            // Check if the tax is rate-based or a fixed amount
            rate: tax.isRate ? tax.value * 100 : tax.value, // handle both types
            isRate: tax.isRate,
          };
        }),
    );

    // Save or update the invoice metadata with the updated tax summary
    const invoiceMetaData = await this.invoiceMetaDataService.save({
      ...existingInvoice.invoiceMetaData,
      ...updateInvoiceDto.invoiceMetaData,
      taxSummary,
    });

    // Ensure taxWithholding.rate is valid and calculate the withholding amount
    let taxWithholdingAmount = 0;
    if (updateInvoiceDto.taxWithholdingId) {
      const taxWithholding = await this.taxWithholdingService.findOneById(
        updateInvoiceDto.taxWithholdingId,
      );

      if (taxWithholding.rate !== undefined && taxWithholding.rate !== null) {
        taxWithholdingAmount = ciel(
          totalAfterGeneralDiscount * (taxWithholding.rate / 100),
          currency.digitAfterComma + 1,
        );
      }
    }

    // Handle uploads - identify existing records and prepare new ones
    const updatedUploads = await Promise.all(
      updateInvoiceDto.uploads.map(async (u) => {
        // If it has an id, it's an existing junction record we need to fetch
        if (u.id) {
          return this.invoiceStorageService.findOneById(u.id);
        }
        // Otherwise it's the start of a new connection
        return {
          invoiceId: id,
          uploadId: u.uploadId,
        } as InvoiceStorageEntity;
      }),
    );

    // Handle uploads - manage existing, new, and eliminated uploads
    const {
      keptItems: keptUploads,
      newItems: newUploads,
      eliminatedItems: eliminatedUploads,
    } = await this.invoiceRepository.updateAssociations<
      Pick<InvoiceStorageEntity, 'id' | 'invoiceId' | 'uploadId'>
    >({
      keys: ['invoiceId', 'uploadId'],
      updatedItems: updatedUploads,
      existingItems: existingUploads,
      onCreate: (entity) =>
        this.invoiceStorageService.save(entity.invoiceId, entity.uploadId),
      onDelete: (id: number) =>
        this.invoiceStorageService.softDelete(existingUploads[id].id),
    });

    // Save and return the updated invoice with all updated details
    const invoice = await this.invoiceRepository.save({
      id: existingInvoice.id,
      ...updateInvoiceDto,
      activityType,
      status,
      bankAccountId: bankAccount.id,
      currencyId: currency ? currency.id : firm.currencyId,
      firmId: firm.id,
      interlocutorId: interlocutor ? interlocutor.id : null,
      cabinetId,
      reference,
      articleInvoiceEntries: articleEntries,
      invoiceMetaData,
      taxStampId: taxStamp ? taxStamp.id : null,
      subTotal,
      taxWithholdingAmount,
      total: totalAfterGeneralDiscount,
      uploads: [...keptUploads, ...newUploads, ...eliminatedUploads],
    });

    return this.normalizeSellingInvoiceEntity(invoice);
  }

  async updateFields(
    id: number,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<InvoiceEntity> {
    return this.invoiceRepository.update(id, updateInvoiceDto);
  }

  async duplicate(
    duplicateInvoiceDto: DuplicateInvoiceDto,
    userId?: string,
  ): Promise<ResponseInvoiceDto> {
    const existingInvoice = await this.findOneByCondition(
      {
        filter: `id||$eq||${duplicateInvoiceDto.id}`,
        join: new String().concat(
          'invoiceMetaData,',
          'articleInvoiceEntries,',
          'articleInvoiceEntries.articleInvoiceEntryTaxes,',
          'uploads',
        ),
      },
      userId,
    );
    if (!existingInvoice) {
      throw new InvoiceNotFoundException();
    }
    const invoiceMetaData = await this.invoiceMetaDataService.duplicate(
      existingInvoice.invoiceMetaData.id,
    );
    const activityType = this.normalizeActivityType(
      existingInvoice.activityType,
    );
    const sequential =
      await this.invoiceSequenceService.getSequential(activityType);
    const invoice = await this.invoiceRepository.save({
      ...existingInvoice,
      id: undefined,
      activityType,
      sequential,
      reference:
        activityType === ACTIVITY_TYPE.BUYING
          ? null
          : this.normalizeReference(existingInvoice.reference),
      invoiceMetaData,
      articleInvoiceEntries: [],
      uploads: [],
      amountPaid: 0,
      amountSettled: 0,
      status: INVOICE_STATUS.Draft,
    });

    const articleInvoiceEntries =
      await this.articleInvoiceEntryService.duplicateMany(
        existingInvoice.articleInvoiceEntries.map((entry) => entry.id),
        invoice.id,
      );

    const uploads = duplicateInvoiceDto.includeFiles
      ? await this.invoiceStorageService.duplicateMany(
          existingInvoice.uploads.map((upload) => upload.id),
          invoice.id,
        )
      : [];

    return this.invoiceRepository.save({
      ...invoice,
      articleInvoiceEntries,
      uploads,
    });
  }

  async updateMany(
    updateInvoiceDtos: UpdateInvoiceDto[],
  ): Promise<InvoiceEntity[]> {
    return this.invoiceRepository.updateMany(updateInvoiceDtos);
  }

  async updateInvoiceSequence(
    updatedSequenceDto: UpdateInvoiceSequenceDto,
  ): Promise<InvoiceSequence> {
    return this.invoiceSequenceService.set(updatedSequenceDto);
  }

  async softDelete(id: number, userId?: string): Promise<InvoiceEntity> {
    await this.findOneById(id, userId);
    return this.invoiceRepository.softDelete(id);
  }

  async deleteAll() {
    return this.invoiceRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.invoiceRepository.getTotalCount();
  }
}
