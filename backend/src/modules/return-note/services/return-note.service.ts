import {
  BadRequestException,
  Inject,
  Injectable,
  StreamableFile,
  forwardRef,
} from '@nestjs/common';
import { ReturnNoteEntity } from '../entities/return-note.entity';
import { ReturnNoteNotFoundException } from '../errors/return-note.notfound.error';
import { ResponseReturnNoteDto } from '../dtos/return-note.response.dto';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { CreateReturnNoteDto } from '../dtos/return-note.create.dto';
import { UpdateReturnNoteDto } from '../dtos/return-note.update.dto';
import { CurrencyService } from 'src/modules/currency/services/currency.service';
import { FirmService } from 'src/modules/firm/services/firm.service';
import { InterlocutorService } from 'src/modules/interlocutor/services/interlocutor.service';
import { InvoicingCalculationsService } from 'src/shared/calculations/services/invoicing.calculations.service';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { ArticleReturnNoteEntryService } from './article-return-note-entry.service';
import { ArticleReturnNoteEntryEntity } from '../entities/article-return-note-entry.entity';
import { DocumentTemplateRendererService } from 'src/modules/document-template/services/document-template-renderer.service';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from 'src/modules/document-template/enums/document-template-document-type.enum';
import { isAfter } from 'date-fns';
import { ReturnNoteSequenceService } from './return-note-sequence.service';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { ReturnNoteMetaDataService } from './return-note-meta-data.service';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { BankAccountService } from 'src/modules/bank-account/services/bank-account.service';
import { ReturnNoteStorageService } from './return-note-upload.service';
import { ResponseReturnNoteUploadDto } from '../dtos/return-note-upload.response.dto';
import { ReturnNoteSequence } from '../interfaces/return-note-sequence.interface';
import { UpdateReturnNoteSequenceDto } from '../dtos/return-note-seqence.update.dto';
import { Transactional } from '@nestjs-cls/transactional';
import { DuplicateReturnNoteDto } from '../dtos/return-note.duplicate.dto';
import { RETURN_NOTE_STATUS } from '../enums/return-note-status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReturnNoteRepository } from '../repositories/return-note.repository';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { FIRM_ENTITY_TYPE } from 'src/modules/firm/enums/firm-entity-type.enum';
import { DeliveryNoteEntity } from 'src/modules/delivery-note/entities/delivery-note.entity';
import { GoodsIssueNoteEntity } from 'src/modules/goods-issue-note/entities/goods-issue-note.entity';
import { InvoiceEntity } from 'src/modules/invoice/entities/invoice.entity';

import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { ArticleService } from 'src/modules/article/services/article.service';
import { MailService } from 'src/shared/mail/services/mail.service';
import { SendDocumentEmailDto } from 'src/shared/mail/dtos/send-document-email.dto';

@Injectable()
export class ReturnNoteService {
  constructor(
    //repositories
    private readonly returnNoteRepository: ReturnNoteRepository,
    //entity services
    private readonly articleReturnNoteEntryService: ArticleReturnNoteEntryService,
    private readonly articleService: ArticleService,
    private readonly returnNoteStorageService: ReturnNoteStorageService,
    private readonly bankAccountService: BankAccountService,
    private readonly currencyService: CurrencyService,
    private readonly firmService: FirmService,
    private readonly interlocutorService: InterlocutorService,
    private readonly returnNoteSequenceService: ReturnNoteSequenceService,
    private readonly returnNoteMetaDataService: ReturnNoteMetaDataService,
    private readonly taxService: TaxService,

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
          ? 'Les devis d’achat doivent être liés à un fournisseur.'
          : 'Les devis de vente doivent être liés à un client.',
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
    const { pdfBuffer } = await this.generateReturnNotePdf(
      id,
      template,
      userId,
    );

    return new StreamableFile(new Uint8Array(pdfBuffer));
  }

