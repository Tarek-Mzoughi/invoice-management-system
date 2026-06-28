import { Injectable } from '@nestjs/common';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleGoodsIssueNoteEntryEntity } from '../entities/article-goods-issue-note-entry.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class ArticleGoodsIssueNoteEntryRepository extends DatabaseAbstractRepository<ArticleGoodsIssueNoteEntryEntity> {
  constructor(
    @InjectRepository(ArticleGoodsIssueNoteEntryEntity)
    private readonly articleGoodsIssueNoteEntryRepository: Repository<ArticleGoodsIssueNoteEntryEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(articleGoodsIssueNoteEntryRepository, txHost);
  }
}
