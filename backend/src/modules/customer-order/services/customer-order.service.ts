import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  StreamableFile,
} from '@nestjs/common';
import { CustomerOrderEntity } from '../entities/customer-order.entity';
import { CustomerOrderNotFoundException } from '../errors/customer-order.notfound.error';
import { ResponseCustomerOrderDto } from '../dtos/customer-order.response.dto';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { CreateCustomerOrderDto } from '../dtos/customer-order.create.dto';
import { UpdateCustomerOrderDto } from '../dtos/customer-order.update.dto';
import { CurrencyService } from 'src/modules/currency/services/currency.service';
import { FirmService } from 'src/modules/firm/services/firm.service';
import { InterlocutorService } from 'src/modules/interlocutor/services/interlocutor.service';
import { InvoicingCalculationsService } from 'src/shared/calculations/services/invoicing.calculations.service';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { ArticleCustomerOrderEntryService } from './article-customer-order-entry.service';
import { ArticleCustomerOrderEntryEntity } from '../entities/article-customer-order-entry.entity';
import { DocumentTemplateRendererService } from 'src/modules/document-template/services/document-template-renderer.service';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from 'src/modules/document-template/enums/document-template-document-type.enum';
import { CustomerOrderSequenceService } from './customer-order-sequence.service';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { CustomerOrderMetaDataService } from './customer-order-meta-data.service';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { BankAccountService } from 'src/modules/bank-account/services/bank-account.service';
import { CustomerOrderStorageService } from './customer-order-upload.service';
import { ResponseCustomerOrderUploadDto } from '../dtos/customer-order-upload.response.dto';
import { CustomerOrderSequence } from '../interfaces/customer-order-sequence.interface';
import { UpdateCustomerOrderSequenceDto } from '../dtos/customer-order-seqence.update.dto';
import { Transactional } from '@nestjs-cls/transactional';
import { DuplicateCustomerOrderDto } from '../dtos/customer-order.duplicate.dto';
import { CUSTOMER_ORDER_STATUS } from '../enums/customer-order-status.enum';
import { CustomerOrderRepository } from '../repositories/customer-order.repository';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { FIRM_ENTITY_TYPE } from 'src/modules/firm/enums/firm-entity-type.enum';
import { QuotationEntity } from 'src/modules/quotation/entities/quotation.entity';
import { QUOTATION_STATUS } from 'src/modules/quotation/enums/quotation-status.enum';
import { QuotationService } from 'src/modules/quotation/services/quotation.service';
import { CustomerOrderLifecycleService } from './customer-order-lifecycle.service';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { ArticleService } from 'src/modules/article/services/article.service';
import { MailService } from 'src/shared/mail/services/mail.service';
import { SendDocumentEmailDto } from 'src/shared/mail/dtos/send-document-email.dto';

@Injectable()
export class CustomerOrderService {
  constructor(
    //repositories
    private readonly customerOrderRepository: CustomerOrderRepository,
    //entity services
    private readonly articleCustomerOrderEntryService: ArticleCustomerOrderEntryService,
    private readonly articleService: ArticleService,
    private readonly customerOrderStorageService: CustomerOrderStorageService,
    private readonly bankAccountService: BankAccountService,
    private readonly currencyService: CurrencyService,
    private readonly firmService: FirmService,
    private readonly interlocutorService: InterlocutorService,
    private readonly customerOrderSequenceService: CustomerOrderSequenceService,
    private readonly customerOrderMetaDataService: CustomerOrderMetaDataService,
    private readonly taxService: TaxService,

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
    const { pdfBuffer } = await this.generateCustomerOrderPdf(
      id,
      template,
      userId,
    );

    return new StreamableFile(new Uint8Array(pdfBuffer));
  }

