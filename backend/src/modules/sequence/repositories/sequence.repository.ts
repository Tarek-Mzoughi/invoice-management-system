import { Injectable } from '@nestjs/common';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';
import { SequenceEntity } from '../entities/sequence.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';

@Injectable()
export class SequenceRepository extends DatabaseAbstractRepository<SequenceEntity> {
  constructor(
    @InjectRepository(SequenceEntity)
    private readonly sequenceRepository: Repository<SequenceEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(sequenceRepository, txHost);
  }
}
