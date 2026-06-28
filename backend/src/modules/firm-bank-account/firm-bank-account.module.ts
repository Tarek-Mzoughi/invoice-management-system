import { Module } from '@nestjs/common';
import { FirmBankAccountService } from './services/firm-bank-account.service';
import { FirmBankAccountRepository } from './repositories/firm-bank-account.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirmBankAccountEntity } from './entities/firm-bank-account.entity';
import { UserManagementModule } from '../user-management/user-management.module';

@Module({
  controllers: [],
  providers: [FirmBankAccountRepository, FirmBankAccountService],
  exports: [FirmBankAccountRepository, FirmBankAccountService],
  imports: [
    TypeOrmModule.forFeature([FirmBankAccountEntity]),
    UserManagementModule,
  ],
})
export class FirmBankAccountModule {}
