import { Injectable } from '@nestjs/common';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleDeliveryNoteEntryEntity } from '../entities/article-delivery-note-entry.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class ArticleDeliveryNoteEntryRepository extends DatabaseAbstractRepository<ArticleDeliveryNoteEntryEntity> {
  constructor(
    @InjectRepository(ArticleDeliveryNoteEntryEntity)
    private readonly articleDeliveryNoteEntryRepository: Repository<ArticleDeliveryNoteEntryEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(articleDeliveryNoteEntryRepository, txHost);
  }
}
