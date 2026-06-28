import {
  BadRequestException,
  Inject,
  Injectable,
  StreamableFile,
  forwardRef,
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
import { CreditNoteRepository } from '../repositories/credit-note.repository';
import { ArticleCreditNoteEntryService } from './article-credit-note-entry.service';
import { CreditNoteStorageService } from './credit-note-upload.service';
import { CreditNoteMetaDataService } from './credit-note-meta-data.service';
import { CreditNoteSequenceService } from './credit-note-sequence.service';
import { CreditNoteNotFoundException } from '../errors/credit-note.notfound.error';
import { CreditNoteEntity } from '../entities/credit-note.entity';
import { ResponseCreditNoteDto } from '../dtos/credit-note.response.dto';
import { CreateCreditNoteDto } from '../dtos/credit-note.create.dto';
import { UpdateCreditNoteDto } from '../dtos/credit-note.update.dto';
import { ArticleCreditNoteEntryEntity } from '../entities/article-credit-note-entry.entity';
import { DuplicateCreditNoteDto } from '../dtos/credit-note.duplicate.dto';
import { CREDIT_NOTE_STATUS } from '../enums/credit-note-status.enum';
import { UpdateCreditNoteSequenceDto } from '../dtos/credit-note-seqence.update.dto';
import { CreditNoteSequence } from '../interfaces/credit-note-sequence.interface';
import { QuotationEntity } from 'src/modules/quotation/entities/quotation.entity';
import { DeliveryNoteEntity } from 'src/modules/delivery-note/entities/delivery-note.entity';
import { GoodsIssueNoteEntity } from 'src/modules/goods-issue-note/entities/goods-issue-note.entity';
import { TaxWithholdingService } from 'src/modules/tax-withholding/services/tax-withholding.service';
import { ciel } from 'src/utils/number.utils';
import { findSequentialNeighbors } from 'src/modules/sequence/utils/sequence.utils';
import { ResponseCreditNoteRangeDto } from '../dtos/credit-note-range.response.dto';
import { CreditNoteStorageEntity } from '../entities/credit-note-file.entity';
import { InvoiceEntity } from 'src/modules/invoice/entities/invoice.entity';
import { ReturnNoteEntity } from 'src/modules/return-note/entities/return-note.entity';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { FIRM_ENTITY_TYPE } from 'src/modules/firm/enums/firm-entity-type.enum';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { ArticleService } from 'src/modules/article/services/article.service';
import { MailService } from 'src/shared/mail/services/mail.service';
import { SendDocumentEmailDto } from 'src/shared/mail/dtos/send-document-email.dto';

@Injectable()
export class CreditNoteService {
  constructor(
    //repositories
    private readonly creditNoteRepository: CreditNoteRepository,
    //entity services
    private readonly articleCreditNoteEntryService: ArticleCreditNoteEntryService,
    private readonly articleService: ArticleService,
    private readonly creditNoteStorageService: CreditNoteStorageService,
    private readonly bankAccountService: BankAccountService,
    private readonly currencyService: CurrencyService,
    private readonly firmService: FirmService,
    private readonly interlocutorService: InterlocutorService,
    private readonly creditNoteSequenceService: CreditNoteSequenceService,
    private readonly creditNoteMetaDataService: CreditNoteMetaDataService,
    private readonly taxService: TaxService,
    private readonly taxWithholdingService: TaxWithholdingService,

    private readonly calculationsService: InvoicingCalculationsService,
    @Inject(forwardRef(() => DocumentTemplateRendererService))
    private readonly rendererService: DocumentTemplateRendererService,
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

  private normalizeSellingCreditNoteStatus(
    activityType: ACTIVITY_TYPE,
    status?: CREDIT_NOTE_STATUS | null,
  ): CREDIT_NOTE_STATUS | null | undefined {
    if (!status || activityType !== ACTIVITY_TYPE.SELLING) {
      return status;
    }

    if (
      [CREDIT_NOTE_STATUS.Validated, CREDIT_NOTE_STATUS.Sent].includes(status)
    ) {
      return CREDIT_NOTE_STATUS.Unpaid;
    }

    return status;
  }

  private normalizeSellingCreditNoteEntity<T extends CreditNoteEntity | null>(
    creditNote: T,
  ): T {
    if (!creditNote) {
      return creditNote;
    }

    creditNote.status =
      this.normalizeSellingCreditNoteStatus(
        creditNote.activityType,
        creditNote.status,
      ) ?? creditNote.status;

    return creditNote;
  }

  private normalizeSellingCreditNoteEntities(
    creditNotes: CreditNoteEntity[],
  ): CreditNoteEntity[] {
    return creditNotes.map((creditNote) =>
      this.normalizeSellingCreditNoteEntity(creditNote),
    );
  }

  private normalizeSellingCreditNoteQuery(query: IQueryObject): IQueryObject {
    if (
      !query.filter?.includes(`activityType||$eq||${ACTIVITY_TYPE.SELLING}`) ||
      !query.filter.includes(`status||$eq||${CREDIT_NOTE_STATUS.Unpaid}`)
    ) {
      return query;
    }

    return {
      ...query,
      filter: query.filter.replace(
        `status||$eq||${CREDIT_NOTE_STATUS.Unpaid}`,
        `status||$in||${[
          CREDIT_NOTE_STATUS.Unpaid,
          CREDIT_NOTE_STATUS.Validated,
          CREDIT_NOTE_STATUS.Sent,
        ].join(',')}`,
      ),
    };
  }

  private assertBuyingReference(
    activityType: ACTIVITY_TYPE,
    reference: string | null,
  ) {
    if (activityType === ACTIVITY_TYPE.BUYING && !reference) {
      throw new BadRequestException(
        "La référence de la avoir d'achat est obligatoire",
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
          ? 'Les avoirs d’achat doivent être liées à un fournisseur.'
          : 'Les avoirs de vente doivent être liées à un client.',
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
    const { pdfBuffer } = await this.generateCreditNotePdf(
      id,
      template,
      userId,
    );

    return new StreamableFile(new Uint8Array(pdfBuffer));
  }

  private async generateCreditNotePdf(
    id: number,
    template: string,
    userId?: string,
  ): Promise<{ filename: string; pdfBuffer: Buffer | Uint8Array }> {
    const creditNote = await this.findOneById(id, userId);
    if (!creditNote) {
      throw new CreditNoteNotFoundException();
    }

    const templateId = Number(template);
    const pdfBuffer = await this.rendererService.generateDocument(
      {
        documentId: id,
        documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.CREDIT_NOTE,
        templateId: Number.isNaN(templateId) ? undefined : templateId,
      },
      userId,
    );

    const filename = `${
      creditNote.reference ||
      creditNote.sequential ||
      `credit-note-${creditNote.id}`
    }.pdf`;
    return { filename, pdfBuffer };
  }

  async sendEmail(
    id: number,
    payload: SendDocumentEmailDto,
    userId?: string,
  ): Promise<{ success: boolean }> {
    const { filename, pdfBuffer } = await this.generateCreditNotePdf(
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

  async findOneById(id: number, userId?: string): Promise<CreditNoteEntity> {
    const creditNote = userId
      ? await this.findOneByCondition({ filter: `id||$eq||${id}` }, userId)
      : await this.creditNoteRepository.findOneById(id);
    if (!creditNote) {
      throw new CreditNoteNotFoundException();
    }
    return this.normalizeSellingCreditNoteEntity(creditNote);
  }

  async findOneByCondition(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<CreditNoteEntity | null> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const normalizedQuery = this.normalizeSellingCreditNoteQuery(scopedQuery);
    const queryOptions = queryBuilder.build(normalizedQuery);
    const creditNote = await this.creditNoteRepository.findOne(
      queryOptions as FindOneOptions<CreditNoteEntity>,
    );
    if (!creditNote) return null;
    return this.normalizeSellingCreditNoteEntity(creditNote);
  }

  async findAll(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<CreditNoteEntity[]> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const normalizedQuery = this.normalizeSellingCreditNoteQuery(scopedQuery);
    const queryOptions = queryBuilder.build(normalizedQuery);
    const creditNotes = await this.creditNoteRepository.findAll(
      queryOptions as FindManyOptions<CreditNoteEntity>,
    );
    return this.normalizeSellingCreditNoteEntities(creditNotes);
  }

  async findAllPaginated(
    query: IQueryObject,
    userId?: string,
  ): Promise<PageDto<ResponseCreditNoteDto>> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const normalizedQuery = this.normalizeSellingCreditNoteQuery(scopedQuery);
    const queryOptions = queryBuilder.build(normalizedQuery);
    const count = await this.creditNoteRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.creditNoteRepository.findAll(
      queryOptions as FindManyOptions<CreditNoteEntity>,
    );
    const normalizedEntities =
      this.normalizeSellingCreditNoteEntities(entities);

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: {
        page: parseInt(query.page),
        take: parseInt(query.limit),
      },
      itemCount: count,
    });

    return new PageDto(normalizedEntities, pageMetaDto);
  }

  async findCreditNotesByRange(
    id: number,
    userId?: string,
  ): Promise<ResponseCreditNoteRangeDto> {
    const creditNote = await this.findOneById(id, userId);
    const activityType = this.normalizeActivityType(creditNote.activityType);
    const creditNotes = await this.findAll(
      { filter: `activityType||$eq||${activityType}` },
      userId,
    );

    return findSequentialNeighbors(creditNote, creditNotes);
  }

  @Transactional()
  async save(
    createCreditNoteDto: CreateCreditNoteDto,
    userId?: string,
  ): Promise<CreditNoteEntity> {
    const cabinetId =
      (await this.getCabinetIdForUser(userId)) ??
      (createCreditNoteDto as CreateCreditNoteDto & { cabinetId?: number })
        .cabinetId;
    const activityType = this.normalizeActivityType(
      createCreditNoteDto.activityType,
    );
    const status =
      this.normalizeSellingCreditNoteStatus(
        activityType,
        createCreditNoteDto.status,
      ) ?? CREDIT_NOTE_STATUS.Draft;
    const reference = this.normalizeReference(createCreditNoteDto.reference);
    this.assertBuyingReference(activityType, reference);

    // Parallelize fetching firm, bank account, and currency, as they are independent
    const [firm, bankAccount, currency] = await Promise.all([
      cabinetId
        ? this.firmService.findOneByIdInCabinet(
            createCreditNoteDto.firmId,
            cabinetId,
          )
        : this.firmService.findOneByCondition({
            filter: `id||$eq||${createCreditNoteDto.firmId}`,
          }),
      this.resolveBankAccount(createCreditNoteDto.bankAccountId, cabinetId),
      createCreditNoteDto.currencyId
        ? this.currencyService.findOneById(createCreditNoteDto.currencyId)
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
    await this.interlocutorService.findOneById(
      createCreditNoteDto.interlocutorId,
    );

    // Save article entries if provided
    await this.articleService.assertArticlesBelongToCabinet(
      (createCreditNoteDto.articleCreditNoteEntries ?? []).map(
        (entry) => entry.articleId,
      ),
      cabinetId,
    );
    const articleEntries =
      createCreditNoteDto.articleCreditNoteEntries &&
      (await this.articleCreditNoteEntryService.saveMany(
        createCreditNoteDto.articleCreditNoteEntries,
        cabinetId,
      ));

    if (!articleEntries) {
      throw new Error('Article entries are missing');
    }

    // Calculate financial information
    const { subTotal, total } =
      this.calculationsService.calculateLineItemsTotal(
        articleEntries.map((entry) => entry.total),
        articleEntries.map((entry) => entry.subTotal),
      );

    // Fetch tax stamp if provided
    const taxStamp = createCreditNoteDto.taxStampId
      ? await this.taxService.findOneAuthorizedForCabinet(
          createCreditNoteDto.taxStampId,
          cabinetId,
          true,
        )
      : null;

    // Apply general discount
    const totalAfterGeneralDiscount =
      this.calculationsService.calculateTotalDiscount(
        total,
        createCreditNoteDto.discount,
        createCreditNoteDto.discount_type,
        taxStamp?.value || 0,
      );

    // Format articleEntries as lineItems for tax calculations
    const lineItems =
      await this.articleCreditNoteEntryService.findManyAsLineItem(
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

    // Fetch the latest sequential number for creditNote
    const sequential =
      await this.creditNoteSequenceService.getSequential(activityType);

    // Save creditNote metadata
    const creditNoteMetaData = await this.creditNoteMetaDataService.save({
      ...createCreditNoteDto.creditNoteMetaData,
      taxSummary,
    });

    // Ensure taxWithholding.rate is valid and calculate the withholding amount
    let taxWithholdingAmount = 0;
    if (createCreditNoteDto.taxWithholdingId) {
      const taxWithholding = await this.taxWithholdingService.findOneById(
        createCreditNoteDto.taxWithholdingId,
      );

      if (taxWithholding.rate !== undefined && taxWithholding.rate !== null) {
        taxWithholdingAmount =
          totalAfterGeneralDiscount * (taxWithholding.rate / 100);
      }
    }

    // Save the creditNote entity
    const creditNote = await this.creditNoteRepository.save({
      ...createCreditNoteDto,
      activityType,
      status,
      bankAccountId: bankAccount.id,
      currencyId: currency ? currency.id : firm.currencyId,
      cabinetId,
      sequential,
      reference,
      articleCreditNoteEntries: articleEntries,
      creditNoteMetaData,
      subTotal,
      taxWithholdingAmount: taxWithholdingAmount || 0,
      total: totalAfterGeneralDiscount,
    });

    // Handle file uploads if they exist
    if (createCreditNoteDto.uploads) {
      await Promise.all(
        createCreditNoteDto.uploads.map((u) =>
          this.creditNoteStorageService.save(creditNote.id, u.uploadId),
        ),
      );
    }

    return this.normalizeSellingCreditNoteEntity(creditNote);
  }

  async saveMany(
    createCreditNoteDtos: CreateCreditNoteDto[],
  ): Promise<CreditNoteEntity[]> {
    const creditNotes = [];
    for (const createCreditNoteDto of createCreditNoteDtos) {
      const creditNote = await this.save(createCreditNoteDto);
      creditNotes.push(creditNote);
    }
    return creditNotes;
  }

  @Transactional()
  async saveFromQuotation(
    quotation: QuotationEntity,
  ): Promise<CreditNoteEntity> {
    const activityType = this.normalizeActivityType(quotation.activityType);
    if (activityType === ACTIVITY_TYPE.BUYING) {
      throw new BadRequestException(
        "La transformation automatique d'un devis d'achat en avoir est désactivée",
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
      status: CREDIT_NOTE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleCreditNoteEntries: quotation.articleQuotationEntries.map(
        (entry) => {
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
        },
      ),
    });
  }

  @Transactional()
  async saveFromDeliveryNote(
    deliveryNote: DeliveryNoteEntity,
  ): Promise<CreditNoteEntity> {
    const activityType = this.normalizeActivityType(deliveryNote.activityType);
    if (activityType === ACTIVITY_TYPE.BUYING) {
      throw new BadRequestException(
        "La transformation automatique d'un bon de livraison d'achat en avoir est désactivée",
      );
    }

    return this.save({
      activityType,
      deliveryNoteId: deliveryNote.id,
      cabinetId: deliveryNote.cabinetId,
      currencyId: deliveryNote.currencyId,
      bankAccountId: deliveryNote.bankAccountId,
      interlocutorId: deliveryNote.interlocutorId,
      firmId: deliveryNote.firmId,
      discount: deliveryNote.discount,
      discount_type: deliveryNote.discount_type,
      object: deliveryNote.object,
      status: CREDIT_NOTE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleCreditNoteEntries: deliveryNote.articleDeliveryNoteEntries.map(
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
    });
  }

  @Transactional()
  async saveFromGoodsIssueNote(
    goodsIssueNote: GoodsIssueNoteEntity,
  ): Promise<CreditNoteEntity> {
    const activityType = this.normalizeActivityType(
      goodsIssueNote.activityType,
    );
    if (activityType === ACTIVITY_TYPE.BUYING) {
      throw new BadRequestException(
        "La transformation automatique d'un bon de sortie d'achat en avoir est désactivée",
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
      status: CREDIT_NOTE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleCreditNoteEntries: goodsIssueNote.articleGoodsIssueNoteEntries.map(
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
  async saveFromInvoice(invoice: InvoiceEntity): Promise<CreditNoteEntity> {
    const activityType = this.normalizeActivityType(invoice.activityType);
    if (activityType === ACTIVITY_TYPE.BUYING) {
      throw new BadRequestException(
        "La transformation automatique d'une facture d'achat en avoir est désactivée",
      );
    }

    return this.save({
      activityType,
      sourceInvoiceId: invoice.id,
      cabinetId: invoice.cabinetId,
      currencyId: invoice.currencyId,
      bankAccountId: invoice.bankAccountId,
      interlocutorId: invoice.interlocutorId,
      firmId: invoice.firmId,
      discount: invoice.discount,
      discount_type: invoice.discount_type,
      object: invoice.object,
      status: CREDIT_NOTE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleCreditNoteEntries: invoice.articleInvoiceEntries.map((entry) => ({
        unit_price: entry.unit_price,
        quantity: entry.quantity,
        discount: entry.discount,
        discount_type: entry.discount_type,
        subTotal: entry.subTotal,
        total: entry.total,
        articleId: entry.article.id,
        article: entry.article,
        taxes: entry.articleInvoiceEntryTaxes.map((taxEntry) => taxEntry.taxId),
      })),
    });
  }

  @Transactional()
  async saveFromReturnNote(
    returnNote: ReturnNoteEntity,
  ): Promise<CreditNoteEntity> {
    const activityType = this.normalizeActivityType(returnNote.activityType);
    if (activityType === ACTIVITY_TYPE.BUYING) {
      throw new BadRequestException(
        "La transformation automatique d'un bon de retour d'achat en avoir est désactivée",
      );
    }

    return this.save({
      activityType,
      sourceReturnNoteId: returnNote.id,
      cabinetId: returnNote.cabinetId,
      currencyId: returnNote.currencyId,
      bankAccountId: returnNote.bankAccountId,
      interlocutorId: returnNote.interlocutorId,
      firmId: returnNote.firmId,
      discount: returnNote.discount,
      discount_type: returnNote.discount_type,
      object: returnNote.object,
      status: CREDIT_NOTE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleCreditNoteEntries: returnNote.articleReturnNoteEntries.map(
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
    updateCreditNoteDto: UpdateCreditNoteDto,
    userId?: string,
  ): Promise<CreditNoteEntity> {
    // Retrieve the existing creditNote with necessary relations
    const existingCreditNoteWithUploads = await this.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'articleCreditNoteEntries,creditNoteMetaData,uploads,taxWithholding',
      },
      userId,
    );
    if (!existingCreditNoteWithUploads) {
      throw new CreditNoteNotFoundException();
    }
    const { uploads: existingUploads, ...existingCreditNote } =
      existingCreditNoteWithUploads;
    const cabinetId = existingCreditNote.cabinetId;

    const activityType = this.normalizeActivityType(
      updateCreditNoteDto.activityType ?? existingCreditNote.activityType,
    );
    const status =
      this.normalizeSellingCreditNoteStatus(
        activityType,
        updateCreditNoteDto.status,
      ) ??
      this.normalizeSellingCreditNoteStatus(
        activityType,
        existingCreditNote.status,
      ) ??
      existingCreditNote.status;
    const reference = this.normalizeReference(
      updateCreditNoteDto.reference ?? existingCreditNote.reference,
    );
    this.assertBuyingReference(activityType, reference);

    // Fetch and validate related entities
    const [firm, bankAccount, currency, interlocutor] = await Promise.all([
      this.firmService.findOneByIdInCabinet(
        updateCreditNoteDto.firmId ?? existingCreditNote.firmId,
        cabinetId,
      ),
      this.resolveBankAccount(
        updateCreditNoteDto.bankAccountId ?? existingCreditNote.bankAccountId,
        cabinetId,
      ),
      updateCreditNoteDto.currencyId
        ? this.currencyService.findOneById(updateCreditNoteDto.currencyId)
        : null,
      updateCreditNoteDto.interlocutorId
        ? this.interlocutorService.findOneById(
            updateCreditNoteDto.interlocutorId,
          )
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
      await this.articleCreditNoteEntryService.softDeleteMany(
        existingCreditNote.articleCreditNoteEntries.map((entry) => entry.id),
      );

    // Save new article entries
    const articleEntries: ArticleCreditNoteEntryEntity[] =
      updateCreditNoteDto.articleCreditNoteEntries
        ? (await this.articleService.assertArticlesBelongToCabinet(
            updateCreditNoteDto.articleCreditNoteEntries.map(
              (entry) => entry.articleId,
            ),
            cabinetId,
          ),
          await this.articleCreditNoteEntryService.saveMany(
            updateCreditNoteDto.articleCreditNoteEntries,
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
    const taxStamp = updateCreditNoteDto.taxStampId
      ? await this.taxService.findOneAuthorizedForCabinet(
          updateCreditNoteDto.taxStampId,
          cabinetId,
          true,
        )
      : null;

    // Apply general discount
    const totalAfterGeneralDiscount =
      this.calculationsService.calculateTotalDiscount(
        total,
        updateCreditNoteDto.discount,
        updateCreditNoteDto.discount_type,
        taxStamp?.value || 0,
      );

    // Convert article entries to line items for further calculations
    const lineItems =
      await this.articleCreditNoteEntryService.findManyAsLineItem(
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

    // Save or update the creditNote metadata with the updated tax summary
    const creditNoteMetaData = await this.creditNoteMetaDataService.save({
      ...existingCreditNote.creditNoteMetaData,
      ...updateCreditNoteDto.creditNoteMetaData,
      taxSummary,
    });

    // Ensure taxWithholding.rate is valid and calculate the withholding amount
    let taxWithholdingAmount = 0;
    if (updateCreditNoteDto.taxWithholdingId) {
      const taxWithholding = await this.taxWithholdingService.findOneById(
        updateCreditNoteDto.taxWithholdingId,
      );

      if (taxWithholding.rate !== undefined && taxWithholding.rate !== null) {
        taxWithholdingAmount = ciel(
          totalAfterGeneralDiscount * (taxWithholding.rate / 100),
          currency.digitAfterComma + 1,
        );
      }
    }

    const updatedUploads = (
      await Promise.all(
        (updateCreditNoteDto.uploads || []).map(async (u) => {
          if (u?.id) {
            return this.creditNoteStorageService.findOneById(u.id);
          }

          if (u?.uploadId) {
            return {
              creditNoteId: id,
              uploadId: u.uploadId,
            } as Pick<
              CreditNoteStorageEntity,
              'id' | 'creditNoteId' | 'uploadId'
            >;
          }

          return null;
        }),
      )
    ).filter(
      (
        upload,
      ): upload is Pick<
        CreditNoteStorageEntity,
        'id' | 'creditNoteId' | 'uploadId'
      > => !!upload,
    );

    // Handle uploads - manage existing, new, and eliminated uploads
    const {
      keptItems: keptUploads,
      newItems: newUploads,
      eliminatedItems: eliminatedUploads,
    } = await this.creditNoteRepository.updateAssociations<
      Pick<CreditNoteStorageEntity, 'id' | 'creditNoteId' | 'uploadId'>
    >({
      keys: ['creditNoteId', 'uploadId'],
      updatedItems: updatedUploads,
      existingItems: existingUploads,
      onCreate: (entity) =>
        this.creditNoteStorageService.save(
          entity.creditNoteId,
          entity.uploadId,
        ),
      onDelete: (uploadAssociationId: number) =>
        this.creditNoteStorageService.softDelete(uploadAssociationId),
    });

    // Save and return the updated creditNote with all updated details
    const updatedCreditNote = await this.creditNoteRepository.save({
      id: existingCreditNote.id,
      ...updateCreditNoteDto,
      activityType,
      status,
      bankAccountId: bankAccount.id,
      currencyId: currency ? currency.id : firm.currencyId,
      firmId: firm.id,
      interlocutorId: interlocutor ? interlocutor.id : null,
      cabinetId,
      reference,
      articleCreditNoteEntries: articleEntries,
      creditNoteMetaData,
      taxStampId: taxStamp ? taxStamp.id : null,
      subTotal,
      taxWithholdingAmount,
      total: totalAfterGeneralDiscount,
      uploads: [...keptUploads, ...newUploads, ...eliminatedUploads],
    });

    return this.normalizeSellingCreditNoteEntity(updatedCreditNote);
  }

  async updateFields(
    id: number,
    updateCreditNoteDto: UpdateCreditNoteDto,
  ): Promise<CreditNoteEntity> {
    return this.creditNoteRepository.update(id, updateCreditNoteDto);
  }

  async duplicate(
    duplicateCreditNoteDto: DuplicateCreditNoteDto,
    userId?: string,
  ): Promise<ResponseCreditNoteDto> {
    const existingCreditNote = await this.findOneByCondition(
      {
        filter: `id||$eq||${duplicateCreditNoteDto.id}`,
        join: new String().concat(
          'creditNoteMetaData,',
          'articleCreditNoteEntries,',
          'articleCreditNoteEntries.articleCreditNoteEntryTaxes,',
          'uploads',
        ),
      },
      userId,
    );
    if (!existingCreditNote) {
      throw new CreditNoteNotFoundException();
    }
    const creditNoteMetaData = await this.creditNoteMetaDataService.duplicate(
      existingCreditNote.creditNoteMetaData.id,
    );
    const activityType = this.normalizeActivityType(
      existingCreditNote.activityType,
    );
    const sequential =
      await this.creditNoteSequenceService.getSequential(activityType);
    const creditNote = await this.creditNoteRepository.save({
      ...existingCreditNote,
      id: undefined,
      activityType,
      sequential,
      reference:
        activityType === ACTIVITY_TYPE.BUYING
          ? null
          : this.normalizeReference(existingCreditNote.reference),
      creditNoteMetaData,
      articleCreditNoteEntries: [],
      uploads: [],
      amountPaid: 0,
      status: CREDIT_NOTE_STATUS.Draft,
    });

    const articleCreditNoteEntries =
      await this.articleCreditNoteEntryService.duplicateMany(
        existingCreditNote.articleCreditNoteEntries.map((entry) => entry.id),
        creditNote.id,
      );

    const uploads = duplicateCreditNoteDto.includeFiles
      ? await this.creditNoteStorageService.duplicateMany(
          existingCreditNote.uploads.map((upload) => upload.id),
          creditNote.id,
        )
      : [];

    return this.creditNoteRepository.save({
      ...creditNote,
      articleCreditNoteEntries,
      uploads,
    });
  }

  async updateMany(
    updateCreditNoteDtos: UpdateCreditNoteDto[],
  ): Promise<CreditNoteEntity[]> {
    return this.creditNoteRepository.updateMany(updateCreditNoteDtos);
  }

  async updateCreditNoteSequence(
    updatedSequenceDto: UpdateCreditNoteSequenceDto,
  ): Promise<CreditNoteSequence> {
    return this.creditNoteSequenceService.set(updatedSequenceDto);
  }

  async softDelete(id: number, userId?: string): Promise<CreditNoteEntity> {
    await this.findOneById(id, userId);
    return this.creditNoteRepository.softDelete(id);
  }

  async deleteAll() {
    return this.creditNoteRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.creditNoteRepository.getTotalCount();
  }
}
