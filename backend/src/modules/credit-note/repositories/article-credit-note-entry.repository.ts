import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { ArticleCreditNoteEntryEntity } from '../entities/article-credit-note-entry.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class ArticleCreditNoteEntryRepository extends DatabaseAbstractRepository<ArticleCreditNoteEntryEntity> {
  constructor(
    @InjectRepository(ArticleCreditNoteEntryEntity)
    private readonly articleCreditNoteEntryRepository: Repository<ArticleCreditNoteEntryEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(articleCreditNoteEntryRepository, txHost);
  }
}
