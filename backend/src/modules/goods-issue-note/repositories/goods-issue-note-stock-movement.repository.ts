import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { GoodsIssueNoteStockMovementEntity } from '../entities/goods-issue-note-stock-movement.entity';

@Injectable()
export class GoodsIssueNoteStockMovementRepository extends DatabaseAbstractRepository<GoodsIssueNoteStockMovementEntity> {
  constructor(
    @InjectRepository(GoodsIssueNoteStockMovementEntity)
    private readonly goodsIssueNoteStockMovementRepository: Repository<GoodsIssueNoteStockMovementEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(goodsIssueNoteStockMovementRepository, txHost);
  }
}
