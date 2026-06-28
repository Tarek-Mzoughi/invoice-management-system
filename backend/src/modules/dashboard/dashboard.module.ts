import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from 'src/modules/article/entities/article.entity';
import { BankAccountEntity } from 'src/modules/bank-account/entities/bank-account.entity';
import { CabinetModule } from 'src/modules/cabinet/cabinet.module';
import { CurrencyModule } from 'src/modules/currency/currency.module';
import { CustomerOrderEntity } from 'src/modules/customer-order/entities/customer-order.entity';
import { FirmEntity } from 'src/modules/firm/entities/firm.entity';
import { ArticleInvoiceEntryEntity } from 'src/modules/invoice/entities/article-invoice-entry.entity';
import { InvoiceEntity } from 'src/modules/invoice/entities/invoice.entity';
import { PaymentEntity } from 'src/modules/payment/entities/payment.entity';
import { QuotationEntity } from 'src/modules/quotation/entities/quotation.entity';
import { TaxWithholdingEntity } from 'src/modules/tax-withholding/entities/tax-withholding.entity';
import { TreasuryMovementEntity } from 'src/modules/treasury-movement/entities/treasury-movement.entity';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardExtendedService } from './dashboard-extended.service';

@Module({
  controllers: [],
  providers: [DashboardService, DashboardExtendedService],
  exports: [DashboardService, DashboardExtendedService],
  imports: [
    TypeOrmModule.forFeature([
      InvoiceEntity,
      ArticleInvoiceEntryEntity,
      PaymentEntity,
      FirmEntity,
      ArticleEntity,
      QuotationEntity,
      CustomerOrderEntity,
      TreasuryMovementEntity,
      BankAccountEntity,
      TaxWithholdingEntity,
    ]),
    CabinetModule,
    CurrencyModule,
    TenantContextModule,
  ],
})
export class DashboardModule {}

export { DashboardController };
