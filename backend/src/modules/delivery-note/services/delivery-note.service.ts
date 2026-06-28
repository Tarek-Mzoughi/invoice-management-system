import {
  BadRequestException,
  Inject,
  Injectable,
  StreamableFile,
  forwardRef,
} from '@nestjs/common';
import { DeliveryNoteEntity } from '../entities/delivery-note.entity';
import { DeliveryNoteNotFoundException } from '../errors/delivery-note.notfound.error';
import { ResponseDeliveryNoteDto } from '../dtos/delivery-note.response.dto';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { CreateDeliveryNoteDto } from '../dtos/delivery-note.create.dto';
import { UpdateDeliveryNoteDto } from '../dtos/delivery-note.update.dto';
import { CurrencyService } from 'src/modules/currency/services/currency.service';
import { FirmService } from 'src/modules/firm/services/firm.service';
import { InterlocutorService } from 'src/modules/interlocutor/services/interlocutor.service';
import { InvoicingCalculationsService } from 'src/shared/calculations/services/invoicing.calculations.service';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { ArticleDeliveryNoteEntryService } from './article-delivery-note-entry.service';
import { ArticleDeliveryNoteEntryEntity } from '../entities/article-delivery-note-entry.entity';
import { DocumentTemplateRendererService } from 'src/modules/document-template/services/document-template-renderer.service';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from 'src/modules/document-template/enums/document-template-document-type.enum';
import { DeliveryNoteSequenceService } from './delivery-note-sequence.service';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { DeliveryNoteMetaDataService } from './delivery-note-meta-data.service';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { BankAccountService } from 'src/modules/bank-account/services/bank-account.service';
import { DeliveryNoteStorageService } from './delivery-note-upload.service';
import { ResponseDeliveryNoteUploadDto } from '../dtos/delivery-note-upload.response.dto';
import { DeliveryNoteSequence } from '../interfaces/delivery-note-sequence.interface';
import { UpdateDeliveryNoteSequenceDto } from '../dtos/delivery-note-seqence.update.dto';
import { Transactional } from '@nestjs-cls/transactional';
import { DuplicateDeliveryNoteDto } from '../dtos/delivery-note.duplicate.dto';
import { DELIVERY_NOTE_STATUS } from '../enums/delivery-note-status.enum';
import { DeliveryNoteRepository } from '../repositories/delivery-note.repository';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { FIRM_ENTITY_TYPE } from 'src/modules/firm/enums/firm-entity-type.enum';
import { QuotationEntity } from 'src/modules/quotation/entities/quotation.entity';
import { InvoiceEntity } from 'src/modules/invoice/entities/invoice.entity';
import { CustomerOrderEntity } from 'src/modules/customer-order/entities/customer-order.entity';
import { GoodsIssueNoteEntity } from 'src/modules/goods-issue-note/entities/goods-issue-note.entity';
import { QuotationService } from 'src/modules/quotation/services/quotation.service';
import { QUOTATION_STATUS } from 'src/modules/quotation/enums/quotation-status.enum';
import { CustomerOrderLifecycleService } from 'src/modules/customer-order/services/customer-order-lifecycle.service';
import { DeliveryNoteLifecycleService } from './delivery-note-lifecycle.service';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { ArticleService } from 'src/modules/article/services/article.service';
import { MailService } from 'src/shared/mail/services/mail.service';
import { SendDocumentEmailDto } from 'src/shared/mail/dtos/send-document-email.dto';

