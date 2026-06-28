import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerOrderService } from './services/customer-order.service';
import { CurrencyModule } from '../currency/currency.module';
import { FirmModule } from '../firm/firm.module';
import { InterlocutorModule } from '../interlocutor/Interlocutor.module';
import { ArticleCustomerOrderEntryService } from './services/article-customer-order-entry.service';
import { ArticleCustomerOrderEntryTaxService } from './services/article-customer-order-entry-tax.service';
import { TaxModule } from '../tax/tax.module';
import { ArticleModule } from '../article/article.module';
import { DocumentTemplateModule } from '../document-template/document-template.module';
import { CalculationsModule } from 'src/shared/calculations/calculations.module';
import { AppConfigModule } from 'src/shared/app-config/app-config.module';
import { CustomerOrderSequenceService } from './services/customer-order-sequence.service';
import { GatewaysModule } from 'src/shared/gateways/gateways.module';
import { CustomerOrderMetaDataService } from './services/customer-order-meta-data.service';
import { BankAccountModule } from '../bank-account/bank-account.module';
import { CustomerOrderStorageService } from './services/customer-order-upload.service';
import { InvoiceModule } from '../invoice/invoice.module';
import { QuotationModule } from '../quotation/quotation.module';

import { CustomerOrderEntity } from './entities/customer-order.entity';
import { CustomerOrderMetaDataEntity } from './entities/customer-order-meta-data.entity';
import { ArticleCustomerOrderEntryEntity } from './entities/article-customer-order-entry.entity';
import { ArticleCustomerOrderEntryTaxEntity } from './entities/article-customer-order-entry-tax.entity';
import { CustomerOrderStorageEntity } from './entities/customer-order-file.entity';
import { CustomerOrderRepository } from './repositories/customer-order.repository';
import { CustomerOrderMetaDataRepository } from './repositories/customer-order-meta-data-repository';
import { ArticleCustomerOrderEntryRepository } from './repositories/article-customer-order-entry.repository';
import { ArticleCustomerOrderEntryTaxRepository } from './repositories/article-customer-order-entry-tax.repository';
import { CustomerOrderUploadRepository } from './repositories/customer-order-upload.repository';
import { StorageModule } from 'src/shared/storage/storage.module';
import { SequenceModule } from '../sequence/sequence.module';
import { CustomerOrderLifecycleService } from './services/customer-order-lifecycle.service';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';
import { MailModule } from 'src/shared/mail/mail.module';

@Module({
  controllers: [],
  providers: [
    // Repositories
    CustomerOrderRepository,
    CustomerOrderMetaDataRepository,
    ArticleCustomerOrderEntryRepository,
    ArticleCustomerOrderEntryTaxRepository,
    CustomerOrderUploadRepository,
    // Services
    CustomerOrderService,
    CustomerOrderMetaDataService,
    CustomerOrderStorageService,
    CustomerOrderSequenceService,
    ArticleCustomerOrderEntryService,
    ArticleCustomerOrderEntryTaxService,
    CustomerOrderLifecycleService,
  ],
  exports: [
    CustomerOrderRepository,
    CustomerOrderService,
    CustomerOrderLifecycleService,
  ],
  imports: [
    // TypeORM Entities
    TypeOrmModule.forFeature([
      CustomerOrderEntity,
      CustomerOrderMetaDataEntity,
      ArticleCustomerOrderEntryEntity,
      ArticleCustomerOrderEntryTaxEntity,
      CustomerOrderStorageEntity,
    ]),
    ArticleModule,
    AppConfigModule,
    BankAccountModule,
    CurrencyModule,
    FirmModule,
    InterlocutorModule,
    forwardRef(() => InvoiceModule),
    forwardRef(() => QuotationModule),
    TaxModule,
    forwardRef(() => DocumentTemplateModule),
    GatewaysModule,
    CalculationsModule,
    StorageModule,
    SequenceModule,
    TenantContextModule,
    MailModule,
  ],
})
export class CustomerOrderModule {}
