import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { ArticleInvoiceEntryEntity } from '../entities/article-invoice-entry.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class ArticleInvoiceEntryRepository extends DatabaseAbstractRepository<ArticleInvoiceEntryEntity> {
  constructor(
    @InjectRepository(ArticleInvoiceEntryEntity)
    private readonly articleInvoiceEntryRepository: Repository<ArticleInvoiceEntryEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(articleInvoiceEntryRepository, txHost);
  }
}
