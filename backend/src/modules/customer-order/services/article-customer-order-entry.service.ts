import { BadRequestException, Injectable } from '@nestjs/common';
import { ArticleCustomerOrderEntryEntity } from '../entities/article-customer-order-entry.entity';
import { CreateArticleCustomerOrderEntryDto } from '../dtos/article-customer-order-entry.create.dto';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { ArticleService } from 'src/modules/article/services/article.service';
import { ResponseArticleDto } from 'src/modules/article/dtos/article.response.dto';
import { UpdateArticleCustomerOrderEntryDto } from '../dtos/article-customer-order-entry.update.dto';
import { InvoicingCalculationsService } from 'src/shared/calculations/services/invoicing.calculations.service';
import { ResponseArticleCustomerOrderEntryDto } from '../dtos/article-customer-order-entry.response.dto';
import { ArticleCustomerOrderEntryRepository } from '../repositories/article-customer-order-entry.repository';
import { ArticleCustomerOrderEntryTaxService } from './article-customer-order-entry-tax.service';
import { ArticleCustomerOrderEntryNotFoundException } from '../errors/article-customer-order-entry.notfound.error';
import { LineItem } from 'src/shared/calculations/interfaces/line-item.interface';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindOneOptions } from 'typeorm';

@Injectable()
export class ArticleCustomerOrderEntryService {
  constructor(
    private readonly articleCustomerOrderEntryRepository: ArticleCustomerOrderEntryRepository,
    private readonly articleCustomerOrderEntryTaxService: ArticleCustomerOrderEntryTaxService,
    private readonly articleService: ArticleService,
    private readonly taxService: TaxService,
    private readonly calculationsService: InvoicingCalculationsService,
  ) {}

  private normalizeTaxIds(taxes?: number[] | null): number[] {
    if (!Array.isArray(taxes)) {
      return [];
    }

    return Array.from(
      new Set(
        taxes
          .map((entry) => Number(entry))
          .filter((entry) => Number.isInteger(entry) && entry > 0),
      ),
    );
  }

  private async resolveTaxes(taxes?: number[] | null, cabinetId?: number) {
    const normalizedTaxIds = this.normalizeTaxIds(taxes);
    if (normalizedTaxIds.length === 0) return [];
    const normalizedCabinetId = this.normalizeCabinetId(cabinetId);

    return Promise.all(
      normalizedTaxIds.map((id) =>
        this.taxService.findOneAuthorizedForCabinet(
          id,
          normalizedCabinetId,
          true,
        ),
      ),
    );
  }

  private async resolveArticle(
    dto:
      | CreateArticleCustomerOrderEntryDto
      | UpdateArticleCustomerOrderEntryDto,
    cabinetId?: number,
  ): Promise<ResponseArticleDto> {
    const frontendSelectedArticleId = Number(dto.articleId ?? dto.id);

    if (
      Number.isInteger(frontendSelectedArticleId) &&
      frontendSelectedArticleId > 0
    ) {
      return this.articleService.findOneById(frontendSelectedArticleId);
    }

    const articlePayload =
      dto.article && typeof dto.article === 'object' ? dto.article : null;
    const normalizedTitle = articlePayload?.title?.trim();

    if (!normalizedTitle) {
      throw new BadRequestException(
        'Chaque ligne du devis doit contenir un article valide.',
      );
    }
    const normalizedCabinetId = this.normalizeCabinetId(cabinetId);

    const existingArticle = await this.articleService.findOneByCondition({
      filter: `title||$eq||${normalizedTitle};cabinetId||$eq||${normalizedCabinetId}`,
    });

    if (existingArticle) {
      return existingArticle;
    }

    const articleToCreate = {
      ...articlePayload,
      title: normalizedTitle,
      cabinetId: normalizedCabinetId,
    };
    return this.articleService.save(articleToCreate);
  }

  private normalizeCabinetId(cabinetId?: number): number {
    const normalizedCabinetId = Number(cabinetId);
    if (!Number.isInteger(normalizedCabinetId) || normalizedCabinetId <= 0) {
      throw new BadRequestException(
        'A valid cabinet context is required to create an article.',
      );
    }
    return normalizedCabinetId;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<ResponseArticleCustomerOrderEntryDto | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const entry = await this.articleCustomerOrderEntryRepository.findOne(
      queryOptions as FindOneOptions<ArticleCustomerOrderEntryEntity>,
    );
    if (!entry) return null;
    return entry;
  }

