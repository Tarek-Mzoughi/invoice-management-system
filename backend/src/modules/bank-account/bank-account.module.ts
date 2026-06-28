import { Module } from '@nestjs/common';
import { BankAccountService } from './services/bank-account.service';
import { BankAccountRepository } from './repositories/bank-account.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccountEntity } from './entities/bank-account.entity';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';

@Module({
  controllers: [],
  providers: [BankAccountRepository, BankAccountService],
  exports: [BankAccountRepository, BankAccountService],
  imports: [TypeOrmModule.forFeature([BankAccountEntity]), TenantContextModule],
})
export class BankAccountModule {}