  private async generateReturnNotePdf(
    id: number,
    template: string,
    userId?: string,
  ): Promise<{ filename: string; pdfBuffer: Buffer | Uint8Array }> {
    const returnNote = await this.findOneById(id, userId);
    if (!returnNote) {
      throw new ReturnNoteNotFoundException();
    }

    const templateId = Number(template);
    const pdfBuffer = await this.rendererService.generateDocument(
      {
        documentId: id,
        documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.RETURN_NOTE,
        templateId: Number.isNaN(templateId) ? undefined : templateId,
      },
      userId,
    );

    const filename = `${
      returnNote.sequential || `return-note-${returnNote.id}`
    }.pdf`;
    return { filename, pdfBuffer };
  }

  async sendEmail(
    id: number,
    payload: SendDocumentEmailDto,
    userId?: string,
  ): Promise<{ success: boolean }> {
    const { filename, pdfBuffer } = await this.generateReturnNotePdf(
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

  async findOneById(id: number, userId?: string): Promise<ReturnNoteEntity> {
    const returnNote = userId
      ? await this.findOneByCondition({ filter: `id||$eq||${id}` }, userId)
      : await this.returnNoteRepository.findOneById(id);
    if (!returnNote) {
      throw new ReturnNoteNotFoundException();
    }
    return returnNote;
  }

  async findOneByCondition(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<ReturnNoteEntity | null> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const returnNote = await this.returnNoteRepository.findOne(
      queryOptions as FindOneOptions<ReturnNoteEntity>,
    );
    if (!returnNote) return null;
    return returnNote;
  }

  async findAll(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<ReturnNoteEntity[]> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    return await this.returnNoteRepository.findAll(
      queryOptions as FindManyOptions<ReturnNoteEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
    userId?: string,
  ): Promise<PageDto<ResponseReturnNoteDto>> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const count = await this.returnNoteRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.returnNoteRepository.findAll(
      queryOptions as FindManyOptions<ReturnNoteEntity>,
    );

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: {
        page: parseInt(query.page),
        take: parseInt(query.limit),
      },
      itemCount: count,
    });

    return new PageDto(entities, pageMetaDto);
  }

