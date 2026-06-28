import { Injectable } from '@nestjs/common';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleCustomerOrderEntryTaxEntity } from '../entities/article-customer-order-entry-tax.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class ArticleCustomerOrderEntryTaxRepository extends DatabaseAbstractRepository<ArticleCustomerOrderEntryTaxEntity> {
  constructor(
    @InjectRepository(ArticleCustomerOrderEntryTaxEntity)
    private readonly articleCustomerOrderEntryTaxRepository: Repository<ArticleCustomerOrderEntryTaxEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(articleCustomerOrderEntryTaxRepository, txHost);
  }
}
