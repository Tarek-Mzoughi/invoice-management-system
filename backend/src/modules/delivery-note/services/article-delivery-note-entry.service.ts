import { BadRequestException, Injectable } from '@nestjs/common';
import { ArticleDeliveryNoteEntryEntity } from '../entities/article-delivery-note-entry.entity';
import { CreateArticleDeliveryNoteEntryDto } from '../dtos/article-delivery-note-entry.create.dto';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { ArticleService } from 'src/modules/article/services/article.service';
import { ResponseArticleDto } from 'src/modules/article/dtos/article.response.dto';
import { UpdateArticleDeliveryNoteEntryDto } from '../dtos/article-delivery-note-entry.update.dto';
import { InvoicingCalculationsService } from 'src/shared/calculations/services/invoicing.calculations.service';
import { ResponseArticleDeliveryNoteEntryDto } from '../dtos/article-delivery-note-entry.response.dto';
import { ArticleDeliveryNoteEntryRepository } from '../repositories/article-delivery-note-entry.repository';
import { ArticleDeliveryNoteEntryTaxService } from './article-delivery-note-entry-tax.service';
import { ArticleDeliveryNoteEntryNotFoundException } from '../errors/article-delivery-note-entry.notfound.error';
import { LineItem } from 'src/shared/calculations/interfaces/line-item.interface';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindOneOptions } from 'typeorm';