@Injectable()
export class DeliveryNoteService {
  constructor(
    //repositories
    private readonly deliveryNoteRepository: DeliveryNoteRepository,
    //entity services
    private readonly articleDeliveryNoteEntryService: ArticleDeliveryNoteEntryService,
    private readonly articleService: ArticleService,
    private readonly deliveryNoteStorageService: DeliveryNoteStorageService,
    private readonly bankAccountService: BankAccountService,
    private readonly currencyService: CurrencyService,
    private readonly firmService: FirmService,
    private readonly interlocutorService: InterlocutorService,
    private readonly deliveryNoteSequenceService: DeliveryNoteSequenceService,
    private readonly deliveryNoteMetaDataService: DeliveryNoteMetaDataService,
    private readonly taxService: TaxService,

    //abstract services
    private readonly calculationsService: InvoicingCalculationsService,
    @Inject(forwardRef(() => DocumentTemplateRendererService))
    private readonly rendererService: DocumentTemplateRendererService,
    @Inject(forwardRef(() => QuotationService))
    private readonly quotationService: QuotationService,
    @Inject(forwardRef(() => CustomerOrderLifecycleService))
    private readonly customerOrderLifecycleService: CustomerOrderLifecycleService,
    private readonly deliveryNoteLifecycleService: DeliveryNoteLifecycleService,
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
          ? 'Les bon de livraison d’achat doivent être liés à un fournisseur.'
          : 'Les bon de livraison de vente doivent être liés à un client.',
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
    const { pdfBuffer } = await this.generateDeliveryNotePdf(
      id,
      template,
      userId,
    );

    return new StreamableFile(new Uint8Array(pdfBuffer));
  }

  private async generateDeliveryNotePdf(
    id: number,
    template: string,
    userId?: string,
  ): Promise<{ filename: string; pdfBuffer: Buffer | Uint8Array }> {
    const deliveryNote = await this.findOneById(id, userId);
    if (!deliveryNote) {
      throw new DeliveryNoteNotFoundException();
    }

    const templateId = Number(template);
    const pdfBuffer = await this.rendererService.generateDocument(
      {
        documentId: id,
        documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.DELIVERY_NOTE,
        templateId: Number.isNaN(templateId) ? undefined : templateId,
      },
      userId,
    );

    const filename = `${
      deliveryNote.sequential || `delivery-note-${deliveryNote.id}`
    }.pdf`;
    return { filename, pdfBuffer };
  }

  async sendEmail(
    id: number,
    payload: SendDocumentEmailDto,
    userId?: string,
  ): Promise<{ success: boolean }> {
    const { filename, pdfBuffer } = await this.generateDeliveryNotePdf(
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

  async findOneById(id: number, userId?: string): Promise<DeliveryNoteEntity> {
    const deliveryNote = userId
      ? await this.findOneByCondition({ filter: `id||$eq||${id}` }, userId)
      : await this.deliveryNoteRepository.findOneById(id);
    if (!deliveryNote) {
      throw new DeliveryNoteNotFoundException();
    }
    return this.deliveryNoteLifecycleService.normalizeDeliveryNoteStatus(
      deliveryNote,
    ) as DeliveryNoteEntity;
  }

  async findOneByCondition(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<DeliveryNoteEntity | null> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const deliveryNote = await this.deliveryNoteRepository.findOne(
      queryOptions as FindOneOptions<DeliveryNoteEntity>,
    );
    if (!deliveryNote) return null;
    return this.deliveryNoteLifecycleService.normalizeDeliveryNoteStatus(
      deliveryNote,
    ) as DeliveryNoteEntity;
  }

  async findAll(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<DeliveryNoteEntity[]> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const deliveryNotes = await this.deliveryNoteRepository.findAll(
      queryOptions as FindManyOptions<DeliveryNoteEntity>,
    );
    return this.deliveryNoteLifecycleService.normalizeDeliveryNotesStatus(
      deliveryNotes,
    ) as DeliveryNoteEntity[];
  }

  async findAllPaginated(
    query: IQueryObject,
    userId?: string,
  ): Promise<PageDto<ResponseDeliveryNoteDto>> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const count = await this.deliveryNoteRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.deliveryNoteRepository.findAll(
      queryOptions as FindManyOptions<DeliveryNoteEntity>,
    );

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: {
        page: parseInt(query.page),
        take: parseInt(query.limit),
      },
      itemCount: count,
    });

