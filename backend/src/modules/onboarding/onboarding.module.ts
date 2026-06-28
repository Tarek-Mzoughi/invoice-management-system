import { Module } from '@nestjs/common';
import { CabinetModule } from 'src/modules/cabinet/cabinet.module';
import { ActivityModule } from 'src/modules/activity/activity.module';
import { TaxModule } from 'src/modules/tax/tax.module';
import { UserManagementModule } from 'src/modules/user-management/user-management.module';
import { PriceListModule } from 'src/modules/price-list/price-list.module';
import { BankAccountModule } from 'src/modules/bank-account/bank-account.module';
import { CurrencyModule } from 'src/modules/currency/currency.module';
import { OnboardingService } from './services/onboarding.service';

@Module({
  providers: [OnboardingService],
  imports: [
    ActivityModule,
    CabinetModule,
    TaxModule,
    UserManagementModule,
    PriceListModule,
    BankAccountModule,
    CurrencyModule,
  ],
  exports: [OnboardingService],
})
export class OnboardingModule {}
