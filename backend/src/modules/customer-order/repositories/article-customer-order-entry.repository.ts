import { Injectable } from '@nestjs/common';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleCustomerOrderEntryEntity } from '../entities/article-customer-order-entry.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class ArticleCustomerOrderEntryRepository extends DatabaseAbstractRepository<ArticleCustomerOrderEntryEntity> {
  constructor(
    @InjectRepository(ArticleCustomerOrderEntryEntity)
    private readonly articleCustomerOrderEntryRepository: Repository<ArticleCustomerOrderEntryEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(articleCustomerOrderEntryRepository, txHost);
  }
}
