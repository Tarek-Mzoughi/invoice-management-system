import { Injectable } from '@nestjs/common';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleReturnNoteEntryEntity } from '../entities/article-return-note-entry.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class ArticleReturnNoteEntryRepository extends DatabaseAbstractRepository<ArticleReturnNoteEntryEntity> {
  constructor(
    @InjectRepository(ArticleReturnNoteEntryEntity)
    private readonly articleReturnNoteEntryRepository: Repository<ArticleReturnNoteEntryEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(articleReturnNoteEntryRepository, txHost);
  }
}
