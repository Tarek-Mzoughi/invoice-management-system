import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { ArticleInvoiceEntryTaxEntity } from '../entities/article-invoice-entry-tax.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class ArticleInvoiceEntryTaxRepository extends DatabaseAbstractRepository<ArticleInvoiceEntryTaxEntity> {
  constructor(
    @InjectRepository(ArticleInvoiceEntryTaxEntity)
    private readonly articleInvoiceEntryTaxRepository: Repository<ArticleInvoiceEntryTaxEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(articleInvoiceEntryTaxRepository, txHost);
  }
}
