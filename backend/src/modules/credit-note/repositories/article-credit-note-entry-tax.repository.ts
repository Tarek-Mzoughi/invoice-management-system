import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { ArticleCreditNoteEntryTaxEntity } from '../entities/article-credit-note-entry-tax.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class ArticleCreditNoteEntryTaxRepository extends DatabaseAbstractRepository<ArticleCreditNoteEntryTaxEntity> {
  constructor(
    @InjectRepository(ArticleCreditNoteEntryTaxEntity)
    private readonly articleCreditNoteEntryTaxRepository: Repository<ArticleCreditNoteEntryTaxEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(articleCreditNoteEntryTaxRepository, txHost);
  }
}
