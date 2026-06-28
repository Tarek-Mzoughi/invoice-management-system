import { Injectable } from '@nestjs/common';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleReturnNoteEntryTaxEntity } from '../entities/article-return-note-entry-tax.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class ArticleReturnNoteEntryTaxRepository extends DatabaseAbstractRepository<ArticleReturnNoteEntryTaxEntity> {
  constructor(
    @InjectRepository(ArticleReturnNoteEntryTaxEntity)
    private readonly articleReturnNoteEntryTaxRepository: Repository<ArticleReturnNoteEntryTaxEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(articleReturnNoteEntryTaxRepository, txHost);
  }
}
