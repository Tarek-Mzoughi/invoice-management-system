import {
  BadRequestException,
  Inject,
  Injectable,
  StreamableFile,
  forwardRef,
} from '@nestjs/common';
import { QuotationEntity } from '../entities/quotation.entity';
import { QuotationNotFoundException } from '../errors/quotation.notfound.error';
import { ResponseQuotationDto } from '../dtos/quotation.response.dto';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { CreateQuotationDto } from '../dtos/quotation.create.dto';
import { UpdateQuotationDto } from '../dtos/quotation.update.dto';
import { CurrencyService } from 'src/modules/currency/services/currency.service';
import { FirmService } from 'src/modules/firm/services/firm.service';
import { InterlocutorService } from 'src/modules/interlocutor/services/interlocutor.service';
import { InvoicingCalculationsService } from 'src/shared/calculations/services/invoicing.calculations.service';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { ArticleQuotationEntryService } from './article-quotation-entry.service';
import { ArticleQuotationEntryEntity } from '../entities/article-quotation-entry.entity';
import { DocumentTemplateRendererService } from 'src/modules/document-template/services/document-template-renderer.service';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from 'src/modules/document-template/enums/document-template-document-type.enum';
import { isAfter } from 'date-fns';
import { QuotationSequenceService } from './quotation-sequence.service';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { QuotationMetaDataService } from './quotation-meta-data.service';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { BankAccountService } from 'src/modules/bank-account/services/bank-account.service';
import { QuotationStorageService } from './quotation-upload.service';
import { ResponseQuotationUploadDto } from '../dtos/quotation-upload.response.dto';
import { QuotationSequence } from '../interfaces/quotation-sequence.interface';
import { UpdateQuotationSequenceDto } from '../dtos/quotation-seqence.update.dto';
import { Transactional } from '@nestjs-cls/transactional';
import { DuplicateQuotationDto } from '../dtos/quotation.duplicate.dto';
import { QUOTATION_STATUS } from '../enums/quotation-status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QuotationRepository } from '../repositories/quotation.repository';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { FIRM_ENTITY_TYPE } from 'src/modules/firm/enums/firm-entity-type.enum';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { ArticleService } from 'src/modules/article/services/article.service';
import { MailService } from 'src/shared/mail/services/mail.service';
import { SendQuotationEmailDto } from '../dtos/quotation-send-email.dto';

@Injectable()
export class QuotationService {
  constructor(
    //repositories
    private readonly quotationRepository: QuotationRepository,
    //entity services
    private readonly articleQuotationEntryService: ArticleQuotationEntryService,
    private readonly articleService: ArticleService,
    private readonly quotationStorageService: QuotationStorageService,
    private readonly bankAccountService: BankAccountService,
    private readonly currencyService: CurrencyService,
    private readonly firmService: FirmService,
    private readonly interlocutorService: InterlocutorService,
    private readonly quotationSequenceService: QuotationSequenceService,
    private readonly quotationMetaDataService: QuotationMetaDataService,
    private readonly taxService: TaxService,

    //abstract services
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
    const { pdfBuffer } = await this.generateQuotationPdf(id, template, userId);

    return new StreamableFile(new Uint8Array(pdfBuffer));
  }

  private async generateQuotationPdf(
    id: number,
    template: string,
    userId?: string,
  ): Promise<{ filename: string; pdfBuffer: Buffer | Uint8Array }> {
    const quotation = await this.findOneById(id, userId);
    if (!quotation) {
      throw new QuotationNotFoundException();
    }

    const templateId = Number(template);
    const pdfBuffer = await this.rendererService.generateDocument(
      {
        documentId: id,
        documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.QUOTE,
        templateId: Number.isNaN(templateId) ? undefined : templateId,
      },
      userId,
    );

    const filename = `${quotation.sequential || `quotation-${quotation.id}`}.pdf`;
    return { filename, pdfBuffer };
  }

