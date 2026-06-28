import { Injectable } from '@nestjs/common';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { CreateArticleGoodsIssueNoteEntryTaxDto } from '../dtos/article-goods-issue-note-entry-tax.create.dto';
import { ArticleGoodsIssueNoteEntryTaxEntity } from '../entities/article-goods-issue-note-entry-tax.entity';
import { ArticleGoodsIssueNoteEntryTaxRepository } from '../repositories/article-goods-issue-note-entry-tax.repository';

@Injectable()
export class ArticleGoodsIssueNoteEntryTaxService {
  constructor(
    private readonly articleGoodsIssueNoteEntryTaxRepository: ArticleGoodsIssueNoteEntryTaxRepository,
    private readonly taxService: TaxService,
  ) {}

  async save(
    createArticleGoodsIssueNoteEntryTaxDto: CreateArticleGoodsIssueNoteEntryTaxDto,
  ): Promise<ArticleGoodsIssueNoteEntryTaxEntity> {
    const tax = await this.taxService.findOneById(
      createArticleGoodsIssueNoteEntryTaxDto.taxId,
    );
    const taxEntry = await this.articleGoodsIssueNoteEntryTaxRepository.save({
      articleGoodsIssueNoteEntryId:
        createArticleGoodsIssueNoteEntryTaxDto.articleGoodsIssueNoteEntryId,
      tax,
    });
    return taxEntry;
  }

  async saveMany(
    createArticleGoodsIssueNoteEntryTaxDtos: CreateArticleGoodsIssueNoteEntryTaxDto[],
  ): Promise<ArticleGoodsIssueNoteEntryTaxEntity[]> {
    const savedEntries = [];
    for (const dto of createArticleGoodsIssueNoteEntryTaxDtos) {
      const savedEntry = await this.save(dto);
      savedEntries.push(savedEntry);
    }
    return savedEntries;
  }

  async softDelete(id: number): Promise<void> {
    await this.articleGoodsIssueNoteEntryTaxRepository.softDelete(id);
  }

  async softDeleteMany(ids: number[]): Promise<void> {
    ids.forEach(async (id) => await this.softDelete(id));
  }
}
