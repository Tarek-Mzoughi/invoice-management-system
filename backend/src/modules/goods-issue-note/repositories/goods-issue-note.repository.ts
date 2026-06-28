import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GoodsIssueNoteEntity } from '../entities/goods-issue-note.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class GoodsIssueNoteRepository extends DatabaseAbstractRepository<GoodsIssueNoteEntity> {
  constructor(
    @InjectRepository(GoodsIssueNoteEntity)
    private readonly goodsIssueNoteRepository: Repository<GoodsIssueNoteEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(goodsIssueNoteRepository, txHost);
  }
}
