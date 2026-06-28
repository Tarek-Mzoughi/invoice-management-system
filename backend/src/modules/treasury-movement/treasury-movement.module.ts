import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccountModule } from '../bank-account/bank-account.module';
import { TreasuryMovementEntity } from './entities/treasury-movement.entity';
import { TreasuryMovementRepository } from './repositories/treasury-movement.repository';
import { TreasuryMovementService } from './services/treasury-movement.service';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';

@Module({
  controllers: [],
  providers: [TreasuryMovementRepository, TreasuryMovementService],
  exports: [TreasuryMovementRepository, TreasuryMovementService],
  imports: [
    TypeOrmModule.forFeature([TreasuryMovementEntity]),
    BankAccountModule,
    TenantContextModule,
  ],
})
export class TreasuryMovementModule {}