    return new PageDto(
      this.deliveryNoteLifecycleService.normalizeDeliveryNotesStatus(
        entities,
      ) as ResponseDeliveryNoteDto[],
      pageMetaDto,
    );
  }

  @Transactional()
  async save(
    createDeliveryNoteDto: CreateDeliveryNoteDto,
    userId?: string,
  ): Promise<DeliveryNoteEntity> {
    const cabinetId =
      (await this.getCabinetIdForUser(userId)) ??
      (createDeliveryNoteDto as CreateDeliveryNoteDto & { cabinetId?: number })
        .cabinetId;
    const status = this.deliveryNoteLifecycleService.resolveCreateStatus(
      createDeliveryNoteDto.status,
    );
    const activityType = this.normalizeActivityType(
      createDeliveryNoteDto.activityType,
    );
    const articleEntryDtos = Array.isArray(
      createDeliveryNoteDto.articleDeliveryNoteEntries,
    )
      ? createDeliveryNoteDto.articleDeliveryNoteEntries
      : [];

    // Parallelize fetching firm, bank account, and currency, as they are independent
    const [firm, bankAccount, currency] = await Promise.all([
      cabinetId
        ? this.firmService.findOneByIdInCabinet(
            createDeliveryNoteDto.firmId,
            cabinetId,
          )
        : this.firmService.findOneByCondition({
            filter: `id||$eq||${createDeliveryNoteDto.firmId}`,
          }),
      this.resolveBankAccount(createDeliveryNoteDto.bankAccountId, cabinetId),
      createDeliveryNoteDto.currencyId
        ? this.currencyService.findOneById(createDeliveryNoteDto.currencyId)
        : Promise.resolve(null),
    ]);

    if (!firm) {
      throw new BadRequestException('Entreprise introuvable.');
    }

    this.assertFirmEntityType(activityType, firm.entityType);

    if (!bankAccount) {
      throw new BadRequestException(
        'Aucun compte bancaire principal n’est configuré.',
      );
    }

    // Check interlocutor existence
    await this.interlocutorService.findOneById(
      createDeliveryNoteDto.interlocutorId,
    );

    if (!articleEntryDtos.length) {
      throw new BadRequestException(
        'Ajoutez au moins un article au bon de livraison.',
      );
    }

    await this.articleService.assertArticlesBelongToCabinet(
      articleEntryDtos.map((entry) => entry.articleId),
      cabinetId,
    );

    const articleEntries = await this.articleDeliveryNoteEntryService.saveMany(
      articleEntryDtos,
      cabinetId,
    );

    // Calculate financial information
    const { subTotal, total } =
      this.calculationsService.calculateLineItemsTotal(
        articleEntries.map((entry) => entry.total),
        articleEntries.map((entry) => entry.subTotal),
      );

    // Apply general discount
    const totalAfterGeneralDiscount =
      this.calculationsService.calculateTotalDiscount(
        total,
        createDeliveryNoteDto.discount,
        createDeliveryNoteDto.discount_type,
      );

    // Format articleEntries as lineItems for tax calculations
    const lineItems =
      await this.articleDeliveryNoteEntryService.findManyAsLineItem(
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

    // Fetch the latest sequential number for deliveryNote
    const sequential =
      await this.deliveryNoteSequenceService.getSequential(activityType);

    // Save deliveryNote metadata
    const deliveryNoteMetaData = await this.deliveryNoteMetaDataService.save({
      ...createDeliveryNoteDto.deliveryNoteMetaData,
      taxSummary,
    });

    // Save the deliveryNote entity
    const deliveryNote = await this.deliveryNoteRepository.save({
      ...createDeliveryNoteDto,
      status: this.deliveryNoteLifecycleService.toPersistenceStatus(
        status,
      ) as DELIVERY_NOTE_STATUS,
      activityType,
      bankAccountId: bankAccount.id,
      currencyId: currency ? currency.id : firm.currencyId,
      cabinetId,
      sequential,
      articleDeliveryNoteEntries: articleEntries,
      deliveryNoteMetaData,
      subTotal,
      total: totalAfterGeneralDiscount,
    });

    // Handle file uploads if they exist
    if (createDeliveryNoteDto.uploads) {
      await Promise.all(
        createDeliveryNoteDto.uploads.map((u) =>
          this.deliveryNoteStorageService.save(deliveryNote.id, u.uploadId),
        ),
      );
    }

    return this.deliveryNoteLifecycleService.normalizeDeliveryNoteStatus(
      deliveryNote,
    ) as DeliveryNoteEntity;
  }

  async saveMany(
    createDeliveryNoteDtos: CreateDeliveryNoteDto[],
  ): Promise<DeliveryNoteEntity[]> {
    const deliveryNotes = [];
    for (const createDeliveryNoteDto of createDeliveryNoteDtos) {
      const deliveryNote = await this.save(createDeliveryNoteDto);
      deliveryNotes.push(deliveryNote);
    }
    return deliveryNotes;
  }

  async updateDeliveryNoteUploads(
    id: number,
    updateDeliveryNoteDto: UpdateDeliveryNoteDto,
    existingUploads: ResponseDeliveryNoteUploadDto[],
  ) {
    const newUploads = [];
    const keptUploads = [];
    const eliminatedUploads = [];

    if (updateDeliveryNoteDto.uploads) {
      for (const upload of existingUploads) {
        const exists = updateDeliveryNoteDto.uploads.some(
          (u) => u.id === upload.id,
        );
        if (!exists)
          eliminatedUploads.push(
            await this.deliveryNoteStorageService.softDelete(upload.id),
          );
        else keptUploads.push(upload);
      }
      for (const upload of updateDeliveryNoteDto.uploads) {
        if (!upload.id)
          newUploads.push(
            await this.deliveryNoteStorageService.save(id, upload.uploadId),
          );
      }
    }
    return { keptUploads, newUploads, eliminatedUploads };
  }

  @Transactional()
  async update(
    id: number,
    updateDeliveryNoteDto: UpdateDeliveryNoteDto,
    userId?: string,
  ): Promise<DeliveryNoteEntity> {
    const existingDeliveryNote = await this.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join:
          'articleDeliveryNoteEntries,' +
          'articleDeliveryNoteEntries.articleDeliveryNoteEntryTaxes,' +
          'deliveryNoteMetaData,' +
          'uploads,' +
          'invoices',
      },
      userId,
    );
    if (!existingDeliveryNote) {
      throw new DeliveryNoteNotFoundException();
    }
    const { uploads: existingUploads = [], ...deliveryNoteSnapshot } =
      existingDeliveryNote;
    const cabinetId = deliveryNoteSnapshot.cabinetId;
    const nextStatus = this.deliveryNoteLifecycleService.resolveUpdateStatus(
      existingDeliveryNote,
      updateDeliveryNoteDto.status,
    );
    this.assertUpdateAllowedForCurrentStatus(
      existingDeliveryNote,
      updateDeliveryNoteDto,
    );
    const activityType = this.normalizeActivityType(
      updateDeliveryNoteDto.activityType ?? deliveryNoteSnapshot.activityType,
    );

    // Fetch and validate related entities in parallel to optimize performance
    const [firm, bankAccount, currency, interlocutor] = await Promise.all([
      this.firmService.findOneByIdInCabinet(
        updateDeliveryNoteDto.firmId ?? deliveryNoteSnapshot.firmId,
        cabinetId,
      ),
      this.resolveBankAccount(
        updateDeliveryNoteDto.bankAccountId ??
          deliveryNoteSnapshot.bankAccountId,
        cabinetId,
      ),
      updateDeliveryNoteDto.currencyId
        ? this.currencyService.findOneById(updateDeliveryNoteDto.currencyId)
        : Promise.resolve(null),
      updateDeliveryNoteDto.interlocutorId
        ? this.interlocutorService.findOneById(
            updateDeliveryNoteDto.interlocutorId,
          )
        : Promise.resolve(null),
    ]);

    if (!firm) {
      throw new BadRequestException('Entreprise introuvable.');
    }

    this.assertFirmEntityType(activityType, firm.entityType);

    if (!bankAccount) {
      throw new BadRequestException(
        'Aucun compte bancaire principal n’est configuré.',
      );
    }

    const hasArticleEntriesUpdate = Array.isArray(
      updateDeliveryNoteDto.articleDeliveryNoteEntries,
    );

    const articleEntries: ArticleDeliveryNoteEntryEntity[] =
      hasArticleEntriesUpdate
        ? await (async () => {
            if (deliveryNoteSnapshot.articleDeliveryNoteEntries.length > 0) {
              await this.articleDeliveryNoteEntryService.softDeleteMany(
                deliveryNoteSnapshot.articleDeliveryNoteEntries.map(
                  (entry) => entry.id,
                ),
              );
            }

            await this.articleService.assertArticlesBelongToCabinet(
              updateDeliveryNoteDto.articleDeliveryNoteEntries.map(
                (entry) => entry.articleId,
              ),
              cabinetId,
            );

            return this.articleDeliveryNoteEntryService.saveMany(
              updateDeliveryNoteDto.articleDeliveryNoteEntries,
              cabinetId,
            );
          })()
        : deliveryNoteSnapshot.articleDeliveryNoteEntries;

    // Calculate the subtotal and total for the new entries
    const { subTotal, total } =
      this.calculationsService.calculateLineItemsTotal(
        articleEntries.map((entry) => entry.total),
        articleEntries.map((entry) => entry.subTotal),
      );

    // Apply general discount
    const totalAfterGeneralDiscount =
      this.calculationsService.calculateTotalDiscount(
        total,
        updateDeliveryNoteDto.discount ?? deliveryNoteSnapshot.discount,
        updateDeliveryNoteDto.discount_type ??
          deliveryNoteSnapshot.discount_type,
      );

    // Convert article entries to line items for further calculations
    const lineItems =
      await this.articleDeliveryNoteEntryService.findManyAsLineItem(
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

    // Save or update the deliveryNote metadata with the updated tax summary
    const deliveryNoteMetaData = await this.deliveryNoteMetaDataService.save({
      ...deliveryNoteSnapshot.deliveryNoteMetaData,
      ...updateDeliveryNoteDto.deliveryNoteMetaData,
      taxSummary,
    });

    // Handle uploads - manage existing, new, and eliminated uploads
    const { keptUploads, newUploads, eliminatedUploads } =
      await this.updateDeliveryNoteUploads(
        deliveryNoteSnapshot.id,
        updateDeliveryNoteDto,
        existingUploads,
      );

    // Save and return the updated deliveryNote with all updated details
    const deliveryNote = await this.deliveryNoteRepository.save({
      ...updateDeliveryNoteDto,
      id,
      activityType,
      status: this.deliveryNoteLifecycleService.toPersistenceStatus(
        nextStatus,
      ) as DELIVERY_NOTE_STATUS,
      quotationId:
        updateDeliveryNoteDto.quotationId ?? deliveryNoteSnapshot.quotationId,
      customerOrderId:
        updateDeliveryNoteDto.customerOrderId ??
        deliveryNoteSnapshot.customerOrderId,
      invoiceId:
        updateDeliveryNoteDto.invoiceId ?? deliveryNoteSnapshot.invoiceId,
      firmId: firm.id,
      cabinetId,
      bankAccountId: bankAccount.id,
      currencyId:
        currency?.id ?? deliveryNoteSnapshot.currencyId ?? firm.currencyId,
      interlocutorId:
        interlocutor?.id ?? deliveryNoteSnapshot.interlocutorId ?? null,
      articleDeliveryNoteEntries: articleEntries,
      deliveryNoteMetaData,
      subTotal,
      total: totalAfterGeneralDiscount,
      uploads: [...keptUploads, ...newUploads, ...eliminatedUploads],
    });

    return this.deliveryNoteLifecycleService.normalizeDeliveryNoteStatus(
      deliveryNote,
    ) as DeliveryNoteEntity;
  }

  async duplicate(
    duplicateDeliveryNoteDto: DuplicateDeliveryNoteDto,
    userId?: string,
  ): Promise<ResponseDeliveryNoteDto> {
    const existingDeliveryNote = await this.findOneByCondition(
      {
        filter: `id||$eq||${duplicateDeliveryNoteDto.id}`,
        join: new String().concat(
          'deliveryNoteMetaData,',
          'articleDeliveryNoteEntries,',
          'articleDeliveryNoteEntries.articleDeliveryNoteEntryTaxes,',
          'uploads',
        ),
      },
      userId,
    );
    if (!existingDeliveryNote) {
      throw new DeliveryNoteNotFoundException();
    }
    const deliveryNoteMetaData =
      await this.deliveryNoteMetaDataService.duplicate(
        existingDeliveryNote.deliveryNoteMetaData.id,
      );
    const activityType = this.normalizeActivityType(
      existingDeliveryNote.activityType,
    );
    const sequential =
      await this.deliveryNoteSequenceService.getSequential(activityType);
    const deliveryNote = await this.deliveryNoteRepository.save({
      ...existingDeliveryNote,
      activityType,
      sequential,
      deliveryNoteMetaData,
      articleDeliveryNoteEntries: [],
      uploads: [],
      id: undefined,
      status: this.deliveryNoteLifecycleService.toPersistenceStatus(
        DELIVERY_NOTE_STATUS.Draft,
      ) as DELIVERY_NOTE_STATUS,
    });
    const articleDeliveryNoteEntries =
      await this.articleDeliveryNoteEntryService.duplicateMany(
        existingDeliveryNote.articleDeliveryNoteEntries.map(
          (entry) => entry.id,
        ),
        deliveryNote.id,
      );

    const uploads = duplicateDeliveryNoteDto.includeFiles
      ? await this.deliveryNoteStorageService.duplicateMany(
          existingDeliveryNote.uploads.map((upload) => upload.id),
          deliveryNote.id,
        )
      : [];

    const duplicatedDeliveryNote = await this.deliveryNoteRepository.save({
      ...deliveryNote,
      articleDeliveryNoteEntries,
      uploads,
    });

    return this.deliveryNoteLifecycleService.normalizeDeliveryNoteStatus(
      duplicatedDeliveryNote,
    ) as ResponseDeliveryNoteDto;
  }

  @Transactional()
  async saveFromQuotation(
    quotation: QuotationEntity,
  ): Promise<DeliveryNoteEntity> {
    const activityType = this.normalizeActivityType(quotation.activityType);
    const deliveryNote = await this.save({
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
      status: DELIVERY_NOTE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleDeliveryNoteEntries: quotation.articleQuotationEntries.map(
        (entry) => ({
          unit_price: entry.unit_price,
          quantity: entry.quantity,
          discount: entry.discount,
          discount_type: entry.discount_type,
          subTotal: entry.subTotal,
          total: entry.total,
          articleId: entry.article.id,
          article: entry.article,
          taxes: entry.articleQuotationEntryTaxes.map(
            (taxEntry) => taxEntry.taxId,
          ),
        }),
      ),
    });

    await this.quotationService.updateStatus(
      quotation.id,
      QUOTATION_STATUS.Accepted,
    );
    return deliveryNote;
  }

  @Transactional()
  async saveFromInvoice(invoice: InvoiceEntity): Promise<DeliveryNoteEntity> {
    const activityType = this.normalizeActivityType(invoice.activityType);
    return this.save({
      activityType,
      invoiceId: invoice.id,
      cabinetId: invoice.cabinetId,
      currencyId: invoice.currencyId,
      bankAccountId: invoice.bankAccountId,
      interlocutorId: invoice.interlocutorId,
      firmId: invoice.firmId,
      discount: invoice.discount,
      discount_type: invoice.discount_type,
      object: invoice.object,
      status: DELIVERY_NOTE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleDeliveryNoteEntries: invoice.articleInvoiceEntries.map(
        (entry) => ({
          unit_price: entry.unit_price,
          quantity: entry.quantity,
          discount: entry.discount,
          discount_type: entry.discount_type,
          subTotal: entry.subTotal,
          total: entry.total,
          articleId: entry.article.id,
          article: entry.article,
          taxes: entry.articleInvoiceEntryTaxes.map(
            (taxEntry) => taxEntry.taxId,
          ),
        }),
      ),
    });
  }

  @Transactional()
  async saveFromCustomerOrder(
    customerOrder: CustomerOrderEntity,
  ): Promise<DeliveryNoteEntity> {
    const activityType = this.normalizeActivityType(customerOrder.activityType);
    this.assertCustomerOrderHasArticleEntries(customerOrder);
    return this.save({
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
      notes: customerOrder.notes,
      status: DELIVERY_NOTE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      generalConditions: customerOrder.generalConditions,
      deliveryNoteMetaData: customerOrder.customerOrderMetaData
        ? {
            showInvoiceAddress:
              customerOrder.customerOrderMetaData.showInvoiceAddress,
            showDeliveryAddress:
              customerOrder.customerOrderMetaData.showDeliveryAddress,
            showArticleDescription:
              customerOrder.customerOrderMetaData.showArticleDescription,
            hasBankingDetails:
              customerOrder.customerOrderMetaData.hasBankingDetails,
            hasGeneralConditions:
              customerOrder.customerOrderMetaData.hasGeneralConditions,
            showPrices: true,
          }
        : undefined,
      articleDeliveryNoteEntries: customerOrder.articleCustomerOrderEntries.map(
        (entry) => ({
          unit_price: entry.unit_price,
          quantity: entry.quantity,
          discount: entry.discount,
          discount_type: entry.discount_type,
          subTotal: entry.subTotal,
          total: entry.total,
          articleId: entry.article.id,
          article: entry.article,
          taxes: entry.articleCustomerOrderEntryTaxes.map(
            (taxEntry) => taxEntry.taxId,
          ),
        }),
      ),
    });
  }

  @Transactional()
  async saveFromCustomerOrderAndValidate(
    customerOrder: CustomerOrderEntity,
  ): Promise<DeliveryNoteEntity> {
    this.customerOrderLifecycleService.assertCanTransformToDeliveryNote(
      customerOrder,
    );
    const deliveryNote = await this.saveFromCustomerOrder(customerOrder);
    await this.customerOrderLifecycleService.markValidatedByTransformation(
      customerOrder.id,
    );
    return deliveryNote;
  }

  @Transactional()
  async saveFromGoodsIssueNote(
    goodsIssueNote: GoodsIssueNoteEntity,
  ): Promise<DeliveryNoteEntity> {
    const activityType = this.normalizeActivityType(
      goodsIssueNote.activityType,
    );
    return this.save({
      activityType,
      cabinetId: goodsIssueNote.cabinetId,
      currencyId: goodsIssueNote.currencyId,
      bankAccountId: goodsIssueNote.bankAccountId,
      interlocutorId: goodsIssueNote.interlocutorId,
      firmId: goodsIssueNote.firmId,
      discount: goodsIssueNote.discount,
      discount_type: goodsIssueNote.discount_type,
      object: goodsIssueNote.object,
      notes: goodsIssueNote.notes,
      status: DELIVERY_NOTE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      generalConditions: goodsIssueNote.generalConditions,
      deliveryNoteMetaData: goodsIssueNote.goodsIssueNoteMetaData
        ? {
            showInvoiceAddress:
              goodsIssueNote.goodsIssueNoteMetaData.showInvoiceAddress,
            showDeliveryAddress:
              goodsIssueNote.goodsIssueNoteMetaData.showDeliveryAddress,
            showArticleDescription:
              goodsIssueNote.goodsIssueNoteMetaData.showArticleDescription,
            showPrices: goodsIssueNote.goodsIssueNoteMetaData.showPrices,
            hasBankingDetails:
              goodsIssueNote.goodsIssueNoteMetaData.hasBankingDetails,
            hasGeneralConditions:
              goodsIssueNote.goodsIssueNoteMetaData.hasGeneralConditions,
            vehicleRegistration:
              goodsIssueNote.goodsIssueNoteMetaData.vehicleRegistration,
            driverName: goodsIssueNote.goodsIssueNoteMetaData.driverName,
          }
        : undefined,
      articleDeliveryNoteEntries:
        goodsIssueNote.articleGoodsIssueNoteEntries.map((entry) => ({
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
        })),
    });
  }

  async updateMany(
    updateDeliveryNoteDtos: UpdateDeliveryNoteDto[],
  ): Promise<DeliveryNoteEntity[]> {
    return this.deliveryNoteRepository.updateMany(updateDeliveryNoteDtos);
  }

  async updateDeliveryNoteSequence(
    updatedSequenceDto: UpdateDeliveryNoteSequenceDto,
  ): Promise<DeliveryNoteSequence> {
    return this.deliveryNoteSequenceService.set(updatedSequenceDto);
  }

  async softDelete(id: number, userId?: string): Promise<DeliveryNoteEntity> {
    await this.findOneById(id, userId);
    return this.deliveryNoteRepository.softDelete(id);
  }

  async deleteAll() {
    return this.deliveryNoteRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.deliveryNoteRepository.getTotalCount();
  }

  private normalizeArticleEntriesForComparison(entries: any[] | undefined) {
    return (entries ?? []).map((entry) => ({
      articleId: entry?.articleId ?? entry?.article?.id ?? null,
      quantity: Number(entry?.quantity ?? 0),
      unit_price: Number(entry?.unit_price ?? 0),
      discount: Number(entry?.discount ?? 0),
      discount_type: entry?.discount_type ?? null,
      taxes: [
        ...new Set(
          (entry?.articleDeliveryNoteEntryTaxes ?? [])
            .map((taxEntry) => taxEntry?.taxId ?? taxEntry?.tax?.id)
            .filter((taxId): taxId is number => typeof taxId === 'number'),
        ),
      ].sort((left, right) => Number(left) - Number(right)),
    }));
  }

  private normalizeDateForComparison(value?: Date | string | null) {
    if (!value) return null;

    return new Date(value).toISOString();
  }

  private buildLockedCommercialSnapshot(deliveryNote: DeliveryNoteEntity) {
    return {
      activityType: deliveryNote.activityType ?? null,
      date: this.normalizeDateForComparison(deliveryNote.date),
      firmId: deliveryNote.firmId ?? null,
      interlocutorId: deliveryNote.interlocutorId ?? null,
      currencyId: deliveryNote.currencyId ?? null,
      bankAccountId: deliveryNote.bankAccountId ?? null,
      discount: Number(deliveryNote.discount ?? 0),
      discount_type: deliveryNote.discount_type ?? null,
      quotationId: deliveryNote.quotationId ?? null,
      customerOrderId: deliveryNote.customerOrderId ?? null,
      invoiceId: deliveryNote.invoiceId ?? null,
      articleDeliveryNoteEntries: this.normalizeArticleEntriesForComparison(
        deliveryNote.articleDeliveryNoteEntries,
      ),
    };
  }

  private buildRequestedLockedCommercialSnapshot(
    deliveryNote: DeliveryNoteEntity,
    updateDeliveryNoteDto: UpdateDeliveryNoteDto,
  ) {
    return {
      activityType:
        updateDeliveryNoteDto.activityType ?? deliveryNote.activityType ?? null,
      date: this.normalizeDateForComparison(
        updateDeliveryNoteDto.date ?? deliveryNote.date,
      ),
      firmId: updateDeliveryNoteDto.firmId ?? deliveryNote.firmId ?? null,
      interlocutorId:
        updateDeliveryNoteDto.interlocutorId ??
        deliveryNote.interlocutorId ??
        null,
      currencyId:
        updateDeliveryNoteDto.currencyId ?? deliveryNote.currencyId ?? null,
      bankAccountId:
        updateDeliveryNoteDto.bankAccountId ??
        deliveryNote.bankAccountId ??
        null,
      discount: Number(
        updateDeliveryNoteDto.discount ?? deliveryNote.discount ?? 0,
      ),
      discount_type:
        updateDeliveryNoteDto.discount_type ??
        deliveryNote.discount_type ??
        null,
      quotationId:
        updateDeliveryNoteDto.quotationId ?? deliveryNote.quotationId ?? null,
      customerOrderId:
        updateDeliveryNoteDto.customerOrderId ??
        deliveryNote.customerOrderId ??
        null,
      invoiceId:
        updateDeliveryNoteDto.invoiceId ?? deliveryNote.invoiceId ?? null,
      articleDeliveryNoteEntries: this.normalizeArticleEntriesForComparison(
        updateDeliveryNoteDto.articleDeliveryNoteEntries ??
          deliveryNote.articleDeliveryNoteEntries,
      ),
    };
  }

  private assertUpdateAllowedForCurrentStatus(
    deliveryNote: DeliveryNoteEntity,
    updateDeliveryNoteDto: UpdateDeliveryNoteDto,
  ) {
    const normalizedStatus = this.deliveryNoteLifecycleService.normalizeStatus(
      deliveryNote.status,
      this.deliveryNoteLifecycleService.hasTransformedDocuments(deliveryNote),
    );

    if (normalizedStatus === DELIVERY_NOTE_STATUS.Draft) {
      return;
    }

    if (
      normalizedStatus === DELIVERY_NOTE_STATUS.Delivered ||
      normalizedStatus === DELIVERY_NOTE_STATUS.Cancelled
    ) {
      throw new BadRequestException('deliveryNote.errors.cannot_modify_locked');
    }

    const currentSnapshot = this.buildLockedCommercialSnapshot(deliveryNote);
    const requestedSnapshot = this.buildRequestedLockedCommercialSnapshot(
      deliveryNote,
      updateDeliveryNoteDto,
    );

    if (JSON.stringify(currentSnapshot) !== JSON.stringify(requestedSnapshot)) {
      throw new BadRequestException(
        'deliveryNote.errors.created_edit_restricted',
      );
    }
  }
}
