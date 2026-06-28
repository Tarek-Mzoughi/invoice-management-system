import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { AiActionLogEntity } from '../entities/ai-action-log.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class AiActionLogRepository extends DatabaseAbstractRepository<AiActionLogEntity> {
  constructor(
    @InjectRepository(AiActionLogEntity)
    private readonly aiActionLogRepository: Repository<AiActionLogEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(aiActionLogRepository, txHost);
  }
}
