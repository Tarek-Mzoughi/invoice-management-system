import { Injectable } from '@nestjs/common';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { CreateArticleDeliveryNoteEntryTaxDto } from '../dtos/article-delivery-note-entry-tax.create.dto';
import { ArticleDeliveryNoteEntryTaxEntity } from '../entities/article-delivery-note-entry-tax.entity';
import { ArticleDeliveryNoteEntryTaxRepository } from '../repositories/article-delivery-note-entry-tax.repository';

@Injectable()
export class ArticleDeliveryNoteEntryTaxService {
  constructor(
    private readonly articleDeliveryNoteEntryTaxRepository: ArticleDeliveryNoteEntryTaxRepository,
    private readonly taxService: TaxService,
  ) {}

  async save(
    createArticleDeliveryNoteEntryTaxDto: CreateArticleDeliveryNoteEntryTaxDto,
  ): Promise<ArticleDeliveryNoteEntryTaxEntity> {
    const tax = await this.taxService.findOneById(
      createArticleDeliveryNoteEntryTaxDto.taxId,
    );
    const taxEntry = await this.articleDeliveryNoteEntryTaxRepository.save({
      articleDeliveryNoteEntryId:
        createArticleDeliveryNoteEntryTaxDto.articleDeliveryNoteEntryId,
      tax,
    });
    return taxEntry;
  }

  async saveMany(
    createArticleDeliveryNoteEntryTaxDtos: CreateArticleDeliveryNoteEntryTaxDto[],
  ): Promise<ArticleDeliveryNoteEntryTaxEntity[]> {
    const savedEntries = [];
    for (const dto of createArticleDeliveryNoteEntryTaxDtos) {
      const savedEntry = await this.save(dto);
      savedEntries.push(savedEntry);
    }
    return savedEntries;
  }

  async softDelete(id: number): Promise<void> {
    await this.articleDeliveryNoteEntryTaxRepository.softDelete(id);
  }

  async softDeleteMany(ids: number[]): Promise<void> {
    ids.forEach(async (id) => await this.softDelete(id));
  }
}