@Injectable()
export class ArticleDeliveryNoteEntryService {
  constructor(
    private readonly articleDeliveryNoteEntryRepository: ArticleDeliveryNoteEntryRepository,
    private readonly articleDeliveryNoteEntryTaxService: ArticleDeliveryNoteEntryTaxService,
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
    dto: CreateArticleDeliveryNoteEntryDto | UpdateArticleDeliveryNoteEntryDto,
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
        'Chaque ligne du bon de livraison doit contenir un article valide.',
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
  ): Promise<ResponseArticleDeliveryNoteEntryDto | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const entry = await this.articleDeliveryNoteEntryRepository.findOne(
      queryOptions as FindOneOptions<ArticleDeliveryNoteEntryEntity>,
    );
    if (!entry) return null;
    return entry;
  }

  async findOneById(id: number): Promise<ResponseArticleDeliveryNoteEntryDto> {
    const entry = await this.articleDeliveryNoteEntryRepository.findOneById(id);
    if (!entry) {
      throw new ArticleDeliveryNoteEntryNotFoundException();
    }
    return entry;
  }

  async findOneAsLineItem(id: number): Promise<LineItem> {
    const entry = await this.findOneByCondition({
      filter: `id||$eq||${id}`,
      join: 'articleDeliveryNoteEntryTaxes',
    });
    const taxes = entry.articleDeliveryNoteEntryTaxes
      ? await Promise.all(
          entry.articleDeliveryNoteEntryTaxes.map((taxEntry) =>
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
    createArticleDeliveryNoteEntryDto: CreateArticleDeliveryNoteEntryDto,
    cabinetId?: number,
  ): Promise<ArticleDeliveryNoteEntryEntity> {
    const taxes = await this.resolveTaxes(
      createArticleDeliveryNoteEntryDto.taxes,
      cabinetId,
    );
    const article = await this.resolveArticle(
      createArticleDeliveryNoteEntryDto,
      cabinetId,
    );

    const lineItem = {
      quantity: Number(createArticleDeliveryNoteEntryDto.quantity ?? 0),
      unit_price: Number(createArticleDeliveryNoteEntryDto.unit_price ?? 0),
      discount: Number(createArticleDeliveryNoteEntryDto.discount ?? 0),
      discount_type: createArticleDeliveryNoteEntryDto.discount_type,
      taxes: taxes,
    };

    const entry = await this.articleDeliveryNoteEntryRepository.save({
      quantity: lineItem.quantity,
      unit_price: lineItem.unit_price,
      discount: lineItem.discount,
      discount_type: createArticleDeliveryNoteEntryDto.discount_type,
      deliveryNoteId: createArticleDeliveryNoteEntryDto.deliveryNoteId,
      articleId: article.id,
      article: article,
      subTotal: this.calculationsService.calculateSubTotalForLineItem(lineItem),
      total: this.calculationsService.calculateTotalForLineItem(lineItem),
    });

    await this.articleDeliveryNoteEntryTaxService.saveMany(
      taxes.map((tax) => {
        return { taxId: tax.id, articleDeliveryNoteEntryId: entry.id };
      }),
    );
    return entry;
  }

  async saveMany(
    createArticleDeliveryNoteEntryDtos: CreateArticleDeliveryNoteEntryDto[],
    cabinetId?: number,
  ): Promise<ArticleDeliveryNoteEntryEntity[]> {
    const savedEntries = [];
    for (const dto of createArticleDeliveryNoteEntryDtos) {
      const savedEntry = await this.save(dto, cabinetId);
      savedEntries.push(savedEntry);
    }
    return savedEntries;
  }

  async update(
    id: number,
    updateArticleDeliveryNoteEntryDto: UpdateArticleDeliveryNoteEntryDto,
    cabinetId?: number,
  ): Promise<ArticleDeliveryNoteEntryEntity> {
    //fetch exisiting entry
    const existingEntry =
      await this.articleDeliveryNoteEntryRepository.findOneById(id);
    await this.articleDeliveryNoteEntryTaxService.softDeleteMany(
      (existingEntry.articleDeliveryNoteEntryTaxes ?? []).map(
        (taxEntry) => taxEntry.id,
      ),
    );

    //fetch and check the existance of all taxes
    const taxes = await this.resolveTaxes(
      updateArticleDeliveryNoteEntryDto.taxes,
      cabinetId,
    );

    //delete all existing taxes and rebuild
    for (const taxEntry of existingEntry.articleDeliveryNoteEntryTaxes ?? []) {
      await this.articleDeliveryNoteEntryTaxService.softDelete(taxEntry.id);
    }

    const article = await this.resolveArticle(
      updateArticleDeliveryNoteEntryDto,
      cabinetId,
    );

    const lineItem = {
      quantity: Number(updateArticleDeliveryNoteEntryDto.quantity ?? 0),
      unit_price: Number(updateArticleDeliveryNoteEntryDto.unit_price ?? 0),
      discount: Number(updateArticleDeliveryNoteEntryDto.discount ?? 0),
      discount_type: updateArticleDeliveryNoteEntryDto.discount_type,
      taxes: taxes,
    };

    //update the entry with the new data and save it
    const entry = await this.articleDeliveryNoteEntryRepository.save({
      ...existingEntry,
      quantity: lineItem.quantity,
      unit_price: lineItem.unit_price,
      discount: lineItem.discount,
      discount_type: updateArticleDeliveryNoteEntryDto.discount_type,
      deliveryNoteId:
        updateArticleDeliveryNoteEntryDto.deliveryNoteId ??
        existingEntry.deliveryNoteId,
      articleId: article.id,
      article: article,
      subTotal: this.calculationsService.calculateSubTotalForLineItem(lineItem),
      total: this.calculationsService.calculateTotalForLineItem(lineItem),
    });
    //save the new tax entries for the article entry
    await this.articleDeliveryNoteEntryTaxService.saveMany(
      taxes.map((tax) => {
        return { taxId: tax.id, articleDeliveryNoteEntryId: entry.id };
      }),
    );
    return entry;
  }

  async duplicate(
    id: number,
    deliveryNoteId: number,
  ): Promise<ArticleDeliveryNoteEntryEntity> {
    // Fetch the existing entry
    const existingEntry = await this.findOneByCondition({
      filter: `id||$eq||${id}`,
      join: 'articleDeliveryNoteEntryTaxes',
    });

    // Duplicate the taxes associated with this entry
    const duplicatedTaxes = existingEntry.articleDeliveryNoteEntryTaxes.map(
      (taxEntry) => ({ taxId: taxEntry.taxId }),
    );

    // Create the duplicated entry
    const duplicatedEntry = {
      ...existingEntry,
      deliveryNoteId: deliveryNoteId,
      id: undefined,
      articleDeliveryNoteEntryTaxes: duplicatedTaxes, // Attach duplicated taxes
      createdAt: undefined,
      updatedAt: undefined,
    };

    // Save the duplicated entry
    const newEntry =
      await this.articleDeliveryNoteEntryRepository.save(duplicatedEntry);

    // Save the new tax entries for the duplicated entry
    await this.articleDeliveryNoteEntryTaxService.saveMany(
      duplicatedTaxes.map((tax) => ({
        taxId: tax.taxId,
        articleDeliveryNoteEntryId: newEntry.id,
      })),
    );

    return newEntry;
  }

  async duplicateMany(
    ids: number[],
    deliveryNoteId: number,
  ): Promise<ArticleDeliveryNoteEntryEntity[]> {
    const duplicatedEntries = [];
    for (const id of ids) {
      const duplicatedEntry = await this.duplicate(id, deliveryNoteId);
      duplicatedEntries.push(duplicatedEntry);
    }
    return duplicatedEntries;
  }

  async softDelete(id: number): Promise<ArticleDeliveryNoteEntryEntity> {
    const entry = await this.articleDeliveryNoteEntryRepository.findOne({
      where: { id, deletedAt: null },
      relations: { articleDeliveryNoteEntryTaxes: true },
    });
    await this.articleDeliveryNoteEntryTaxService.softDeleteMany(
      entry.articleDeliveryNoteEntryTaxes.map((taxEntry) => taxEntry.id),
    );
    return this.articleDeliveryNoteEntryRepository.softDelete(id);
  }

  async softDeleteMany(
    ids: number[],
  ): Promise<ArticleDeliveryNoteEntryEntity[]> {
    const entries = await Promise.all(
      ids.map(async (id) => this.softDelete(id)),
    );
    return entries;
  }
}