  async findOneById(id: number): Promise<ResponseArticleCustomerOrderEntryDto> {
    const entry =
      await this.articleCustomerOrderEntryRepository.findOneById(id);
    if (!entry) {
      throw new ArticleCustomerOrderEntryNotFoundException();
    }
    return entry;
  }

  async findOneAsLineItem(id: number): Promise<LineItem> {
    const entry = await this.findOneByCondition({
      filter: `id||$eq||${id}`,
      join: 'articleCustomerOrderEntryTaxes',
    });
    const taxes = entry.articleCustomerOrderEntryTaxes
      ? await Promise.all(
          entry.articleCustomerOrderEntryTaxes.map((taxEntry) =>
            this.taxService.findOneById(taxEntry.taxId),
          ),
        )
      : [];
    return {
      quantity: entry.quantity,
      unit_price: entry.unit_price,
      discount: entry.discount,
      discount_type: entry.discount_type,
      taxes: taxes,
    };
  }

  async findManyAsLineItem(ids: number[]): Promise<LineItem[]> {
    const lineItems = await Promise.all(
      ids.map((id) => this.findOneAsLineItem(id)),
    );
    return lineItems;
  }

  async save(
    createArticleCustomerOrderEntryDto: CreateArticleCustomerOrderEntryDto,
    cabinetId?: number,
  ): Promise<ArticleCustomerOrderEntryEntity> {
    const taxes = await this.resolveTaxes(
      createArticleCustomerOrderEntryDto.taxes,
      cabinetId,
    );
    const article = await this.resolveArticle(
      createArticleCustomerOrderEntryDto,
      cabinetId,
    );

    const lineItem = {
      quantity: Number(createArticleCustomerOrderEntryDto.quantity ?? 0),
      unit_price: Number(createArticleCustomerOrderEntryDto.unit_price ?? 0),
      discount: Number(createArticleCustomerOrderEntryDto.discount ?? 0),
      discount_type: createArticleCustomerOrderEntryDto.discount_type,
      taxes: taxes,
    };

    const entry = await this.articleCustomerOrderEntryRepository.save({
      quantity: lineItem.quantity,
      unit_price: lineItem.unit_price,
      discount: lineItem.discount,
      discount_type: createArticleCustomerOrderEntryDto.discount_type,
      customerOrderId: createArticleCustomerOrderEntryDto.customerOrderId,
      articleId: article.id,
      article: article,
      subTotal: this.calculationsService.calculateSubTotalForLineItem(lineItem),
      total: this.calculationsService.calculateTotalForLineItem(lineItem),
    });

    await this.articleCustomerOrderEntryTaxService.saveMany(
      taxes.map((tax) => {
        return { taxId: tax.id, articleCustomerOrderEntryId: entry.id };
      }),
    );
    return entry;
  }

  async saveMany(
    createArticleCustomerOrderEntryDtos: CreateArticleCustomerOrderEntryDto[],
    cabinetId?: number,
  ): Promise<ArticleCustomerOrderEntryEntity[]> {
    const savedEntries = [];
    for (const dto of createArticleCustomerOrderEntryDtos) {
      const savedEntry = await this.save(dto, cabinetId);
      savedEntries.push(savedEntry);
    }
    return savedEntries;
  }

