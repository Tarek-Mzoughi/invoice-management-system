import { Injectable } from '@nestjs/common';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleDeliveryNoteEntryTaxEntity } from '../entities/article-delivery-note-entry-tax.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class ArticleDeliveryNoteEntryTaxRepository extends DatabaseAbstractRepository<ArticleDeliveryNoteEntryTaxEntity> {
  constructor(
    @InjectRepository(ArticleDeliveryNoteEntryTaxEntity)
    private readonly articleDeliveryNoteEntryTaxRepository: Repository<ArticleDeliveryNoteEntryTaxEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(articleDeliveryNoteEntryTaxRepository, txHost);
  }
}
