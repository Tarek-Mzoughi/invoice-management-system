import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { ReturnNoteStockMovementEntity } from '../entities/return-note-stock-movement.entity';

@Injectable()
export class ReturnNoteStockMovementRepository extends DatabaseAbstractRepository<ReturnNoteStockMovementEntity> {
  constructor(
    @InjectRepository(ReturnNoteStockMovementEntity)
    private readonly returnNoteStockMovementRepository: Repository<ReturnNoteStockMovementEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(returnNoteStockMovementRepository, txHost);
  }
}
