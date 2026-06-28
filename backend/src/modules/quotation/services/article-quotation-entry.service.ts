import { BadRequestException, Injectable } from '@nestjs/common';
import { ArticleQuotationEntryEntity } from '../entities/article-quotation-entry.entity';
import { CreateArticleQuotationEntryDto } from '../dtos/article-quotation-entry.create.dto';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { ArticleService } from 'src/modules/article/services/article.service';
import { ResponseArticleDto } from 'src/modules/article/dtos/article.response.dto';
import { UpdateArticleQuotationEntryDto } from '../dtos/article-quotation-entry.update.dto';
import { InvoicingCalculationsService } from 'src/shared/calculations/services/invoicing.calculations.service';
import { ResponseArticleQuotationEntryDto } from '../dtos/article-quotation-entry.response.dto';
import { ArticleQuotationEntryRepository } from '../repositories/article-quotation-entry.repository';
import { ArticleQuotationEntryTaxService } from './article-quotation-entry-tax.service';
import { ArticleQuotationEntryNotFoundException } from '../errors/article-quotation-entry.notfound.error';
import { LineItem } from 'src/shared/calculations/interfaces/line-item.interface';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindOneOptions } from 'typeorm';

@Injectable()
export class ArticleQuotationEntryService {
  constructor(
    private readonly articleQuotationEntryRepository: ArticleQuotationEntryRepository,
    private readonly articleQuotationEntryTaxService: ArticleQuotationEntryTaxService,
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
    dto: CreateArticleQuotationEntryDto | UpdateArticleQuotationEntryDto,
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
  ): Promise<ResponseArticleQuotationEntryDto | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const entry = await this.articleQuotationEntryRepository.findOne(
      queryOptions as FindOneOptions<ArticleQuotationEntryEntity>,
    );
    if (!entry) return null;
    return entry;
  }

  async findOneById(id: number): Promise<ResponseArticleQuotationEntryDto> {
    const entry = await this.articleQuotationEntryRepository.findOneById(id);
    if (!entry) {
      throw new ArticleQuotationEntryNotFoundException();
    }
    return entry;
  }

  async findOneAsLineItem(id: number): Promise<LineItem> {
    const entry = await this.findOneByCondition({
      filter: `id||$eq||${id}`,
      join: 'articleQuotationEntryTaxes',
    });
    const taxes = entry.articleQuotationEntryTaxes
      ? await Promise.all(
          entry.articleQuotationEntryTaxes.map((taxEntry) =>
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
    createArticleQuotationEntryDto: CreateArticleQuotationEntryDto,
    cabinetId?: number,
  ): Promise<ArticleQuotationEntryEntity> {
    const taxes = await this.resolveTaxes(
      createArticleQuotationEntryDto.taxes,
      cabinetId,
    );
    const article = await this.resolveArticle(
      createArticleQuotationEntryDto,
      cabinetId,
    );

    const lineItem = {
      quantity: Number(createArticleQuotationEntryDto.quantity ?? 0),
      unit_price: Number(createArticleQuotationEntryDto.unit_price ?? 0),
      discount: Number(createArticleQuotationEntryDto.discount ?? 0),
      discount_type: createArticleQuotationEntryDto.discount_type,
      taxes: taxes,
    };

    const entry = await this.articleQuotationEntryRepository.save({
      quantity: lineItem.quantity,
      unit_price: lineItem.unit_price,
      discount: lineItem.discount,
      discount_type: createArticleQuotationEntryDto.discount_type,
      quotationId: createArticleQuotationEntryDto.quotationId,
      articleId: article.id,
      article: article,
      subTotal: this.calculationsService.calculateSubTotalForLineItem(lineItem),
      total: this.calculationsService.calculateTotalForLineItem(lineItem),
    });

    await this.articleQuotationEntryTaxService.saveMany(
      taxes.map((tax) => {
        return { taxId: tax.id, articleQuotationEntryId: entry.id };
      }),
    );
    return entry;
  }

  async saveMany(
    createArticleQuotationEntryDtos: CreateArticleQuotationEntryDto[],
    cabinetId?: number,
  ): Promise<ArticleQuotationEntryEntity[]> {
    const savedEntries = [];
    for (const dto of createArticleQuotationEntryDtos) {
      const savedEntry = await this.save(dto, cabinetId);
      savedEntries.push(savedEntry);
    }
    return savedEntries;
  }

  async update(
    id: number,
    updateArticleQuotationEntryDto: UpdateArticleQuotationEntryDto,
    cabinetId?: number,
  ): Promise<ArticleQuotationEntryEntity> {
    //fetch exisiting entry
    const existingEntry =
      await this.articleQuotationEntryRepository.findOneById(id);
    await this.articleQuotationEntryTaxService.softDeleteMany(
      (existingEntry.articleQuotationEntryTaxes ?? []).map(
        (taxEntry) => taxEntry.id,
      ),
    );

    //fetch and check the existance of all taxes
    const taxes = await this.resolveTaxes(
      updateArticleQuotationEntryDto.taxes,
      cabinetId,
    );

    //delete all existing taxes and rebuild
    for (const taxEntry of existingEntry.articleQuotationEntryTaxes ?? []) {
      await this.articleQuotationEntryTaxService.softDelete(taxEntry.id);
    }

    const article = await this.resolveArticle(
      updateArticleQuotationEntryDto,
      cabinetId,
    );

    const lineItem = {
      quantity: Number(updateArticleQuotationEntryDto.quantity ?? 0),
      unit_price: Number(updateArticleQuotationEntryDto.unit_price ?? 0),
      discount: Number(updateArticleQuotationEntryDto.discount ?? 0),
      discount_type: updateArticleQuotationEntryDto.discount_type,
      taxes: taxes,
    };

    //update the entry with the new data and save it
    const entry = await this.articleQuotationEntryRepository.save({
      ...existingEntry,
      quantity: lineItem.quantity,
      unit_price: lineItem.unit_price,
      discount: lineItem.discount,
      discount_type: updateArticleQuotationEntryDto.discount_type,
      quotationId:
        updateArticleQuotationEntryDto.quotationId ?? existingEntry.quotationId,
      articleId: article.id,
      article: article,
      subTotal: this.calculationsService.calculateSubTotalForLineItem(lineItem),
      total: this.calculationsService.calculateTotalForLineItem(lineItem),
    });
    //save the new tax entries for the article entry
    await this.articleQuotationEntryTaxService.saveMany(
      taxes.map((tax) => {
        return { taxId: tax.id, articleQuotationEntryId: entry.id };
      }),
    );
    return entry;
  }

  async duplicate(
    id: number,
    quotationId: number,
  ): Promise<ArticleQuotationEntryEntity> {
    // Fetch the existing entry
    const existingEntry = await this.findOneByCondition({
      filter: `id||$eq||${id}`,
      join: 'articleQuotationEntryTaxes',
    });

    // Duplicate the taxes associated with this entry
    const duplicatedTaxes = existingEntry.articleQuotationEntryTaxes.map(
      (taxEntry) => ({ taxId: taxEntry.taxId }),
    );

    // Create the duplicated entry
    const duplicatedEntry = {
      ...existingEntry,
      quotationId: quotationId,
      id: undefined,
      articleQuotationEntryTaxes: duplicatedTaxes, // Attach duplicated taxes
      createdAt: undefined,
      updatedAt: undefined,
    };

    // Save the duplicated entry
    const newEntry =
      await this.articleQuotationEntryRepository.save(duplicatedEntry);

    // Save the new tax entries for the duplicated entry
    await this.articleQuotationEntryTaxService.saveMany(
      duplicatedTaxes.map((tax) => ({
        taxId: tax.taxId,
        articleQuotationEntryId: newEntry.id,
      })),
    );

    return newEntry;
  }

  async duplicateMany(
    ids: number[],
    quotationId: number,
  ): Promise<ArticleQuotationEntryEntity[]> {
    const duplicatedEntries = [];
    for (const id of ids) {
      const duplicatedEntry = await this.duplicate(id, quotationId);
      duplicatedEntries.push(duplicatedEntry);
    }
    return duplicatedEntries;
  }

  async softDelete(id: number): Promise<ArticleQuotationEntryEntity> {
    const entry = await this.articleQuotationEntryRepository.findOne({
      where: { id, deletedAt: null },
      relations: { articleQuotationEntryTaxes: true },
    });
    await this.articleQuotationEntryTaxService.softDeleteMany(
      entry.articleQuotationEntryTaxes.map((taxEntry) => taxEntry.id),
    );
    return this.articleQuotationEntryRepository.softDelete(id);
  }

  async softDeleteMany(ids: number[]): Promise<ArticleQuotationEntryEntity[]> {
    const entries = await Promise.all(
      ids.map(async (id) => this.softDelete(id)),
    );
    return entries;
  }
}
