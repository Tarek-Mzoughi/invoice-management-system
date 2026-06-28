import { Injectable } from '@nestjs/common';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { CreateArticleReturnNoteEntryTaxDto } from '../dtos/article-return-note-entry-tax.create.dto';
import { ArticleReturnNoteEntryTaxEntity } from '../entities/article-return-note-entry-tax.entity';
import { ArticleReturnNoteEntryTaxRepository } from '../repositories/article-return-note-entry-tax.repository';

@Injectable()
export class ArticleReturnNoteEntryTaxService {
  constructor(
    private readonly articleReturnNoteEntryTaxRepository: ArticleReturnNoteEntryTaxRepository,
    private readonly taxService: TaxService,
  ) {}

  async save(
    createArticleReturnNoteEntryTaxDto: CreateArticleReturnNoteEntryTaxDto,
  ): Promise<ArticleReturnNoteEntryTaxEntity> {
    const tax = await this.taxService.findOneById(
      createArticleReturnNoteEntryTaxDto.taxId,
    );
    const taxEntry = await this.articleReturnNoteEntryTaxRepository.save({
      articleReturnNoteEntryId:
        createArticleReturnNoteEntryTaxDto.articleReturnNoteEntryId,
      tax,
    });
    return taxEntry;
  }

  async saveMany(
    createArticleReturnNoteEntryTaxDtos: CreateArticleReturnNoteEntryTaxDto[],
  ): Promise<ArticleReturnNoteEntryTaxEntity[]> {
    const savedEntries = [];
    for (const dto of createArticleReturnNoteEntryTaxDtos) {
      const savedEntry = await this.save(dto);
      savedEntries.push(savedEntry);
    }
    return savedEntries;
  }

  async softDelete(id: number): Promise<void> {
    await this.articleReturnNoteEntryTaxRepository.softDelete(id);
  }

  async softDeleteMany(ids: number[]): Promise<void> {
    ids.forEach(async (id) => await this.softDelete(id));
  }
}
