import { Module } from '@nestjs/common';
import { PaymentConditionService } from './services/payment-condition.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentConditionEntity } from './entity/payment-condition.entity';
import { PaymentConditionRepository } from './repositories/payment-condition.repository';

@Module({
  controllers: [],
  providers: [PaymentConditionRepository, PaymentConditionService],
  exports: [PaymentConditionRepository, PaymentConditionService],
  imports: [TypeOrmModule.forFeature([PaymentConditionEntity])],
})
export class PaymentConditionModule {}
