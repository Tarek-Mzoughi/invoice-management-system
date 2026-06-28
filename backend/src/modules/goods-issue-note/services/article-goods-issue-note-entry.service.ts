import { BadRequestException, Injectable } from '@nestjs/common';
import { ArticleGoodsIssueNoteEntryEntity } from '../entities/article-goods-issue-note-entry.entity';
import { CreateArticleGoodsIssueNoteEntryDto } from '../dtos/article-goods-issue-note-entry.create.dto';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { ArticleService } from 'src/modules/article/services/article.service';
import { ResponseArticleDto } from 'src/modules/article/dtos/article.response.dto';
import { UpdateArticleGoodsIssueNoteEntryDto } from '../dtos/article-goods-issue-note-entry.update.dto';
import { InvoicingCalculationsService } from 'src/shared/calculations/services/invoicing.calculations.service';
import { ResponseArticleGoodsIssueNoteEntryDto } from '../dtos/article-goods-issue-note-entry.response.dto';
import { ArticleGoodsIssueNoteEntryRepository } from '../repositories/article-goods-issue-note-entry.repository';
import { ArticleGoodsIssueNoteEntryTaxService } from './article-goods-issue-note-entry-tax.service';
import { ArticleGoodsIssueNoteEntryNotFoundException } from '../errors/article-goods-issue-note-entry.notfound.error';
import { LineItem } from 'src/shared/calculations/interfaces/line-item.interface';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindOneOptions } from 'typeorm';

