import { Module } from '@nestjs/common';
import { DefaultConditionService } from './services/default-condition.service';
import { QuotationModule } from '../quotation/quotation.module';
import { DefaultConditionRepository } from './repositories/default-condition.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DefaultConditionEntity } from './entities/default-condition.entity';

@Module({
  controllers: [],
  providers: [DefaultConditionRepository, DefaultConditionService],
  exports: [DefaultConditionRepository, DefaultConditionService],
  imports: [
    TypeOrmModule.forFeature([DefaultConditionEntity]),
    QuotationModule,
  ],
})
export class DefaultConditionModule {}
