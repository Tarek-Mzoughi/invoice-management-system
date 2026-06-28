import { forwardRef, Module } from '@nestjs/common';
import { CurrencyModule } from '../currency/currency.module';
import { FirmModule } from '../firm/firm.module';
import { InterlocutorModule } from '../interlocutor/Interlocutor.module';
import { TaxModule } from '../tax/tax.module';
import { ArticleModule } from '../article/article.module';
import { DocumentTemplateModule } from '../document-template/document-template.module';
import { CalculationsModule } from 'src/shared/calculations/calculations.module';
import { AppConfigModule } from 'src/shared/app-config/app-config.module';
import { GatewaysModule } from 'src/shared/gateways/gateways.module';
import { BankAccountModule } from '../bank-account/bank-account.module';
import { InvoiceService } from './services/invoice.service';
import { InvoiceMetaDataService } from './services/invoice-meta-data.service';
import { InvoiceStorageService } from './services/invoice-upload.service';
import { InvoiceSequenceService } from './services/invoice-sequence.service';
import { ArticleInvoiceEntryService } from './services/article-invoice-entry.service';
import { ArticleInvoiceEntryTaxService } from './services/article-invoice-entry-tax.service';
import { TaxWithholdingModule } from '../tax-withholding/tax-withholding.module';
import { InvoiceRepository } from './repositories/invoice.repository';
import { InvoiceMetaDataRepository } from './repositories/invoice-meta-data.repository';
import { InvoiceUploadRepository } from './repositories/invoice-upload.repository';
import { ArticleInvoiceEntryRepository } from './repositories/article-invoice-entry.repository';
import { ArticleInvoiceEntryTaxRepository } from './repositories/article-invoice-entry-tax.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceEntity } from './entities/invoice.entity';
import { ArticleInvoiceEntryTaxEntity } from './entities/article-invoice-entry-tax.entity';
import { ArticleInvoiceEntryEntity } from './entities/article-invoice-entry.entity';
import { InvoiceStorageEntity } from './entities/invoice-file.entity';
import { InvoiceMetaDataEntity } from './entities/invoice-meta-data.entity';
import { SequenceModule } from '../sequence/sequence.module';
import { StorageModule } from 'src/shared/storage/storage.module';
import { QuotationModule } from '../quotation/quotation.module';
import { CustomerOrderModule } from '../customer-order/customer-order.module';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';
import { MailModule } from 'src/shared/mail/mail.module';

@Module({
  controllers: [],
  providers: [
    InvoiceRepository,
    InvoiceMetaDataRepository,
    InvoiceUploadRepository,
    ArticleInvoiceEntryRepository,
    ArticleInvoiceEntryTaxRepository,

    InvoiceService,
    InvoiceMetaDataService,
    InvoiceStorageService,
    InvoiceSequenceService,
    ArticleInvoiceEntryService,
    ArticleInvoiceEntryTaxService,
  ],
  exports: [
    InvoiceRepository,
    InvoiceMetaDataRepository,
    InvoiceUploadRepository,
    ArticleInvoiceEntryRepository,
    ArticleInvoiceEntryTaxRepository,
    InvoiceService,
  ],
  imports: [
    TypeOrmModule.forFeature([
      InvoiceEntity,
      ArticleInvoiceEntryTaxEntity,
      ArticleInvoiceEntryEntity,
      InvoiceStorageEntity,
      InvoiceMetaDataEntity,
    ]),

    //entities
    ArticleModule,
    AppConfigModule,
    BankAccountModule,
    CurrencyModule,
    FirmModule,
    InterlocutorModule,
    SequenceModule,
    forwardRef(() => CustomerOrderModule),
    forwardRef(() => QuotationModule),
    TaxModule,
    TaxWithholdingModule,
    //abstract modules
    forwardRef(() => DocumentTemplateModule),
    GatewaysModule,
    CalculationsModule,
    StorageModule,
    TenantContextModule,
    MailModule,
  ],
})
export class InvoiceModule {}
