import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GoodsIssueNoteMetaDataEntity } from '../entities/goods-issue-note-meta-data.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class GoodsIssueNoteMetaDataRepository extends DatabaseAbstractRepository<GoodsIssueNoteMetaDataEntity> {
  constructor(
    @InjectRepository(GoodsIssueNoteMetaDataEntity)
    private readonly goodsIssueNoteMetaDataRespository: Repository<GoodsIssueNoteMetaDataEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(goodsIssueNoteMetaDataRespository, txHost);
  }
}
