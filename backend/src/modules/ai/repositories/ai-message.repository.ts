import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { AiMessageEntity } from '../entities/ai-message.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class AiMessageRepository extends DatabaseAbstractRepository<AiMessageEntity> {
  constructor(
    @InjectRepository(AiMessageEntity)
    private readonly aiMessageRepository: Repository<AiMessageEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(aiMessageRepository, txHost);
  }
}