  @Transactional()
  async save(
    createReturnNoteDto: CreateReturnNoteDto,
    userId?: string,
  ): Promise<ReturnNoteEntity> {
    const cabinetId =
      (await this.getCabinetIdForUser(userId)) ??
      (createReturnNoteDto as CreateReturnNoteDto & { cabinetId?: number })
        .cabinetId;
    const activityType = this.normalizeActivityType(
      createReturnNoteDto.activityType,
    );
    const articleEntryDtos = Array.isArray(
      createReturnNoteDto.articleReturnNoteEntries,
    )
      ? createReturnNoteDto.articleReturnNoteEntries
      : [];

    // Parallelize fetching firm, bank account, and currency, as they are independent
    const [firm, bankAccount, currency] = await Promise.all([
      cabinetId
        ? this.firmService.findOneByIdInCabinet(
            createReturnNoteDto.firmId,
            cabinetId,
          )
        : this.firmService.findOneByCondition({
            filter: `id||$eq||${createReturnNoteDto.firmId}`,
          }),
      this.resolveBankAccount(createReturnNoteDto.bankAccountId, cabinetId),
      createReturnNoteDto.currencyId
        ? this.currencyService.findOneById(createReturnNoteDto.currencyId)
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
      createReturnNoteDto.interlocutorId,
    );

    if (!articleEntryDtos.length) {
      throw new BadRequestException('Ajoutez au moins un article au devis.');
    }

    await this.articleService.assertArticlesBelongToCabinet(
      articleEntryDtos.map((entry) => entry.articleId),
      cabinetId,
    );

    const articleEntries = await this.articleReturnNoteEntryService.saveMany(
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
        createReturnNoteDto.discount,
        createReturnNoteDto.discount_type,
      );

    // Format articleEntries as lineItems for tax calculations
    const lineItems =
      await this.articleReturnNoteEntryService.findManyAsLineItem(
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

    // Fetch the latest sequential number for returnNote
    const sequential =
      await this.returnNoteSequenceService.getSequential(activityType);

    // Save returnNote metadata
    const returnNoteMetaData = await this.returnNoteMetaDataService.save({
      ...createReturnNoteDto.returnNoteMetaData,
      taxSummary,
    });

    // Save the returnNote entity
    const returnNote = await this.returnNoteRepository.save({
      ...createReturnNoteDto,
      activityType,
      bankAccountId: bankAccount.id,
      currencyId: currency ? currency.id : firm.currencyId,
      cabinetId,
      sequential,
      articleReturnNoteEntries: articleEntries,
      returnNoteMetaData,
      subTotal,
      total: totalAfterGeneralDiscount,
    });

    // Handle file uploads if they exist
    if (createReturnNoteDto.uploads) {
      await Promise.all(
        createReturnNoteDto.uploads.map((u) =>
          this.returnNoteStorageService.save(returnNote.id, u.uploadId),
        ),
      );
    }

    return returnNote;
  }

  async saveMany(
    createReturnNoteDtos: CreateReturnNoteDto[],
  ): Promise<ReturnNoteEntity[]> {
    const returnNotes = [];
    for (const createReturnNoteDto of createReturnNoteDtos) {
      const returnNote = await this.save(createReturnNoteDto);
      returnNotes.push(returnNote);
    }
    return returnNotes;
  }

  async updateReturnNoteUploads(
    id: number,
    updateReturnNoteDto: UpdateReturnNoteDto,
    existingUploads: ResponseReturnNoteUploadDto[],
  ) {
    const newUploads = [];
    const keptUploads = [];
    const eliminatedUploads = [];

    if (updateReturnNoteDto.uploads) {
      for (const upload of existingUploads) {
        const exists = updateReturnNoteDto.uploads.some(
          (u) => u.id === upload.id,
        );
        if (!exists)
          eliminatedUploads.push(
            await this.returnNoteStorageService.softDelete(upload.id),
          );
        else keptUploads.push(upload);
      }
      for (const upload of updateReturnNoteDto.uploads) {
        if (!upload.id)
          newUploads.push(
            await this.returnNoteStorageService.save(id, upload.uploadId),
          );
      }
    }
    return { keptUploads, newUploads, eliminatedUploads };
  }

  @Transactional()
  async update(
    id: number,
    updateReturnNoteDto: UpdateReturnNoteDto,
    userId?: string,
  ): Promise<ReturnNoteEntity> {
    // Retrieve the existing returnNote with necessary relations
    const existingReturnNoteWithUploads = await this.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'articleReturnNoteEntries,returnNoteMetaData,uploads',
      },
      userId,
    );
    if (!existingReturnNoteWithUploads) {
      throw new ReturnNoteNotFoundException();
    }
    const { uploads: existingUploads, ...existingReturnNote } =
      existingReturnNoteWithUploads;
    const cabinetId = existingReturnNote.cabinetId;
    const activityType = this.normalizeActivityType(
      updateReturnNoteDto.activityType ?? existingReturnNote.activityType,
    );

    // Fetch and validate related entities in parallel to optimize performance
    const [firm, bankAccount, currency, interlocutor] = await Promise.all([
      this.firmService.findOneByIdInCabinet(
        updateReturnNoteDto.firmId ?? existingReturnNote.firmId,
        cabinetId,
      ),
      this.resolveBankAccount(
        updateReturnNoteDto.bankAccountId ?? existingReturnNote.bankAccountId,
        cabinetId,
      ),
      updateReturnNoteDto.currencyId
        ? this.currencyService.findOneById(updateReturnNoteDto.currencyId)
        : null,
      updateReturnNoteDto.interlocutorId
        ? this.interlocutorService.findOneById(
            updateReturnNoteDto.interlocutorId,
          )
        : null,
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

    // Soft delete old article entries to prepare for new ones
    const existingArticles =
      await this.articleReturnNoteEntryService.softDeleteMany(
        existingReturnNote.articleReturnNoteEntries.map((entry) => entry.id),
      );

    // Save new article entries
    const articleEntries: ArticleReturnNoteEntryEntity[] =
      updateReturnNoteDto.articleReturnNoteEntries
        ? (await this.articleService.assertArticlesBelongToCabinet(
            updateReturnNoteDto.articleReturnNoteEntries.map(
              (entry) => entry.articleId,
            ),
            cabinetId,
          ),
          await this.articleReturnNoteEntryService.saveMany(
            updateReturnNoteDto.articleReturnNoteEntries,
            cabinetId,
          ))
        : existingArticles;

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
        updateReturnNoteDto.discount,
        updateReturnNoteDto.discount_type,
      );

    // Convert article entries to line items for further calculations
    const lineItems =
      await this.articleReturnNoteEntryService.findManyAsLineItem(
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

    // Save or update the returnNote metadata with the updated tax summary
    const returnNoteMetaData = await this.returnNoteMetaDataService.save({
      ...existingReturnNote.returnNoteMetaData,
      ...updateReturnNoteDto.returnNoteMetaData,
      taxSummary,
    });

    // Handle uploads - manage existing, new, and eliminated uploads
    const { keptUploads, newUploads, eliminatedUploads } =
      await this.updateReturnNoteUploads(
        existingReturnNote.id,
        updateReturnNoteDto,
        existingUploads,
      );

    // Save and return the updated returnNote with all updated details
    return this.returnNoteRepository.save({
      id: existingReturnNote.id,
      ...updateReturnNoteDto,
      activityType,
      bankAccountId: bankAccount.id,
      currencyId: currency ? currency.id : firm.currencyId,
      firmId: firm.id,
      interlocutorId: interlocutor ? interlocutor.id : null,
      cabinetId,
      articleReturnNoteEntries: articleEntries,
      returnNoteMetaData,
      subTotal,
      total: totalAfterGeneralDiscount,
      uploads: [...keptUploads, ...newUploads, ...eliminatedUploads],
    });
  }

  @Transactional()
  async saveFromDeliveryNote(
    deliveryNote: DeliveryNoteEntity,
  ): Promise<ReturnNoteEntity> {
    const activityType = this.normalizeActivityType(deliveryNote.activityType);
    this.assertDeliveryNoteHasArticleEntries(deliveryNote);
    return this.save({
      activityType,
      sourceDeliveryNoteId: deliveryNote.id,
      cabinetId: deliveryNote.cabinetId,
      currencyId: deliveryNote.currencyId,
      bankAccountId: deliveryNote.bankAccountId,
      interlocutorId: deliveryNote.interlocutorId,
      firmId: deliveryNote.firmId,
      discount: deliveryNote.discount,
      discount_type: deliveryNote.discount_type,
      object: deliveryNote.object,
      status: RETURN_NOTE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleReturnNoteEntries: deliveryNote.articleDeliveryNoteEntries.map(
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
  ): Promise<ReturnNoteEntity> {
    const activityType = this.normalizeActivityType(
      goodsIssueNote.activityType,
    );
    return this.save({
      activityType,
      sourceGoodsIssueNoteId: goodsIssueNote.id,
      cabinetId: goodsIssueNote.cabinetId,
      currencyId: goodsIssueNote.currencyId,
      bankAccountId: goodsIssueNote.bankAccountId,
      interlocutorId: goodsIssueNote.interlocutorId,
      firmId: goodsIssueNote.firmId,
      discount: goodsIssueNote.discount,
      discount_type: goodsIssueNote.discount_type,
      object: goodsIssueNote.object,
      status: RETURN_NOTE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleReturnNoteEntries: goodsIssueNote.articleGoodsIssueNoteEntries.map(
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
  async saveFromInvoice(invoice: InvoiceEntity): Promise<ReturnNoteEntity> {
    const activityType = this.normalizeActivityType(invoice.activityType);
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
      status: RETURN_NOTE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleReturnNoteEntries: invoice.articleInvoiceEntries.map((entry) => ({
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

  async duplicate(
    duplicateReturnNoteDto: DuplicateReturnNoteDto,
    userId?: string,
  ): Promise<ResponseReturnNoteDto> {
    const existingReturnNote = await this.findOneByCondition(
      {
        filter: `id||$eq||${duplicateReturnNoteDto.id}`,
        join: new String().concat(
          'returnNoteMetaData,',
          'articleReturnNoteEntries,',
          'articleReturnNoteEntries.articleReturnNoteEntryTaxes,',
          'uploads',
        ),
      },
      userId,
    );
    if (!existingReturnNote) {
      throw new ReturnNoteNotFoundException();
    }
    const returnNoteMetaData = await this.returnNoteMetaDataService.duplicate(
      existingReturnNote.returnNoteMetaData.id,
    );
    const activityType = this.normalizeActivityType(
      existingReturnNote.activityType,
    );
    const sequential =
      await this.returnNoteSequenceService.getSequential(activityType);
    const returnNote = await this.returnNoteRepository.save({
      ...existingReturnNote,
      activityType,
      sequential,
      returnNoteMetaData,
      articleReturnNoteEntries: [],
      uploads: [],
      id: undefined,
      status: RETURN_NOTE_STATUS.Draft,
    });
    const articleReturnNoteEntries =
      await this.articleReturnNoteEntryService.duplicateMany(
        existingReturnNote.articleReturnNoteEntries.map((entry) => entry.id),
        returnNote.id,
      );

    const uploads = duplicateReturnNoteDto.includeFiles
      ? await this.returnNoteStorageService.duplicateMany(
          existingReturnNote.uploads.map((upload) => upload.id),
          returnNote.id,
        )
      : [];

    return this.returnNoteRepository.save({
      ...returnNote,
      articleReturnNoteEntries,
      uploads,
    });
  }

  @Transactional()
  async updateStatus(
    id: number,
    status: RETURN_NOTE_STATUS,
    userId?: string,
  ): Promise<ReturnNoteEntity> {
    const returnNote = await this.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'articleReturnNoteEntries,articleReturnNoteEntries.article',
      },
      userId,
    );

    if (!returnNote) {
      throw new ReturnNoteNotFoundException();
    }

    return this.returnNoteRepository.save({ id: returnNote.id, status });
  }

  async updateMany(
    updateReturnNoteDtos: UpdateReturnNoteDto[],
  ): Promise<ReturnNoteEntity[]> {
    return this.returnNoteRepository.updateMany(updateReturnNoteDtos);
  }

  async updateReturnNoteSequence(
    updatedSequenceDto: UpdateReturnNoteSequenceDto,
  ): Promise<ReturnNoteSequence> {
    return this.returnNoteSequenceService.set(updatedSequenceDto);
  }

  @Transactional()
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredReturnNotes() {
    const currentDate = new Date();
    const expiredReturnNotes: ReturnNoteEntity[] =
      await this.returnNoteRepository.findAll({
        where: { status: RETURN_NOTE_STATUS.Sent },
      });
    const returnNotesToExpire = expiredReturnNotes.filter((returnNote) =>
      isAfter(currentDate, new Date(returnNote.dueDate)),
    );

    if (returnNotesToExpire.length) {
      for (const returnNote of returnNotesToExpire) {
        returnNote.status = RETURN_NOTE_STATUS.Expired;
        await this.returnNoteRepository.save(returnNote);
      }
    }
  }

  async softDelete(id: number, userId?: string): Promise<ReturnNoteEntity> {
    await this.findOneById(id, userId);
    return this.returnNoteRepository.softDelete(id);
  }

  async deleteAll() {
    return this.returnNoteRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.returnNoteRepository.getTotalCount();
  }
}
