import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { AiNotificationEntity } from '../entities/ai-notification.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class AiNotificationRepository extends DatabaseAbstractRepository<AiNotificationEntity> {
  constructor(
    @InjectRepository(AiNotificationEntity)
    private readonly aiNotificationRepository: Repository<AiNotificationEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(aiNotificationRepository, txHost);
  }
}
