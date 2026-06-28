import { Module } from '@nestjs/common';
import { FirmService } from './services/firm.service';
import { InterlocutorModule } from '../interlocutor/Interlocutor.module';
import { AddressModule } from '../address/address.module';
import { CurrencyModule } from '../currency/currency.module';
import { ActivityModule } from '../activity/activity.module';
import { PaymentConditionModule } from '../payment-condition/payment-condition.module';
import { FirmInterlocutorEntryModule } from '../firm-interlocutor-entry/firm-interlocutor-entry.module';
import { FirmRepository } from './repositories/firm.repository';
import { FirmEntity } from './entities/firm.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';

@Module({
  controllers: [],
  providers: [FirmRepository, FirmService],
  exports: [FirmRepository, FirmService],
  imports: [
    TypeOrmModule.forFeature([FirmEntity]),
    ActivityModule,
    AddressModule,
    CurrencyModule,
    InterlocutorModule,
    PaymentConditionModule,
    FirmInterlocutorEntryModule,
    TenantContextModule,
  ],
})
export class FirmModule {}