  async update(
    id: number,
    updateArticleCustomerOrderEntryDto: UpdateArticleCustomerOrderEntryDto,
    cabinetId?: number,
  ): Promise<ArticleCustomerOrderEntryEntity> {
    //fetch exisiting entry
    const existingEntry =
      await this.articleCustomerOrderEntryRepository.findOneById(id);
    await this.articleCustomerOrderEntryTaxService.softDeleteMany(
      (existingEntry.articleCustomerOrderEntryTaxes ?? []).map(
        (taxEntry) => taxEntry.id,
      ),
    );

    //fetch and check the existance of all taxes
    const taxes = await this.resolveTaxes(
      updateArticleCustomerOrderEntryDto.taxes,
      cabinetId,
    );

    //delete all existing taxes and rebuild
    for (const taxEntry of existingEntry.articleCustomerOrderEntryTaxes ?? []) {
      await this.articleCustomerOrderEntryTaxService.softDelete(taxEntry.id);
    }

    const article = await this.resolveArticle(
      updateArticleCustomerOrderEntryDto,
      cabinetId,
    );

    const lineItem = {
      quantity: Number(updateArticleCustomerOrderEntryDto.quantity ?? 0),
      unit_price: Number(updateArticleCustomerOrderEntryDto.unit_price ?? 0),
      discount: Number(updateArticleCustomerOrderEntryDto.discount ?? 0),
      discount_type: updateArticleCustomerOrderEntryDto.discount_type,
      taxes: taxes,
    };

    //update the entry with the new data and save it
    const entry = await this.articleCustomerOrderEntryRepository.save({
      ...existingEntry,
      quantity: lineItem.quantity,
      unit_price: lineItem.unit_price,
      discount: lineItem.discount,
      discount_type: updateArticleCustomerOrderEntryDto.discount_type,
      customerOrderId:
        updateArticleCustomerOrderEntryDto.customerOrderId ??
        existingEntry.customerOrderId,
      articleId: article.id,
      article: article,
      subTotal: this.calculationsService.calculateSubTotalForLineItem(lineItem),
      total: this.calculationsService.calculateTotalForLineItem(lineItem),
    });
    //save the new tax entries for the article entry
    await this.articleCustomerOrderEntryTaxService.saveMany(
      taxes.map((tax) => {
        return { taxId: tax.id, articleCustomerOrderEntryId: entry.id };
      }),
    );
    return entry;
  }

  async duplicate(
    id: number,
    customerOrderId: number,
  ): Promise<ArticleCustomerOrderEntryEntity> {
    // Fetch the existing entry
    const existingEntry = await this.findOneByCondition({
      filter: `id||$eq||${id}`,
      join: 'articleCustomerOrderEntryTaxes',
    });

    // Duplicate the taxes associated with this entry
    const duplicatedTaxes = existingEntry.articleCustomerOrderEntryTaxes.map(
      (taxEntry) => ({ taxId: taxEntry.taxId }),
    );

    // Create the duplicated entry
    const duplicatedEntry = {
      ...existingEntry,
      customerOrderId: customerOrderId,
      id: undefined,
      articleCustomerOrderEntryTaxes: duplicatedTaxes, // Attach duplicated taxes
      createdAt: undefined,
      updatedAt: undefined,
    };

    // Save the duplicated entry
    const newEntry =
      await this.articleCustomerOrderEntryRepository.save(duplicatedEntry);

    // Save the new tax entries for the duplicated entry
    await this.articleCustomerOrderEntryTaxService.saveMany(
      duplicatedTaxes.map((tax) => ({
        taxId: tax.taxId,
        articleCustomerOrderEntryId: newEntry.id,
      })),
    );

    return newEntry;
  }

  async duplicateMany(
    ids: number[],
    customerOrderId: number,
  ): Promise<ArticleCustomerOrderEntryEntity[]> {
    const duplicatedEntries = [];
    for (const id of ids) {
      const duplicatedEntry = await this.duplicate(id, customerOrderId);
      duplicatedEntries.push(duplicatedEntry);
    }
    return duplicatedEntries;
  }

  async softDelete(id: number): Promise<ArticleCustomerOrderEntryEntity> {
    const entry = await this.articleCustomerOrderEntryRepository.findOne({
      where: { id, deletedAt: null },
      relations: { articleCustomerOrderEntryTaxes: true },
    });
    await this.articleCustomerOrderEntryTaxService.softDeleteMany(
      entry.articleCustomerOrderEntryTaxes.map((taxEntry) => taxEntry.id),
    );
    return this.articleCustomerOrderEntryRepository.softDelete(id);
  }

  async softDeleteMany(
    ids: number[],
  ): Promise<ArticleCustomerOrderEntryEntity[]> {
    const entries = await Promise.all(
      ids.map(async (id) => this.softDelete(id)),
    );
    return entries;
  }
}
