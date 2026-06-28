import {
  BadRequestException,
  Inject,
  Injectable,
  StreamableFile,
  forwardRef,
} from '@nestjs/common';
import { GoodsIssueNoteEntity } from '../entities/goods-issue-note.entity';
import { GoodsIssueNoteNotFoundException } from '../errors/goods-issue-note.notfound.error';
import { ResponseGoodsIssueNoteDto } from '../dtos/goods-issue-note.response.dto';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { CreateGoodsIssueNoteDto } from '../dtos/goods-issue-note.create.dto';
import { UpdateGoodsIssueNoteDto } from '../dtos/goods-issue-note.update.dto';
import { CurrencyService } from 'src/modules/currency/services/currency.service';
import { FirmService } from 'src/modules/firm/services/firm.service';
import { InterlocutorService } from 'src/modules/interlocutor/services/interlocutor.service';
import { InvoicingCalculationsService } from 'src/shared/calculations/services/invoicing.calculations.service';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { ArticleGoodsIssueNoteEntryService } from './article-goods-issue-note-entry.service';
import { ArticleGoodsIssueNoteEntryEntity } from '../entities/article-goods-issue-note-entry.entity';
import { DocumentTemplateRendererService } from 'src/modules/document-template/services/document-template-renderer.service';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from 'src/modules/document-template/enums/document-template-document-type.enum';
import { isAfter } from 'date-fns';
import { GoodsIssueNoteSequenceService } from './goods-issue-note-sequence.service';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { GoodsIssueNoteMetaDataService } from './goods-issue-note-meta-data.service';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { BankAccountService } from 'src/modules/bank-account/services/bank-account.service';
import { GoodsIssueNoteStorageService } from './goods-issue-note-upload.service';
import { ResponseGoodsIssueNoteUploadDto } from '../dtos/goods-issue-note-upload.response.dto';
import { GoodsIssueNoteSequence } from '../interfaces/goods-issue-note-sequence.interface';
import { UpdateGoodsIssueNoteSequenceDto } from '../dtos/goods-issue-note-seqence.update.dto';
import { Transactional } from '@nestjs-cls/transactional';
import { DuplicateGoodsIssueNoteDto } from '../dtos/goods-issue-note.duplicate.dto';
import { GOODS_ISSUE_NOTE_STATUS } from '../enums/goods-issue-note-status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GoodsIssueNoteRepository } from '../repositories/goods-issue-note.repository';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { FIRM_ENTITY_TYPE } from 'src/modules/firm/enums/firm-entity-type.enum';
import { QuotationEntity } from 'src/modules/quotation/entities/quotation.entity';
import { InvoiceEntity } from 'src/modules/invoice/entities/invoice.entity';

import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { ArticleService } from 'src/modules/article/services/article.service';
import { MailService } from 'src/shared/mail/services/mail.service';
import { SendDocumentEmailDto } from 'src/shared/mail/dtos/send-document-email.dto';

@Injectable()
export class GoodsIssueNoteService {
  constructor(
    //repositories
    private readonly goodsIssueNoteRepository: GoodsIssueNoteRepository,
    //entity services
    private readonly articleGoodsIssueNoteEntryService: ArticleGoodsIssueNoteEntryService,
    private readonly articleService: ArticleService,
    private readonly goodsIssueNoteStorageService: GoodsIssueNoteStorageService,
    private readonly bankAccountService: BankAccountService,
    private readonly currencyService: CurrencyService,
    private readonly firmService: FirmService,
    private readonly interlocutorService: InterlocutorService,
    private readonly goodsIssueNoteSequenceService: GoodsIssueNoteSequenceService,
    private readonly goodsIssueNoteMetaDataService: GoodsIssueNoteMetaDataService,
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
          ? 'Les bon de sortie d’achat doivent être liés à un fournisseur.'
          : 'Les bon de sortie de vente doivent être liés à un client.',
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
    const { pdfBuffer } = await this.generateGoodsIssueNotePdf(
      id,
      template,
      userId,
    );

    return new StreamableFile(new Uint8Array(pdfBuffer));
  }

