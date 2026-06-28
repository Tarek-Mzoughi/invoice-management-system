import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { AiReminderEntity } from '../entities/ai-reminder.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class AiReminderRepository extends DatabaseAbstractRepository<AiReminderEntity> {
  constructor(
    @InjectRepository(AiReminderEntity)
    private readonly aiReminderRepository: Repository<AiReminderEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(aiReminderRepository, txHost);
  }
}
