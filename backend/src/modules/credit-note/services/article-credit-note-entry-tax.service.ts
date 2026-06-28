import { Injectable } from '@nestjs/common';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { ArticleCreditNoteEntryTaxRepository } from '../repositories/article-credit-note-entry-tax.repository';
import { ArticleCreditNoteEntryTaxEntity } from '../entities/article-credit-note-entry-tax.entity';
import { CreateArticleCreditNoteEntryTaxDto } from '../dtos/article-credit-note-entry-tax.create.dto';

@Injectable()
export class ArticleCreditNoteEntryTaxService {
  constructor(
    private readonly articleCreditNoteEntryTaxRepository: ArticleCreditNoteEntryTaxRepository,
    private readonly taxService: TaxService,
  ) {}

  async save(
    createArticleCreditNoteEntryTaxDto: CreateArticleCreditNoteEntryTaxDto,
  ): Promise<ArticleCreditNoteEntryTaxEntity> {
    const tax = await this.taxService.findOneById(
      createArticleCreditNoteEntryTaxDto.taxId,
    );
    const taxEntry = await this.articleCreditNoteEntryTaxRepository.save({
      articleCreditNoteEntryId:
        createArticleCreditNoteEntryTaxDto.articleCreditNoteEntryId,
      tax,
    });
    return taxEntry;
  }

  async saveMany(
    createArticleCreditNoteEntryTaxDtos: CreateArticleCreditNoteEntryTaxDto[],
  ): Promise<ArticleCreditNoteEntryTaxEntity[]> {
    const savedEntries = [];
    for (const dto of createArticleCreditNoteEntryTaxDtos) {
      const savedEntry = await this.save(dto);
      savedEntries.push(savedEntry);
    }
    return savedEntries;
  }

  async softDelete(id: number): Promise<void> {
    await this.articleCreditNoteEntryTaxRepository.softDelete(id);
  }

  async softDeleteMany(ids: number[]): Promise<void> {
    ids.forEach(async (id) => await this.softDelete(id));
  }
}