  private async generateCustomerOrderPdf(
    id: number,
    template: string,
    userId?: string,
  ): Promise<{ filename: string; pdfBuffer: Buffer | Uint8Array }> {
    const customerOrder = await this.findOneById(id, userId);
    if (!customerOrder) {
      throw new CustomerOrderNotFoundException();
    }

    const templateId = Number(template);
    const pdfBuffer = await this.rendererService.generateDocument(
      {
        documentId: id,
        documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.CUSTOMER_ORDER,
        templateId: Number.isNaN(templateId) ? undefined : templateId,
      },
      userId,
    );

    const filename = `${
      customerOrder.sequential || `customer-order-${customerOrder.id}`
    }.pdf`;
    return { filename, pdfBuffer };
  }

  async sendEmail(
    id: number,
    payload: SendDocumentEmailDto,
    userId?: string,
  ): Promise<{ success: boolean }> {
    const { filename, pdfBuffer } = await this.generateCustomerOrderPdf(
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

  async findOneById(id: number, userId?: string): Promise<CustomerOrderEntity> {
    const customerOrder = userId
      ? await this.findOneByCondition({ filter: `id||$eq||${id}` }, userId)
      : await this.customerOrderRepository.findOneById(id);
    if (!customerOrder) {
      throw new CustomerOrderNotFoundException();
    }
    return this.customerOrderLifecycleService.normalizeCustomerOrderStatus(
      customerOrder,
    ) as CustomerOrderEntity;
  }

  async findOneByCondition(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<CustomerOrderEntity | null> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const customerOrder = await this.customerOrderRepository.findOne(
      queryOptions as FindOneOptions<CustomerOrderEntity>,
    );
    if (!customerOrder) return null;
    return this.customerOrderLifecycleService.normalizeCustomerOrderStatus(
      customerOrder,
    ) as CustomerOrderEntity;
  }

  async findAll(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<CustomerOrderEntity[]> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const customerOrders = await this.customerOrderRepository.findAll(
      queryOptions as FindManyOptions<CustomerOrderEntity>,
    );
    return this.customerOrderLifecycleService.normalizeCustomerOrdersStatus(
      customerOrders,
    ) as CustomerOrderEntity[];
  }

  async findAllPaginated(
    query: IQueryObject,
    userId?: string,
  ): Promise<PageDto<ResponseCustomerOrderDto>> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const count = await this.customerOrderRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.customerOrderRepository.findAll(
      queryOptions as FindManyOptions<CustomerOrderEntity>,
    );

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: {
        page: parseInt(query.page),
        take: parseInt(query.limit),
      },
      itemCount: count,
    });

