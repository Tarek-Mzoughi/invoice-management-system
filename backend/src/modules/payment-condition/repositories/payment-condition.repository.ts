import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaymentConditionEntity } from '../entity/payment-condition.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class PaymentConditionRepository extends DatabaseAbstractRepository<PaymentConditionEntity> {
  constructor(
    @InjectRepository(PaymentConditionEntity)
    private readonly paymentConditionRepository: Repository<PaymentConditionEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(paymentConditionRepository, txHost);
  }
}
