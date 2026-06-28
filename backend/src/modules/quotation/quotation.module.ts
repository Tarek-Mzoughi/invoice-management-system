import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotationService } from './services/quotation.service';
import { CurrencyModule } from '../currency/currency.module';
import { FirmModule } from '../firm/firm.module';
import { InterlocutorModule } from '../interlocutor/Interlocutor.module';
import { ArticleQuotationEntryService } from './services/article-quotation-entry.service';
import { ArticleQuotationEntryTaxService } from './services/article-quotation-entry-tax.service';
import { TaxModule } from '../tax/tax.module';
import { ArticleModule } from '../article/article.module';
import { DocumentTemplateModule } from '../document-template/document-template.module';
import { CalculationsModule } from 'src/shared/calculations/calculations.module';
import { AppConfigModule } from 'src/shared/app-config/app-config.module';
import { QuotationSequenceService } from './services/quotation-sequence.service';
import { GatewaysModule } from 'src/shared/gateways/gateways.module';
import { QuotationMetaDataService } from './services/quotation-meta-data.service';
import { BankAccountModule } from '../bank-account/bank-account.module';
import { QuotationStorageService } from './services/quotation-upload.service';
import { InvoiceModule } from '../invoice/invoice.module';
import { QuotationEntity } from './entities/quotation.entity';
import { QuotationMetaDataEntity } from './entities/quotation-meta-data.entity';
import { ArticleQuotationEntryEntity } from './entities/article-quotation-entry.entity';
import { ArticleQuotationEntryTaxEntity } from './entities/article-quotation-entry-tax.entity';
import { QuotationStorageEntity } from './entities/quotation-file.entity';
import { QuotationRepository } from './repositories/quotation.repository';
import { QuotationMetaDataRepository } from './repositories/quotation-meta-data-repository';
import { ArticleQuotationEntryRepository } from './repositories/article-quotation-entry.repository';
import { ArticleQuotationEntryTaxRepository } from './repositories/article-quotation-entry-tax.repository';
import { QuotationUploadRepository } from './repositories/quotation-upload.repository';
import { StorageModule } from 'src/shared/storage/storage.module';
import { SequenceModule } from '../sequence/sequence.module';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';
import { MailModule } from 'src/shared/mail/mail.module';

@Module({
  controllers: [],
  providers: [
    // Repositories
    QuotationRepository,
    QuotationMetaDataRepository,
    ArticleQuotationEntryRepository,
    ArticleQuotationEntryTaxRepository,
    QuotationUploadRepository,
    // Services
    QuotationService,
    QuotationMetaDataService,
    QuotationStorageService,
    QuotationSequenceService,
    ArticleQuotationEntryService,
    ArticleQuotationEntryTaxService,
  ],
  exports: [QuotationRepository, QuotationService],
  imports: [
    // TypeORM Entities
    TypeOrmModule.forFeature([
      QuotationEntity,
      QuotationMetaDataEntity,
      ArticleQuotationEntryEntity,
      ArticleQuotationEntryTaxEntity,
      QuotationStorageEntity,
    ]),
    ArticleModule,
    AppConfigModule,
    BankAccountModule,
    CurrencyModule,
    FirmModule,
    InterlocutorModule,
    forwardRef(() => InvoiceModule),
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
export class QuotationModule {}