@Injectable()
export class ArticleGoodsIssueNoteEntryService {
  constructor(
    private readonly articleGoodsIssueNoteEntryRepository: ArticleGoodsIssueNoteEntryRepository,
    private readonly articleGoodsIssueNoteEntryTaxService: ArticleGoodsIssueNoteEntryTaxService,
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
      | CreateArticleGoodsIssueNoteEntryDto
      | UpdateArticleGoodsIssueNoteEntryDto,
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
        'Chaque ligne du bon de sortie doit contenir un article valide.',
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
  ): Promise<ResponseArticleGoodsIssueNoteEntryDto | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const entry = await this.articleGoodsIssueNoteEntryRepository.findOne(
      queryOptions as FindOneOptions<ArticleGoodsIssueNoteEntryEntity>,
    );
    if (!entry) return null;
    return entry;
  }

  async findOneById(
    id: number,
  ): Promise<ResponseArticleGoodsIssueNoteEntryDto> {
    const entry =
      await this.articleGoodsIssueNoteEntryRepository.findOneById(id);
    if (!entry) {
      throw new ArticleGoodsIssueNoteEntryNotFoundException();
    }
    return entry;
  }

  async findOneAsLineItem(id: number): Promise<LineItem> {
    const entry = await this.findOneByCondition({
      filter: `id||$eq||${id}`,
      join: 'articleGoodsIssueNoteEntryTaxes',
    });
    const taxes = entry.articleGoodsIssueNoteEntryTaxes
      ? await Promise.all(
          entry.articleGoodsIssueNoteEntryTaxes.map((taxEntry) =>
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
    createArticleGoodsIssueNoteEntryDto: CreateArticleGoodsIssueNoteEntryDto,
    cabinetId?: number,
  ): Promise<ArticleGoodsIssueNoteEntryEntity> {
    const taxes = await this.resolveTaxes(
      createArticleGoodsIssueNoteEntryDto.taxes,
      cabinetId,
    );
    const article = await this.resolveArticle(
      createArticleGoodsIssueNoteEntryDto,
      cabinetId,
    );

    const lineItem = {
      quantity: Number(createArticleGoodsIssueNoteEntryDto.quantity ?? 0),
      unit_price: Number(createArticleGoodsIssueNoteEntryDto.unit_price ?? 0),
      discount: Number(createArticleGoodsIssueNoteEntryDto.discount ?? 0),
      discount_type: createArticleGoodsIssueNoteEntryDto.discount_type,
      taxes: taxes,
    };

    const entry = await this.articleGoodsIssueNoteEntryRepository.save({
      quantity: lineItem.quantity,
      unit_price: lineItem.unit_price,
      discount: lineItem.discount,
      discount_type: createArticleGoodsIssueNoteEntryDto.discount_type,
      goodsIssueNoteId: createArticleGoodsIssueNoteEntryDto.goodsIssueNoteId,
      articleId: article.id,
      article: article,
      subTotal: this.calculationsService.calculateSubTotalForLineItem(lineItem),
      total: this.calculationsService.calculateTotalForLineItem(lineItem),
    });

    await this.articleGoodsIssueNoteEntryTaxService.saveMany(
      taxes.map((tax) => {
        return { taxId: tax.id, articleGoodsIssueNoteEntryId: entry.id };
      }),
    );
    return entry;
  }

  async saveMany(
    createArticleGoodsIssueNoteEntryDtos: CreateArticleGoodsIssueNoteEntryDto[],
    cabinetId?: number,
  ): Promise<ArticleGoodsIssueNoteEntryEntity[]> {
    const savedEntries = [];
    for (const dto of createArticleGoodsIssueNoteEntryDtos) {
      const savedEntry = await this.save(dto, cabinetId);
      savedEntries.push(savedEntry);
    }
    return savedEntries;
  }

  async update(
    id: number,
    updateArticleGoodsIssueNoteEntryDto: UpdateArticleGoodsIssueNoteEntryDto,
    cabinetId?: number,
  ): Promise<ArticleGoodsIssueNoteEntryEntity> {
    //fetch exisiting entry
    const existingEntry =
      await this.articleGoodsIssueNoteEntryRepository.findOneById(id);
    await this.articleGoodsIssueNoteEntryTaxService.softDeleteMany(
      (existingEntry.articleGoodsIssueNoteEntryTaxes ?? []).map(
        (taxEntry) => taxEntry.id,
      ),
    );

    //fetch and check the existance of all taxes
    const taxes = await this.resolveTaxes(
      updateArticleGoodsIssueNoteEntryDto.taxes,
      cabinetId,
    );

    //delete all existing taxes and rebuild
    for (const taxEntry of existingEntry.articleGoodsIssueNoteEntryTaxes ??
      []) {
      await this.articleGoodsIssueNoteEntryTaxService.softDelete(taxEntry.id);
    }

    const article = await this.resolveArticle(
      updateArticleGoodsIssueNoteEntryDto,
      cabinetId,
    );

    const lineItem = {
      quantity: Number(updateArticleGoodsIssueNoteEntryDto.quantity ?? 0),
      unit_price: Number(updateArticleGoodsIssueNoteEntryDto.unit_price ?? 0),
      discount: Number(updateArticleGoodsIssueNoteEntryDto.discount ?? 0),
      discount_type: updateArticleGoodsIssueNoteEntryDto.discount_type,
      taxes: taxes,
    };

    //update the entry with the new data and save it
    const entry = await this.articleGoodsIssueNoteEntryRepository.save({
      ...existingEntry,
      quantity: lineItem.quantity,
      unit_price: lineItem.unit_price,
      discount: lineItem.discount,
      discount_type: updateArticleGoodsIssueNoteEntryDto.discount_type,
      goodsIssueNoteId:
        updateArticleGoodsIssueNoteEntryDto.goodsIssueNoteId ??
        existingEntry.goodsIssueNoteId,
      articleId: article.id,
      article: article,
      subTotal: this.calculationsService.calculateSubTotalForLineItem(lineItem),
      total: this.calculationsService.calculateTotalForLineItem(lineItem),
    });
    //save the new tax entries for the article entry
    await this.articleGoodsIssueNoteEntryTaxService.saveMany(
      taxes.map((tax) => {
        return { taxId: tax.id, articleGoodsIssueNoteEntryId: entry.id };
      }),
    );
    return entry;
  }

  async duplicate(
    id: number,
    goodsIssueNoteId: number,
  ): Promise<ArticleGoodsIssueNoteEntryEntity> {
    // Fetch the existing entry
    const existingEntry = await this.findOneByCondition({
      filter: `id||$eq||${id}`,
      join: 'articleGoodsIssueNoteEntryTaxes',
    });

    // Duplicate the taxes associated with this entry
    const duplicatedTaxes = existingEntry.articleGoodsIssueNoteEntryTaxes.map(
      (taxEntry) => ({ taxId: taxEntry.taxId }),
    );

    // Create the duplicated entry
    const duplicatedEntry = {
      ...existingEntry,
      goodsIssueNoteId: goodsIssueNoteId,
      id: undefined,
      articleGoodsIssueNoteEntryTaxes: duplicatedTaxes, // Attach duplicated taxes
      createdAt: undefined,
      updatedAt: undefined,
    };

    // Save the duplicated entry
    const newEntry =
      await this.articleGoodsIssueNoteEntryRepository.save(duplicatedEntry);

    // Save the new tax entries for the duplicated entry
    await this.articleGoodsIssueNoteEntryTaxService.saveMany(
      duplicatedTaxes.map((tax) => ({
        taxId: tax.taxId,
        articleGoodsIssueNoteEntryId: newEntry.id,
      })),
    );

    return newEntry;
  }

  async duplicateMany(
    ids: number[],
    goodsIssueNoteId: number,
  ): Promise<ArticleGoodsIssueNoteEntryEntity[]> {
    const duplicatedEntries = [];
    for (const id of ids) {
      const duplicatedEntry = await this.duplicate(id, goodsIssueNoteId);
      duplicatedEntries.push(duplicatedEntry);
    }
    return duplicatedEntries;
  }

  async softDelete(id: number): Promise<ArticleGoodsIssueNoteEntryEntity> {
    const entry = await this.articleGoodsIssueNoteEntryRepository.findOne({
      where: { id, deletedAt: null },
      relations: { articleGoodsIssueNoteEntryTaxes: true },
    });
    await this.articleGoodsIssueNoteEntryTaxService.softDeleteMany(
      entry.articleGoodsIssueNoteEntryTaxes.map((taxEntry) => taxEntry.id),
    );
    return this.articleGoodsIssueNoteEntryRepository.softDelete(id);
  }

  async softDeleteMany(
    ids: number[],
  ): Promise<ArticleGoodsIssueNoteEntryEntity[]> {
    const entries = await Promise.all(
      ids.map(async (id) => this.softDelete(id)),
    );
    return entries;
  }
}
