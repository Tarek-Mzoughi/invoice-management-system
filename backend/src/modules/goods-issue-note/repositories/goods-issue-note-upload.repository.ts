import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GoodsIssueNoteStorageEntity } from '../entities/goods-issue-note-file.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class GoodsIssueNoteUploadRepository extends DatabaseAbstractRepository<GoodsIssueNoteStorageEntity> {
  constructor(
    @InjectRepository(GoodsIssueNoteStorageEntity)
    private readonly goodsIssueNoteUploadRespository: Repository<GoodsIssueNoteStorageEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(goodsIssueNoteUploadRespository, txHost);
  }
}
