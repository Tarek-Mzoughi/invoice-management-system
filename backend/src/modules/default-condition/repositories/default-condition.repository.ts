import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DefaultConditionEntity } from '../entities/default-condition.entity';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class DefaultConditionRepository extends DatabaseAbstractRepository<DefaultConditionEntity> {
  constructor(
    @InjectRepository(DefaultConditionEntity)
    private readonly defaultConditionRespository: Repository<DefaultConditionEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(defaultConditionRespository, txHost);
  }
}
