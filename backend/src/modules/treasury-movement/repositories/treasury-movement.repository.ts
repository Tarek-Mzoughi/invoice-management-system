import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Repository } from 'typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { TreasuryMovementEntity } from '../entities/treasury-movement.entity';

@Injectable()
export class TreasuryMovementRepository extends DatabaseAbstractRepository<TreasuryMovementEntity> {
  constructor(
    @InjectRepository(TreasuryMovementEntity)
    private readonly treasuryMovementRepository: Repository<TreasuryMovementEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(treasuryMovementRepository, txHost);
  }
}
