import { Injectable } from '@nestjs/common';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleGoodsIssueNoteEntryTaxEntity } from '../entities/article-goods-issue-note-entry-tax.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class ArticleGoodsIssueNoteEntryTaxRepository extends DatabaseAbstractRepository<ArticleGoodsIssueNoteEntryTaxEntity> {
  constructor(
    @InjectRepository(ArticleGoodsIssueNoteEntryTaxEntity)
    private readonly articleGoodsIssueNoteEntryTaxRepository: Repository<ArticleGoodsIssueNoteEntryTaxEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(articleGoodsIssueNoteEntryTaxRepository, txHost);
  }
}
