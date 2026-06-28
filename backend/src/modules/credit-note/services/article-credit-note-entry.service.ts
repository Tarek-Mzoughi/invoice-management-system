import { BadRequestException, Injectable } from '@nestjs/common';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { ArticleService } from 'src/modules/article/services/article.service';
import { InvoicingCalculationsService } from 'src/shared/calculations/services/invoicing.calculations.service';
import { LineItem } from 'src/shared/calculations/interfaces/line-item.interface';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FindOneOptions } from 'typeorm';
import { ArticleCreditNoteEntryRepository } from '../repositories/article-credit-note-entry.repository';
import { ArticleCreditNoteEntryTaxService } from './article-credit-note-entry-tax.service';
import { ResponseArticleCreditNoteEntryDto } from '../dtos/article-credit-note-entry.response.dto';
import { ArticleCreditNoteEntryEntity } from '../entities/article-credit-note-entry.entity';
import { ArticleCreditNoteEntryNotFoundException } from '../errors/article-credit-note-entry.notfound.error';
import { CreateArticleCreditNoteEntryDto } from '../dtos/article-credit-note-entry.create.dto';
import { UpdateArticleCreditNoteEntryDto } from '../dtos/article-credit-note-entry.update.dto';

@Injectable()
export class ArticleCreditNoteEntryService {
  constructor(
    private readonly articleCreditNoteEntryRepository: ArticleCreditNoteEntryRepository,
    private readonly articleCreditNoteEntryTaxService: ArticleCreditNoteEntryTaxService,
    private readonly articleService: ArticleService,
    private readonly taxService: TaxService,
    private readonly calculationsService: InvoicingCalculationsService,
  ) {}

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
  ): Promise<ResponseArticleCreditNoteEntryDto | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const entry = await this.articleCreditNoteEntryRepository.findOne(
      queryOptions as FindOneOptions<ArticleCreditNoteEntryEntity>,
    );
    if (!entry) return null;
    return entry;
  }

  async findOneById(id: number): Promise<ResponseArticleCreditNoteEntryDto> {
    const entry = await this.articleCreditNoteEntryRepository.findOneById(id);
    if (!entry) {
      throw new ArticleCreditNoteEntryNotFoundException();
    }
    return entry;
  }

  async findOneAsLineItem(id: number): Promise<LineItem> {
    const entry = await this.findOneByCondition({
      filter: `id||$eq||${id}`,
      join: 'articleCreditNoteEntryTaxes',
    });
    const taxes = entry.articleCreditNoteEntryTaxes
      ? await Promise.all(
          entry.articleCreditNoteEntryTaxes.map((taxEntry) =>
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
    createArticleCreditNoteEntryDto: CreateArticleCreditNoteEntryDto,
    cabinetId?: number,
  ): Promise<ArticleCreditNoteEntryEntity> {
    const normalizedCabinetId = this.normalizeCabinetId(cabinetId);
    const taxes = createArticleCreditNoteEntryDto.taxes
      ? await Promise.all(
          createArticleCreditNoteEntryDto.taxes.map((id) =>
            this.taxService.findOneAuthorizedForCabinet(
              id,
              normalizedCabinetId,
              true,
            ),
          ),
        )
      : [];

    const articleToCreate = {
      ...createArticleCreditNoteEntryDto.article,
      cabinetId: normalizedCabinetId,
    };
    const article =
      (await this.articleService.findOneByCondition({
        filter: `title||$eq||${createArticleCreditNoteEntryDto.article.title};cabinetId||$eq||${normalizedCabinetId}`,
      })) || (await this.articleService.save(articleToCreate));

    const lineItem = {
      quantity: createArticleCreditNoteEntryDto.quantity,
      unit_price: createArticleCreditNoteEntryDto.unit_price,
      discount: createArticleCreditNoteEntryDto.discount,
      discount_type: createArticleCreditNoteEntryDto.discount_type,
      taxes: taxes,
    };

    const entry = await this.articleCreditNoteEntryRepository.save({
      ...createArticleCreditNoteEntryDto,
      articleId: article.id,
      article: article,
      subTotal: this.calculationsService.calculateSubTotalForLineItem(lineItem),
      total: this.calculationsService.calculateTotalForLineItem(lineItem),
    });

    await this.articleCreditNoteEntryTaxService.saveMany(
      taxes.map((tax) => {
        return { taxId: tax.id, articleCreditNoteEntryId: entry.id };
      }),
    );
    return entry;
  }

  async saveMany(
    createArticleCreditNoteEntryDtos: CreateArticleCreditNoteEntryDto[],
    cabinetId?: number,
  ): Promise<ArticleCreditNoteEntryEntity[]> {
    const savedEntries = [];
    for (const dto of createArticleCreditNoteEntryDtos) {
      const savedEntry = await this.save(dto, cabinetId);
      savedEntries.push(savedEntry);
    }
    return savedEntries;
  }

  async update(
    id: number,
    updateArticleCreditNoteEntryDto: UpdateArticleCreditNoteEntryDto,
    cabinetId?: number,
  ): Promise<ArticleCreditNoteEntryEntity> {
    const normalizedCabinetId = this.normalizeCabinetId(cabinetId);
    //fetch exisiting entry
    const existingEntry =
      await this.articleCreditNoteEntryRepository.findOneById(id);
    this.articleCreditNoteEntryTaxService.softDeleteMany(
      existingEntry.articleCreditNoteEntryTaxes.map((taxEntry) => taxEntry.id),
    );

    //fetch and check the existance of all taxes
    const taxes = updateArticleCreditNoteEntryDto.taxes
      ? await Promise.all(
          updateArticleCreditNoteEntryDto.taxes.map((id) =>
            this.taxService.findOneAuthorizedForCabinet(
              id,
              normalizedCabinetId,
              true,
            ),
          ),
        )
      : [];

    //delete all existing taxes and rebuild
    for (const taxEntry of existingEntry.articleCreditNoteEntryTaxes) {
      this.articleCreditNoteEntryTaxService.softDelete(taxEntry.id);
    }

    const articleToCreate = {
      ...updateArticleCreditNoteEntryDto.article,
      cabinetId: normalizedCabinetId,
    };
    const article =
      (await this.articleService.findOneByCondition({
        filter: `title||$eq||${updateArticleCreditNoteEntryDto.article.title};cabinetId||$eq||${normalizedCabinetId}`,
      })) || (await this.articleService.save(articleToCreate));

    const lineItem = {
      quantity: updateArticleCreditNoteEntryDto.quantity,
      unit_price: updateArticleCreditNoteEntryDto.unit_price,
      discount: updateArticleCreditNoteEntryDto.discount,
      discount_type: updateArticleCreditNoteEntryDto.discount_type,
      taxes: taxes,
    };

    //update the entry with the new data and save it
    const entry = await this.articleCreditNoteEntryRepository.save({
      ...existingEntry,
      ...updateArticleCreditNoteEntryDto,
      articleId: article.id,
      article: article,
      subTotal: this.calculationsService.calculateSubTotalForLineItem(lineItem),
      total: this.calculationsService.calculateTotalForLineItem(lineItem),
    });
    //save the new tax entries for the article entry
    await this.articleCreditNoteEntryTaxService.saveMany(
      taxes.map((tax) => {
        return { taxId: tax.id, articleCreditNoteEntryId: entry.id };
      }),
    );
    return entry;
  }

  async duplicate(
    id: number,
    creditNoteId: number,
  ): Promise<ArticleCreditNoteEntryEntity> {
    // Fetch the existing entry
    const existingEntry = await this.findOneByCondition({
      filter: `id||$eq||${id}`,
      join: 'articleCreditNoteEntryTaxes',
    });

    // Duplicate the taxes associated with this entry
    const duplicatedTaxes = existingEntry.articleCreditNoteEntryTaxes.map(
      (taxEntry) => ({ taxId: taxEntry.taxId }),
    );

    // Create the duplicated entry
    const duplicatedEntry = {
      ...existingEntry,
      creditNoteId: creditNoteId,
      id: undefined,
      articleCreditNoteEntryTaxes: duplicatedTaxes, // Attach duplicated taxes
      createdAt: undefined,
      updatedAt: undefined,
    };

    // Save the duplicated entry
    const newEntry =
      await this.articleCreditNoteEntryRepository.save(duplicatedEntry);

    // Save the new tax entries for the duplicated entry
    await this.articleCreditNoteEntryTaxService.saveMany(
      duplicatedTaxes.map((tax) => ({
        taxId: tax.taxId,
        articleCreditNoteEntryId: newEntry.id,
      })),
    );

    return newEntry;
  }

  async duplicateMany(
    ids: number[],
    creditNoteId: number,
  ): Promise<ArticleCreditNoteEntryEntity[]> {
    const duplicatedEntries = [];
    for (const id of ids) {
      const duplicatedEntry = await this.duplicate(id, creditNoteId);
      duplicatedEntries.push(duplicatedEntry);
    }
    return duplicatedEntries;
  }

  async softDelete(id: number): Promise<ArticleCreditNoteEntryEntity> {
    const entry = await this.articleCreditNoteEntryRepository.findOne({
      where: { id, deletedAt: null },
      relations: { articleCreditNoteEntryTaxes: true },
    });
    await this.articleCreditNoteEntryTaxService.softDeleteMany(
      entry.articleCreditNoteEntryTaxes.map((taxEntry) => taxEntry.id),
    );
    return this.articleCreditNoteEntryRepository.softDelete(id);
  }

  async softDeleteMany(ids: number[]): Promise<ArticleCreditNoteEntryEntity[]> {
    const entries = await Promise.all(
      ids.map(async (id) => this.softDelete(id)),
    );
    return entries;
  }
}