  async sendEmail(
    id: number,
    payload: SendQuotationEmailDto,
    userId?: string,
  ): Promise<{ success: boolean }> {
    const { filename, pdfBuffer } = await this.generateQuotationPdf(
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

  async findOneById(id: number, userId?: string): Promise<QuotationEntity> {
    const quotation = userId
      ? await this.findOneByCondition({ filter: `id||$eq||${id}` }, userId)
      : await this.quotationRepository.findOneById(id);
    if (!quotation) {
      throw new QuotationNotFoundException();
    }
    return quotation as QuotationEntity;
  }

  async findOneByCondition(
    query: IQueryObject,
    userId?: string,
  ): Promise<QuotationEntity | null> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const quotation = await this.quotationRepository.findOne(
      queryOptions as FindOneOptions<QuotationEntity>,
    );
    if (!quotation) return null;
    return quotation;
  }

  async findAll(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<QuotationEntity[]> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    return await this.quotationRepository.findAll(
      queryOptions as FindManyOptions<QuotationEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
    userId?: string,
  ): Promise<PageDto<ResponseQuotationDto>> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const count = await this.quotationRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.quotationRepository.findAll(
      queryOptions as FindManyOptions<QuotationEntity>,
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
    createQuotationDto: CreateQuotationDto,
    userId?: string,
  ): Promise<QuotationEntity> {
    const cabinetId =
      (await this.getCabinetIdForUser(userId)) ??
      (createQuotationDto as CreateQuotationDto & { cabinetId?: number })
        .cabinetId;
    const activityType = this.normalizeActivityType(
      createQuotationDto.activityType,
    );
    const articleEntryDtos = Array.isArray(
      createQuotationDto.articleQuotationEntries,
    )
      ? createQuotationDto.articleQuotationEntries
      : [];

    // Parallelize fetching firm, bank account, and currency, as they are independent
    const [firm, bankAccount, currency] = await Promise.all([
      cabinetId
        ? this.firmService.findOneByIdInCabinet(
            createQuotationDto.firmId,
            cabinetId,
          )
        : this.firmService.findOneByCondition({
            filter: `id||$eq||${createQuotationDto.firmId}`,
          }),
      this.resolveBankAccount(createQuotationDto.bankAccountId, cabinetId),
      createQuotationDto.currencyId
        ? this.currencyService.findOneById(createQuotationDto.currencyId)
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
      createQuotationDto.interlocutorId,
    );

    if (!articleEntryDtos.length) {
      throw new BadRequestException('Ajoutez au moins un article au devis.');
    }

    await this.articleService.assertArticlesBelongToCabinet(
      articleEntryDtos.map((entry) => entry.articleId),
      cabinetId,
    );

    const articleEntries = await this.articleQuotationEntryService.saveMany(
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
        createQuotationDto.discount,
        createQuotationDto.discount_type,
      );

    // Format articleEntries as lineItems for tax calculations
    const lineItems =
      await this.articleQuotationEntryService.findManyAsLineItem(
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

    // Fetch the latest sequential number for quotation
    const sequential =
      await this.quotationSequenceService.getSequential(activityType);

    // Save quotation metadata
    const quotationMetaData = await this.quotationMetaDataService.save({
      ...createQuotationDto.quotationMetaData,
      taxSummary,
    });

    // Save the quotation entity
    const quotation = await this.quotationRepository.save({
      ...createQuotationDto,
      activityType,
      bankAccountId: bankAccount.id,
      currencyId: currency ? currency.id : firm.currencyId,
      cabinetId,
      sequential,
      articleQuotationEntries: articleEntries,
      quotationMetaData,
      subTotal,
      total: totalAfterGeneralDiscount,
    });

    // Handle file uploads if they exist
    if (createQuotationDto.uploads) {
      await Promise.all(
        createQuotationDto.uploads.map((u) =>
          this.quotationStorageService.save(quotation.id, u.uploadId),
        ),
      );
    }

    return quotation;
  }

  async saveMany(
    createQuotationDtos: CreateQuotationDto[],
  ): Promise<QuotationEntity[]> {
    const quotations = [];
    for (const createQuotationDto of createQuotationDtos) {
      const quotation = await this.save(createQuotationDto);
      quotations.push(quotation);
    }
    return quotations;
  }

  async updateQuotationUploads(
    id: number,
    updateQuotationDto: UpdateQuotationDto,
    existingUploads: ResponseQuotationUploadDto[],
  ) {
    const newUploads = [];
    const keptUploads = [];
    const eliminatedUploads = [];

    if (updateQuotationDto.uploads) {
      for (const upload of existingUploads) {
        const exists = updateQuotationDto.uploads.some(
          (u) => u.id === upload.id,
        );
        if (!exists)
          eliminatedUploads.push(
            await this.quotationStorageService.softDelete(upload.id),
          );
        else keptUploads.push(upload);
      }
      for (const upload of updateQuotationDto.uploads) {
        if (!upload.id)
          newUploads.push(
            await this.quotationStorageService.save(id, upload.uploadId),
          );
      }
    }
    return { keptUploads, newUploads, eliminatedUploads };
  }

  @Transactional()
  async update(
    id: number,
    updateQuotationDto: UpdateQuotationDto,
    userId?: string,
  ): Promise<QuotationEntity> {
    // Retrieve the existing quotation with necessary relations
    const { uploads: existingUploads, ...existingQuotation } =
      await this.findOneByCondition(
        {
          filter: `id||$eq||${id}`,
          join: 'articleQuotationEntries,quotationMetaData,uploads',
        },
        userId,
      );
    const cabinetId = existingQuotation.cabinetId;
    const activityType = this.normalizeActivityType(
      updateQuotationDto.activityType ?? existingQuotation.activityType,
    );

    // Fetch and validate related entities in parallel to optimize performance
    const [firm, bankAccount, currency, interlocutor] = await Promise.all([
      this.firmService.findOneByIdInCabinet(
        updateQuotationDto.firmId,
        cabinetId,
      ),
      this.resolveBankAccount(
        updateQuotationDto.bankAccountId ?? existingQuotation.bankAccountId,
        cabinetId,
      ),
      updateQuotationDto.currencyId
        ? this.currencyService.findOneById(updateQuotationDto.currencyId)
        : null,
      updateQuotationDto.interlocutorId
        ? this.interlocutorService.findOneById(
            updateQuotationDto.interlocutorId,
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
      await this.articleQuotationEntryService.softDeleteMany(
        existingQuotation.articleQuotationEntries.map((entry) => entry.id),
      );

    // Save new article entries
    const articleEntries: ArticleQuotationEntryEntity[] =
      updateQuotationDto.articleQuotationEntries
        ? (await this.articleService.assertArticlesBelongToCabinet(
            updateQuotationDto.articleQuotationEntries.map(
              (entry) => entry.articleId,
            ),
            cabinetId,
          ),
          await this.articleQuotationEntryService.saveMany(
            updateQuotationDto.articleQuotationEntries,
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
        updateQuotationDto.discount,
        updateQuotationDto.discount_type,
      );

    // Convert article entries to line items for further calculations
    const lineItems =
      await this.articleQuotationEntryService.findManyAsLineItem(
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

    // Save or update the quotation metadata with the updated tax summary
    const quotationMetaData = await this.quotationMetaDataService.save({
      ...existingQuotation.quotationMetaData,
      ...updateQuotationDto.quotationMetaData,
      taxSummary,
    });

    // Handle uploads - manage existing, new, and eliminated uploads
    const { keptUploads, newUploads, eliminatedUploads } =
      await this.updateQuotationUploads(
        existingQuotation.id,
        updateQuotationDto,
        existingUploads,
      );

    // Save and return the updated quotation with all updated details
    return this.quotationRepository.save({
      id: existingQuotation.id,
      ...updateQuotationDto,
      activityType,
      bankAccountId: bankAccount.id,
      cabinetId,
      currencyId: currency ? currency.id : firm.currencyId,
      interlocutorId: interlocutor ? interlocutor.id : null,
      articleQuotationEntries: articleEntries,
      quotationMetaData,
      subTotal,
      total: totalAfterGeneralDiscount,
      uploads: [...keptUploads, ...newUploads, ...eliminatedUploads],
    });
  }

  async duplicate(
    duplicateQuotationDto: DuplicateQuotationDto,
    userId?: string,
  ): Promise<ResponseQuotationDto> {
    const existingQuotation = await this.findOneByCondition(
      {
        filter: `id||$eq||${duplicateQuotationDto.id}`,
        join: new String().concat(
          'quotationMetaData,',
          'articleQuotationEntries,',
          'articleQuotationEntries.articleQuotationEntryTaxes,',
          'uploads',
        ),
      },
      userId,
    );
    const quotationMetaData = await this.quotationMetaDataService.duplicate(
      existingQuotation.quotationMetaData.id,
    );
    const activityType = this.normalizeActivityType(
      existingQuotation.activityType,
    );
    const sequential =
      await this.quotationSequenceService.getSequential(activityType);
    const quotation = await this.quotationRepository.save({
      ...existingQuotation,
      activityType,
      sequential,
      quotationMetaData,
      articleQuotationEntries: [],
      uploads: [],
      id: undefined,
      status: QUOTATION_STATUS.Draft,
    });
    const articleQuotationEntries =
      await this.articleQuotationEntryService.duplicateMany(
        existingQuotation.articleQuotationEntries.map((entry) => entry.id),
        quotation.id,
      );

    const uploads = duplicateQuotationDto.includeFiles
      ? await this.quotationStorageService.duplicateMany(
          existingQuotation.uploads.map((upload) => upload.id),
          quotation.id,
        )
      : [];

    return this.quotationRepository.save({
      ...quotation,
      articleQuotationEntries,
      uploads,
    });
  }

  async updateStatus(
    id: number,
    status: QUOTATION_STATUS,
    userId?: string,
  ): Promise<QuotationEntity> {
    const quotation = await this.findOneById(id, userId);
    return this.quotationRepository.save({ id: quotation.id, status });
  }

  async updateMany(
    updateQuotationDtos: UpdateQuotationDto[],
  ): Promise<QuotationEntity[]> {
    return this.quotationRepository.updateMany(updateQuotationDtos);
  }

  async updateQuotationSequence(
    updatedSequenceDto: UpdateQuotationSequenceDto,
  ): Promise<QuotationSequence> {
    return this.quotationSequenceService.set(updatedSequenceDto);
  }

  @Transactional()
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredQuotations() {
    const currentDate = new Date();
    const expiredQuotations: QuotationEntity[] =
      await this.quotationRepository.findAll({
        where: { status: QUOTATION_STATUS.Sent },
      });
    const quotationsToExpire = expiredQuotations.filter((quotation) =>
      isAfter(currentDate, new Date(quotation.dueDate)),
    );

    if (quotationsToExpire.length) {
      for (const quotation of quotationsToExpire) {
        quotation.status = QUOTATION_STATUS.Expired;
        await this.quotationRepository.save(quotation);
      }
    }
  }

  async softDelete(id: number, userId?: string): Promise<QuotationEntity> {
    await this.findOneById(id, userId);
    return this.quotationRepository.softDelete(id);
  }

  async deleteAll() {
    return this.quotationRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.quotationRepository.getTotalCount();
  }
}
