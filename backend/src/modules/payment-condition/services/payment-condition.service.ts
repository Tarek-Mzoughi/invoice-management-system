import { Injectable } from '@nestjs/common';
import { PaymentConditionRepository } from '../repositories/payment-condition.repository';
import { AbstractCrudService } from 'src/shared/database/services/abstract-crud.service';
import { PaymentConditionEntity } from '../entity/payment-condition.entity';

@Injectable()
export class PaymentConditionService extends AbstractCrudService<PaymentConditionEntity> {
  constructor(
    private readonly paymentConditionRepository: PaymentConditionRepository,
  ) {
    super(paymentConditionRepository);
  }
}
