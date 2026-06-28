import { Injectable } from '@nestjs/common';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { CreateArticleCustomerOrderEntryTaxDto } from '../dtos/article-customer-order-entry-tax.create.dto';
import { ArticleCustomerOrderEntryTaxEntity } from '../entities/article-customer-order-entry-tax.entity';
import { ArticleCustomerOrderEntryTaxRepository } from '../repositories/article-customer-order-entry-tax.repository';

@Injectable()
export class ArticleCustomerOrderEntryTaxService {
  constructor(
    private readonly articleCustomerOrderEntryTaxRepository: ArticleCustomerOrderEntryTaxRepository,
    private readonly taxService: TaxService,
  ) {}

  async save(
    createArticleCustomerOrderEntryTaxDto: CreateArticleCustomerOrderEntryTaxDto,
  ): Promise<ArticleCustomerOrderEntryTaxEntity> {
    const tax = await this.taxService.findOneById(
      createArticleCustomerOrderEntryTaxDto.taxId,
    );
    const taxEntry = await this.articleCustomerOrderEntryTaxRepository.save({
      articleCustomerOrderEntryId:
        createArticleCustomerOrderEntryTaxDto.articleCustomerOrderEntryId,
      tax,
    });
    return taxEntry;
  }

  async saveMany(
    createArticleCustomerOrderEntryTaxDtos: CreateArticleCustomerOrderEntryTaxDto[],
  ): Promise<ArticleCustomerOrderEntryTaxEntity[]> {
    const savedEntries = [];
    for (const dto of createArticleCustomerOrderEntryTaxDtos) {
      const savedEntry = await this.save(dto);
      savedEntries.push(savedEntry);
    }
    return savedEntries;
  }

  async softDelete(id: number): Promise<void> {
    await this.articleCustomerOrderEntryTaxRepository.softDelete(id);
  }

  async softDeleteMany(ids: number[]): Promise<void> {
    ids.forEach(async (id) => await this.softDelete(id));
  }
}