    return new PageDto(
      this.customerOrderLifecycleService.normalizeCustomerOrdersStatus(
        entities,
      ) as ResponseCustomerOrderDto[],
      pageMetaDto,
    );
  }

  @Transactional()
  async save(
    createCustomerOrderDto: CreateCustomerOrderDto,
    userId?: string,
  ): Promise<CustomerOrderEntity> {
    const cabinetId =
      (await this.getCabinetIdForUser(userId)) ??
      (
        createCustomerOrderDto as CreateCustomerOrderDto & {
          cabinetId?: number;
        }
      ).cabinetId;
    const status = this.customerOrderLifecycleService.resolveCreateStatus(
      createCustomerOrderDto.status,
    );
    const activityType = this.normalizeActivityType(
      createCustomerOrderDto.activityType,
    );
    const articleEntryDtos = Array.isArray(
      createCustomerOrderDto.articleCustomerOrderEntries,
    )
      ? createCustomerOrderDto.articleCustomerOrderEntries
      : [];

    // Parallelize fetching firm, bank account, and currency, as they are independent
    const [firm, bankAccount, currency] = await Promise.all([
      cabinetId
        ? this.firmService.findOneByIdInCabinet(
            createCustomerOrderDto.firmId,
            cabinetId,
          )
        : this.firmService.findOneByCondition({
            filter: `id||$eq||${createCustomerOrderDto.firmId}`,
          }),
      this.resolveBankAccount(createCustomerOrderDto.bankAccountId, cabinetId),
      createCustomerOrderDto.currencyId
        ? this.currencyService.findOneById(createCustomerOrderDto.currencyId)
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

    // Check interlocutor existence if provided
    if (createCustomerOrderDto.interlocutorId) {
      await this.interlocutorService.findOneById(
        createCustomerOrderDto.interlocutorId,
      );
    }

    if (!articleEntryDtos.length) {
      throw new BadRequestException(
        'Ajoutez au moins un article au commande client.',
      );
    }

    await this.articleService.assertArticlesBelongToCabinet(
      articleEntryDtos.map((entry) => entry.articleId),
      cabinetId,
    );

    const articleEntries = await this.articleCustomerOrderEntryService.saveMany(
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
        createCustomerOrderDto.discount,
        createCustomerOrderDto.discount_type,
      );

    // Format articleEntries as lineItems for tax calculations
    const lineItems =
      await this.articleCustomerOrderEntryService.findManyAsLineItem(
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

    // Fetch the latest sequential number for customerOrder
    const sequential =
      await this.customerOrderSequenceService.getSequential(activityType);

    // Save customerOrder metadata
    const customerOrderMetaData = await this.customerOrderMetaDataService.save({
      ...createCustomerOrderDto.customerOrderMetaData,
      taxSummary,
    });

    // Save the customerOrder entity
    const customerOrder = await this.customerOrderRepository.save({
      ...createCustomerOrderDto,
      status,
      activityType,
      bankAccountId: bankAccount.id,
      currencyId: currency ? currency.id : firm.currencyId,
      cabinetId,
      sequential,
      articleCustomerOrderEntries: articleEntries,
      customerOrderMetaData,
      subTotal,
      total: totalAfterGeneralDiscount,
    });

    // Handle file uploads if they exist
    if (createCustomerOrderDto.uploads) {
      await Promise.all(
        createCustomerOrderDto.uploads.map((u) =>
          this.customerOrderStorageService.save(customerOrder.id, u.uploadId),
        ),
      );
    }

    return this.customerOrderLifecycleService.normalizeCustomerOrderStatus(
      customerOrder,
    ) as CustomerOrderEntity;
  }

  async saveMany(
    createCustomerOrderDtos: CreateCustomerOrderDto[],
  ): Promise<CustomerOrderEntity[]> {
    const customerOrders = [];
    for (const createCustomerOrderDto of createCustomerOrderDtos) {
      const customerOrder = await this.save(createCustomerOrderDto);
      customerOrders.push(customerOrder);
    }
    return customerOrders;
  }

  async updateCustomerOrderUploads(
    id: number,
    updateCustomerOrderDto: UpdateCustomerOrderDto,
    existingUploads: ResponseCustomerOrderUploadDto[],
  ) {
    const newUploads = [];
    const keptUploads = [];
    const eliminatedUploads = [];

    if (updateCustomerOrderDto.uploads) {
      for (const upload of existingUploads) {
        const exists = updateCustomerOrderDto.uploads.some(
          (u) => u.id === upload.id,
        );
        if (!exists)
          eliminatedUploads.push(
            await this.customerOrderStorageService.softDelete(upload.id),
          );
        else keptUploads.push(upload);
      }
      for (const upload of updateCustomerOrderDto.uploads) {
        if (!upload.id)
          newUploads.push(
            await this.customerOrderStorageService.save(id, upload.uploadId),
          );
      }
    }
    return { keptUploads, newUploads, eliminatedUploads };
  }

  @Transactional()
  async update(
    id: number,
    updateCustomerOrderDto: UpdateCustomerOrderDto,
    userId?: string,
  ): Promise<CustomerOrderEntity> {
    const existingCustomerOrder = await this.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join:
          'articleCustomerOrderEntries,' +
          'articleCustomerOrderEntries.articleCustomerOrderEntryTaxes,' +
          'customerOrderMetaData,' +
          'uploads,' +
          'invoices,' +
          'deliveryNotes,' +
          'goodsIssueNotes',
      },
      userId,
    );
    if (!existingCustomerOrder) {
      throw new CustomerOrderNotFoundException();
    }
    const { uploads: existingUploads = [], ...customerOrderSnapshot } =
      existingCustomerOrder;
    const cabinetId = customerOrderSnapshot.cabinetId;
    const nextStatus = this.customerOrderLifecycleService.resolveUpdateStatus(
      existingCustomerOrder,
      updateCustomerOrderDto.status,
    );
    this.assertUpdateAllowedForCurrentStatus(
      existingCustomerOrder,
      updateCustomerOrderDto,
    );
    const activityType = this.normalizeActivityType(
      updateCustomerOrderDto.activityType ?? customerOrderSnapshot.activityType,
    );

    // Fetch and validate related entities in parallel to optimize performance
    const [firm, bankAccount, currency, interlocutor] = await Promise.all([
      this.firmService.findOneByIdInCabinet(
        updateCustomerOrderDto.firmId ?? customerOrderSnapshot.firmId,
        cabinetId,
      ),
      this.resolveBankAccount(
        updateCustomerOrderDto.bankAccountId ??
          customerOrderSnapshot.bankAccountId,
        cabinetId,
      ),
      updateCustomerOrderDto.currencyId
        ? this.currencyService.findOneById(updateCustomerOrderDto.currencyId)
        : Promise.resolve(null),
      updateCustomerOrderDto.interlocutorId
        ? this.interlocutorService.findOneById(
            updateCustomerOrderDto.interlocutorId,
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
      updateCustomerOrderDto.articleCustomerOrderEntries,
    );

    const articleEntries: ArticleCustomerOrderEntryEntity[] =
      hasArticleEntriesUpdate
        ? await (async () => {
            if (customerOrderSnapshot.articleCustomerOrderEntries.length > 0) {
              await this.articleCustomerOrderEntryService.softDeleteMany(
                customerOrderSnapshot.articleCustomerOrderEntries.map(
                  (entry) => entry.id,
                ),
              );
            }

            await this.articleService.assertArticlesBelongToCabinet(
              updateCustomerOrderDto.articleCustomerOrderEntries.map(
                (entry) => entry.articleId,
              ),
              cabinetId,
            );

            return this.articleCustomerOrderEntryService.saveMany(
              updateCustomerOrderDto.articleCustomerOrderEntries,
              cabinetId,
            );
          })()
        : customerOrderSnapshot.articleCustomerOrderEntries;

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
        updateCustomerOrderDto.discount ?? customerOrderSnapshot.discount,
        updateCustomerOrderDto.discount_type ??
          customerOrderSnapshot.discount_type,
      );

    // Convert article entries to line items for further calculations
    const lineItems =
      await this.articleCustomerOrderEntryService.findManyAsLineItem(
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

    // Save or update the customerOrder metadata with the updated tax summary
    const customerOrderMetaData = await this.customerOrderMetaDataService.save({
      ...customerOrderSnapshot.customerOrderMetaData,
      ...updateCustomerOrderDto.customerOrderMetaData,
      taxSummary,
    });

    // Handle uploads - manage existing, new, and eliminated uploads
    const { keptUploads, newUploads, eliminatedUploads } =
      await this.updateCustomerOrderUploads(
        customerOrderSnapshot.id,
        updateCustomerOrderDto,
        existingUploads,
      );

    // Save and return the updated customerOrder with all updated details
    const customerOrder = await this.customerOrderRepository.save({
      ...updateCustomerOrderDto,
      id,
      activityType,
      firmId: firm.id,
      quotationId:
        updateCustomerOrderDto.quotationId ?? customerOrderSnapshot.quotationId,
      cabinetId,
      status: nextStatus,
      bankAccountId: bankAccount.id,
      currencyId:
        currency?.id ?? customerOrderSnapshot.currencyId ?? firm.currencyId,
      interlocutorId:
        interlocutor?.id ?? customerOrderSnapshot.interlocutorId ?? null,
      articleCustomerOrderEntries: articleEntries,
      customerOrderMetaData,
      subTotal,
      total: totalAfterGeneralDiscount,
      uploads: [...keptUploads, ...newUploads, ...eliminatedUploads],
    });

    return this.customerOrderLifecycleService.normalizeCustomerOrderStatus(
      customerOrder,
    ) as CustomerOrderEntity;
  }

  async duplicate(
    duplicateCustomerOrderDto: DuplicateCustomerOrderDto,
    userId?: string,
  ): Promise<ResponseCustomerOrderDto> {
    const existingCustomerOrder = await this.findOneByCondition(
      {
        filter: `id||$eq||${duplicateCustomerOrderDto.id}`,
        join: new String().concat(
          'customerOrderMetaData,',
          'articleCustomerOrderEntries,',
          'articleCustomerOrderEntries.articleCustomerOrderEntryTaxes,',
          'uploads',
        ),
      },
      userId,
    );
    if (!existingCustomerOrder) {
      throw new CustomerOrderNotFoundException();
    }
    const customerOrderMetaData =
      await this.customerOrderMetaDataService.duplicate(
        existingCustomerOrder.customerOrderMetaData.id,
      );
    const activityType = this.normalizeActivityType(
      existingCustomerOrder.activityType,
    );
    const sequential =
      await this.customerOrderSequenceService.getSequential(activityType);
    const customerOrder = await this.customerOrderRepository.save({
      ...existingCustomerOrder,
      activityType,
      sequential,
      customerOrderMetaData,
      articleCustomerOrderEntries: [],
      uploads: [],
      id: undefined,
      status: CUSTOMER_ORDER_STATUS.Draft,
    });
    const articleCustomerOrderEntries =
      await this.articleCustomerOrderEntryService.duplicateMany(
        existingCustomerOrder.articleCustomerOrderEntries.map(
          (entry) => entry.id,
        ),
        customerOrder.id,
      );

    const uploads = duplicateCustomerOrderDto.includeFiles
      ? await this.customerOrderStorageService.duplicateMany(
          existingCustomerOrder.uploads.map((upload) => upload.id),
          customerOrder.id,
        )
      : [];

    const duplicatedCustomerOrder = await this.customerOrderRepository.save({
      ...customerOrder,
      articleCustomerOrderEntries,
      uploads,
    });

    return this.customerOrderLifecycleService.normalizeCustomerOrderStatus(
      duplicatedCustomerOrder,
    ) as ResponseCustomerOrderDto;
  }

  async updateStatus(
    id: number,
    status: CUSTOMER_ORDER_STATUS,
    userId?: string,
  ): Promise<CustomerOrderEntity> {
    await this.findOneById(id, userId);
    await this.customerOrderLifecycleService.updateStatus(id, status);
    return this.findOneById(id, userId);
  }

  @Transactional()
  async saveFromQuotation(
    quotation: QuotationEntity,
  ): Promise<CustomerOrderEntity> {
    if (!quotation) {
      throw new BadRequestException('Devis introuvable.');
    }
    const activityType = this.normalizeActivityType(quotation.activityType);
    const customerOrder = await this.save({
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
      status: CUSTOMER_ORDER_STATUS.Draft,
      date: new Date(),
      dueDate: null,
      articleCustomerOrderEntries: (
        quotation.articleQuotationEntries ?? []
      ).map((entry) => ({
        unit_price: entry.unit_price,
        quantity: entry.quantity,
        discount: entry.discount,
        discount_type: entry.discount_type,
        subTotal: entry.subTotal,
        total: entry.total,
        articleId: entry.articleId,
        taxes: (entry.articleQuotationEntryTaxes ?? []).map(
          (taxEntry) => taxEntry.taxId,
        ),
      })),
    } as any);

    await this.quotationService.updateStatus(
      quotation.id,
      QUOTATION_STATUS.Accepted,
    );
    return customerOrder;
  }

  async updateMany(
    updateCustomerOrderDtos: UpdateCustomerOrderDto[],
  ): Promise<CustomerOrderEntity[]> {
    return this.customerOrderRepository.updateMany(updateCustomerOrderDtos);
  }

  async updateCustomerOrderSequence(
    updatedSequenceDto: UpdateCustomerOrderSequenceDto,
  ): Promise<CustomerOrderSequence> {
    return this.customerOrderSequenceService.set(updatedSequenceDto);
  }

  async softDelete(id: number, userId?: string): Promise<CustomerOrderEntity> {
    await this.findOneById(id, userId);
    return this.customerOrderRepository.softDelete(id);
  }

  async deleteAll() {
    return this.customerOrderRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.customerOrderRepository.getTotalCount();
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
          (entry?.articleCustomerOrderEntryTaxes ?? [])
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

  private buildLockedCommercialSnapshot(customerOrder: CustomerOrderEntity) {
    return {
      activityType: customerOrder.activityType ?? null,
      date: this.normalizeDateForComparison(customerOrder.date),
      firmId: customerOrder.firmId ?? null,
      interlocutorId: customerOrder.interlocutorId ?? null,
      currencyId: customerOrder.currencyId ?? null,
      bankAccountId: customerOrder.bankAccountId ?? null,
      discount: Number(customerOrder.discount ?? 0),
      discount_type: customerOrder.discount_type ?? null,
      quotationId: customerOrder.quotationId ?? null,
      articleCustomerOrderEntries: this.normalizeArticleEntriesForComparison(
        customerOrder.articleCustomerOrderEntries,
      ),
    };
  }

  private buildRequestedLockedCommercialSnapshot(
    customerOrder: CustomerOrderEntity,
    updateCustomerOrderDto: UpdateCustomerOrderDto,
  ) {
    return {
      activityType:
        updateCustomerOrderDto.activityType ??
        customerOrder.activityType ??
        null,
      date: this.normalizeDateForComparison(
        updateCustomerOrderDto.date ?? customerOrder.date,
      ),
      firmId: updateCustomerOrderDto.firmId ?? customerOrder.firmId ?? null,
      interlocutorId:
        updateCustomerOrderDto.interlocutorId ??
        customerOrder.interlocutorId ??
        null,
      currencyId:
        updateCustomerOrderDto.currencyId ?? customerOrder.currencyId ?? null,
      bankAccountId:
        updateCustomerOrderDto.bankAccountId ??
        customerOrder.bankAccountId ??
        null,
      discount: Number(
        updateCustomerOrderDto.discount ?? customerOrder.discount ?? 0,
      ),
      discount_type:
        updateCustomerOrderDto.discount_type ??
        customerOrder.discount_type ??
        null,
      quotationId:
        updateCustomerOrderDto.quotationId ?? customerOrder.quotationId ?? null,
      articleCustomerOrderEntries: this.normalizeArticleEntriesForComparison(
        updateCustomerOrderDto.articleCustomerOrderEntries ??
          customerOrder.articleCustomerOrderEntries,
      ),
    };
  }

  private assertUpdateAllowedForCurrentStatus(
    customerOrder: CustomerOrderEntity,
    updateCustomerOrderDto: UpdateCustomerOrderDto,
  ) {
    const normalizedStatus = this.customerOrderLifecycleService.normalizeStatus(
      customerOrder.status,
      this.customerOrderLifecycleService.hasTransformedDocuments(customerOrder),
    );

    if (normalizedStatus === CUSTOMER_ORDER_STATUS.Draft) {
      return;
    }

    if (
      normalizedStatus === CUSTOMER_ORDER_STATUS.Validated ||
      normalizedStatus === CUSTOMER_ORDER_STATUS.Cancelled
    ) {
      throw new BadRequestException(
        'customerOrder.errors.cannot_modify_locked',
      );
    }

    const currentSnapshot = this.buildLockedCommercialSnapshot(customerOrder);
    const requestedSnapshot = this.buildRequestedLockedCommercialSnapshot(
      customerOrder,
      updateCustomerOrderDto,
    );

    if (JSON.stringify(currentSnapshot) !== JSON.stringify(requestedSnapshot)) {
      throw new BadRequestException(
        'customerOrder.errors.created_edit_restricted',
      );
    }
  }
}