  private async generateGoodsIssueNotePdf(
    id: number,
    template: string,
    userId?: string,
  ): Promise<{ filename: string; pdfBuffer: Buffer | Uint8Array }> {
    const goodsIssueNote = await this.findOneById(id, userId);
    if (!goodsIssueNote) {
      throw new GoodsIssueNoteNotFoundException();
    }

    const templateId = Number(template);
    const pdfBuffer = await this.rendererService.generateDocument(
      {
        documentId: id,
        documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.GOODS_ISSUE_NOTE,
        templateId: Number.isNaN(templateId) ? undefined : templateId,
      },
      userId,
    );

    const filename = `${
      goodsIssueNote.sequential || `goods-issue-note-${goodsIssueNote.id}`
    }.pdf`;
    return { filename, pdfBuffer };
  }

  async sendEmail(
    id: number,
    payload: SendDocumentEmailDto,
    userId?: string,
  ): Promise<{ success: boolean }> {
    const { filename, pdfBuffer } = await this.generateGoodsIssueNotePdf(
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

  async findOneById(
    id: number,
    userId?: string,
  ): Promise<GoodsIssueNoteEntity> {
    const goodsIssueNote = userId
      ? await this.findOneByCondition({ filter: `id||$eq||${id}` }, userId)
      : await this.goodsIssueNoteRepository.findOneById(id);
    if (!goodsIssueNote) {
      throw new GoodsIssueNoteNotFoundException();
    }
    return goodsIssueNote;
  }

  async findOneByCondition(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<GoodsIssueNoteEntity | null> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const goodsIssueNote = await this.goodsIssueNoteRepository.findOne(
      queryOptions as FindOneOptions<GoodsIssueNoteEntity>,
    );
    if (!goodsIssueNote) return null;
    return goodsIssueNote;
  }

  async findAll(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<GoodsIssueNoteEntity[]> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    return await this.goodsIssueNoteRepository.findAll(
      queryOptions as FindManyOptions<GoodsIssueNoteEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
    userId?: string,
  ): Promise<PageDto<ResponseGoodsIssueNoteDto>> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const count = await this.goodsIssueNoteRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.goodsIssueNoteRepository.findAll(
      queryOptions as FindManyOptions<GoodsIssueNoteEntity>,
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
    createGoodsIssueNoteDto: CreateGoodsIssueNoteDto,
    userId?: string,
  ): Promise<GoodsIssueNoteEntity> {
    const cabinetId =
      (await this.getCabinetIdForUser(userId)) ??
      (
        createGoodsIssueNoteDto as CreateGoodsIssueNoteDto & {
          cabinetId?: number;
        }
      ).cabinetId;
    const activityType = this.normalizeActivityType(
      createGoodsIssueNoteDto.activityType,
    );
    const articleEntryDtos = Array.isArray(
      createGoodsIssueNoteDto.articleGoodsIssueNoteEntries,
    )
      ? createGoodsIssueNoteDto.articleGoodsIssueNoteEntries
      : [];

    // Parallelize fetching firm, bank account, and currency, as they are independent
    const [firm, bankAccount, currency] = await Promise.all([
      cabinetId
        ? this.firmService.findOneByIdInCabinet(
            createGoodsIssueNoteDto.firmId,
            cabinetId,
          )
        : this.firmService.findOneByCondition({
            filter: `id||$eq||${createGoodsIssueNoteDto.firmId}`,
          }),
      this.resolveBankAccount(createGoodsIssueNoteDto.bankAccountId, cabinetId),
      createGoodsIssueNoteDto.currencyId
        ? this.currencyService.findOneById(createGoodsIssueNoteDto.currencyId)
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
      createGoodsIssueNoteDto.interlocutorId,
    );

    if (!articleEntryDtos.length) {
      throw new BadRequestException(
        'Ajoutez au moins un article au bon de sortie.',
      );
    }

    await this.articleService.assertArticlesBelongToCabinet(
      articleEntryDtos.map((entry) => entry.articleId),
      cabinetId,
    );

    const articleEntries =
      await this.articleGoodsIssueNoteEntryService.saveMany(
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
        createGoodsIssueNoteDto.discount,
        createGoodsIssueNoteDto.discount_type,
      );

    // Format articleEntries as lineItems for tax calculations
    const lineItems =
      await this.articleGoodsIssueNoteEntryService.findManyAsLineItem(
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

    // Fetch the latest sequential number for goodsIssueNote
    const sequential =
      await this.goodsIssueNoteSequenceService.getSequential(activityType);

    // Save goodsIssueNote metadata
    const goodsIssueNoteMetaData =
      await this.goodsIssueNoteMetaDataService.save({
        ...createGoodsIssueNoteDto.goodsIssueNoteMetaData,
        taxSummary,
      });

    // Save the goodsIssueNote entity
    const goodsIssueNote = await this.goodsIssueNoteRepository.save({
      ...createGoodsIssueNoteDto,
      activityType,
      bankAccountId: bankAccount.id,
      currencyId: currency ? currency.id : firm.currencyId,
      cabinetId,
      sequential,
      articleGoodsIssueNoteEntries: articleEntries,
      goodsIssueNoteMetaData,
      subTotal,
      total: totalAfterGeneralDiscount,
    });

    // Handle file uploads if they exist
    if (createGoodsIssueNoteDto.uploads) {
      await Promise.all(
        createGoodsIssueNoteDto.uploads.map((u) =>
          this.goodsIssueNoteStorageService.save(goodsIssueNote.id, u.uploadId),
        ),
      );
    }

    return goodsIssueNote;
  }

  async saveMany(
    createGoodsIssueNoteDtos: CreateGoodsIssueNoteDto[],
  ): Promise<GoodsIssueNoteEntity[]> {
    const goodsIssueNotes = [];
    for (const createGoodsIssueNoteDto of createGoodsIssueNoteDtos) {
      const goodsIssueNote = await this.save(createGoodsIssueNoteDto);
      goodsIssueNotes.push(goodsIssueNote);
    }
    return goodsIssueNotes;
  }

  async updateGoodsIssueNoteUploads(
    id: number,
    updateGoodsIssueNoteDto: UpdateGoodsIssueNoteDto,
    existingUploads: ResponseGoodsIssueNoteUploadDto[],
  ) {
    const newUploads = [];
    const keptUploads = [];
    const eliminatedUploads = [];

    if (updateGoodsIssueNoteDto.uploads) {
      for (const upload of existingUploads) {
        const exists = updateGoodsIssueNoteDto.uploads.some(
          (u) => u.id === upload.id,
        );
        if (!exists)
          eliminatedUploads.push(
            await this.goodsIssueNoteStorageService.softDelete(upload.id),
          );
        else keptUploads.push(upload);
      }
      for (const upload of updateGoodsIssueNoteDto.uploads) {
        if (!upload.id)
          newUploads.push(
            await this.goodsIssueNoteStorageService.save(id, upload.uploadId),
          );
      }
    }
    return { keptUploads, newUploads, eliminatedUploads };
  }

  @Transactional()
  async update(
    id: number,
    updateGoodsIssueNoteDto: UpdateGoodsIssueNoteDto,
    userId?: string,
  ): Promise<GoodsIssueNoteEntity> {
    // Retrieve the existing goodsIssueNote with necessary relations
    const existingGoodsIssueNoteWithUploads = await this.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'articleGoodsIssueNoteEntries,goodsIssueNoteMetaData,uploads',
      },
      userId,
    );
    if (!existingGoodsIssueNoteWithUploads) {
      throw new GoodsIssueNoteNotFoundException();
    }
    const { uploads: existingUploads, ...existingGoodsIssueNote } =
      existingGoodsIssueNoteWithUploads;
    const cabinetId = existingGoodsIssueNote.cabinetId;
    const activityType = this.normalizeActivityType(
      updateGoodsIssueNoteDto.activityType ??
        existingGoodsIssueNote.activityType,
    );

    // Fetch and validate related entities in parallel to optimize performance
    const [firm, bankAccount, currency, interlocutor] = await Promise.all([
      this.firmService.findOneByIdInCabinet(
        updateGoodsIssueNoteDto.firmId ?? existingGoodsIssueNote.firmId,
        cabinetId,
      ),
      this.resolveBankAccount(
        updateGoodsIssueNoteDto.bankAccountId ??
          existingGoodsIssueNote.bankAccountId,
        cabinetId,
      ),
      updateGoodsIssueNoteDto.currencyId
        ? this.currencyService.findOneById(updateGoodsIssueNoteDto.currencyId)
        : null,
      updateGoodsIssueNoteDto.interlocutorId
        ? this.interlocutorService.findOneById(
            updateGoodsIssueNoteDto.interlocutorId,
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
      await this.articleGoodsIssueNoteEntryService.softDeleteMany(
        existingGoodsIssueNote.articleGoodsIssueNoteEntries.map(
          (entry) => entry.id,
        ),
      );

    // Save new article entries
    const articleEntries: ArticleGoodsIssueNoteEntryEntity[] =
      updateGoodsIssueNoteDto.articleGoodsIssueNoteEntries
        ? (await this.articleService.assertArticlesBelongToCabinet(
            updateGoodsIssueNoteDto.articleGoodsIssueNoteEntries.map(
              (entry) => entry.articleId,
            ),
            cabinetId,
          ),
          await this.articleGoodsIssueNoteEntryService.saveMany(
            updateGoodsIssueNoteDto.articleGoodsIssueNoteEntries,
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
        updateGoodsIssueNoteDto.discount,
        updateGoodsIssueNoteDto.discount_type,
      );

    // Convert article entries to line items for further calculations
    const lineItems =
      await this.articleGoodsIssueNoteEntryService.findManyAsLineItem(
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

    // Save or update the goodsIssueNote metadata with the updated tax summary
    const goodsIssueNoteMetaData =
      await this.goodsIssueNoteMetaDataService.save({
        ...existingGoodsIssueNote.goodsIssueNoteMetaData,
        ...updateGoodsIssueNoteDto.goodsIssueNoteMetaData,
        taxSummary,
      });

    // Handle uploads - manage existing, new, and eliminated uploads
    const { keptUploads, newUploads, eliminatedUploads } =
      await this.updateGoodsIssueNoteUploads(
        existingGoodsIssueNote.id,
        updateGoodsIssueNoteDto,
        existingUploads,
      );

    // Save and return the updated goodsIssueNote with all updated details
    return this.goodsIssueNoteRepository.save({
      id: existingGoodsIssueNote.id,
      ...updateGoodsIssueNoteDto,
      activityType,
      bankAccountId: bankAccount.id,
      currencyId: currency ? currency.id : firm.currencyId,
      firmId: firm.id,
      interlocutorId: interlocutor ? interlocutor.id : null,
      cabinetId,
      articleGoodsIssueNoteEntries: articleEntries,
      goodsIssueNoteMetaData,
      subTotal,
      total: totalAfterGeneralDiscount,
      uploads: [...keptUploads, ...newUploads, ...eliminatedUploads],
    });
  }

  @Transactional()
  async saveFromQuotation(
    quotation: QuotationEntity,
  ): Promise<GoodsIssueNoteEntity> {
    const activityType = this.normalizeActivityType(quotation.activityType);
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
      status: GOODS_ISSUE_NOTE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleGoodsIssueNoteEntries: quotation.articleQuotationEntries.map(
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
  }

  @Transactional()
  async saveFromInvoice(invoice: InvoiceEntity): Promise<GoodsIssueNoteEntity> {
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
      status: GOODS_ISSUE_NOTE_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleGoodsIssueNoteEntries: invoice.articleInvoiceEntries.map(
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

  async duplicate(
    duplicateGoodsIssueNoteDto: DuplicateGoodsIssueNoteDto,
    userId?: string,
  ): Promise<ResponseGoodsIssueNoteDto> {
    const existingGoodsIssueNote = await this.findOneByCondition(
      {
        filter: `id||$eq||${duplicateGoodsIssueNoteDto.id}`,
        join: new String().concat(
          'goodsIssueNoteMetaData,',
          'articleGoodsIssueNoteEntries,',
          'articleGoodsIssueNoteEntries.articleGoodsIssueNoteEntryTaxes,',
          'uploads',
        ),
      },
      userId,
    );
    if (!existingGoodsIssueNote) {
      throw new GoodsIssueNoteNotFoundException();
    }
    const goodsIssueNoteMetaData =
      await this.goodsIssueNoteMetaDataService.duplicate(
        existingGoodsIssueNote.goodsIssueNoteMetaData.id,
      );
    const activityType = this.normalizeActivityType(
      existingGoodsIssueNote.activityType,
    );
    const sequential =
      await this.goodsIssueNoteSequenceService.getSequential(activityType);
    const goodsIssueNote = await this.goodsIssueNoteRepository.save({
      ...existingGoodsIssueNote,
      activityType,
      sequential,
      goodsIssueNoteMetaData,
      articleGoodsIssueNoteEntries: [],
      uploads: [],
      id: undefined,
      status: GOODS_ISSUE_NOTE_STATUS.Draft,
    });
    const articleGoodsIssueNoteEntries =
      await this.articleGoodsIssueNoteEntryService.duplicateMany(
        existingGoodsIssueNote.articleGoodsIssueNoteEntries.map(
          (entry) => entry.id,
        ),
        goodsIssueNote.id,
      );

    const uploads = duplicateGoodsIssueNoteDto.includeFiles
      ? await this.goodsIssueNoteStorageService.duplicateMany(
          existingGoodsIssueNote.uploads.map((upload) => upload.id),
          goodsIssueNote.id,
        )
      : [];

    return this.goodsIssueNoteRepository.save({
      ...goodsIssueNote,
      articleGoodsIssueNoteEntries,
      uploads,
    });
  }

  @Transactional()
  async updateStatus(
    id: number,
    status: GOODS_ISSUE_NOTE_STATUS,
    userId?: string,
  ): Promise<GoodsIssueNoteEntity> {
    const goodsIssueNote = await this.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'articleGoodsIssueNoteEntries,articleGoodsIssueNoteEntries.article',
      },
      userId,
    );

    if (!goodsIssueNote) {
      throw new GoodsIssueNoteNotFoundException();
    }

    return this.goodsIssueNoteRepository.save({
      id: goodsIssueNote.id,
      status,
    });
  }

  async updateMany(
    updateGoodsIssueNoteDtos: UpdateGoodsIssueNoteDto[],
  ): Promise<GoodsIssueNoteEntity[]> {
    return this.goodsIssueNoteRepository.updateMany(updateGoodsIssueNoteDtos);
  }

  async updateGoodsIssueNoteSequence(
    updatedSequenceDto: UpdateGoodsIssueNoteSequenceDto,
  ): Promise<GoodsIssueNoteSequence> {
    return this.goodsIssueNoteSequenceService.set(updatedSequenceDto);
  }

  @Transactional()
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredGoodsIssueNotes() {
    const currentDate = new Date();
    const expiredGoodsIssueNotes: GoodsIssueNoteEntity[] =
      await this.goodsIssueNoteRepository.findAll({
        where: { status: GOODS_ISSUE_NOTE_STATUS.Sent },
      });
    const goodsIssueNotesToExpire = expiredGoodsIssueNotes.filter(
      (goodsIssueNote) =>
        isAfter(currentDate, new Date(goodsIssueNote.dueDate)),
    );

    if (goodsIssueNotesToExpire.length) {
      for (const goodsIssueNote of goodsIssueNotesToExpire) {
        goodsIssueNote.status = GOODS_ISSUE_NOTE_STATUS.Expired;
        await this.goodsIssueNoteRepository.save(goodsIssueNote);
      }
    }
  }

  async softDelete(id: number, userId?: string): Promise<GoodsIssueNoteEntity> {
    await this.findOneById(id, userId);
    return this.goodsIssueNoteRepository.softDelete(id);
  }

  async deleteAll() {
    return this.goodsIssueNoteRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.goodsIssueNoteRepository.getTotalCount();
  }
}
