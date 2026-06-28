import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryNoteService } from './services/delivery-note.service';
import { CurrencyModule } from '../currency/currency.module';
import { FirmModule } from '../firm/firm.module';
import { InterlocutorModule } from '../interlocutor/Interlocutor.module';
import { ArticleDeliveryNoteEntryService } from './services/article-delivery-note-entry.service';
import { ArticleDeliveryNoteEntryTaxService } from './services/article-delivery-note-entry-tax.service';
import { TaxModule } from '../tax/tax.module';
import { ArticleModule } from '../article/article.module';
import { DocumentTemplateModule } from '../document-template/document-template.module';
import { CalculationsModule } from 'src/shared/calculations/calculations.module';
import { AppConfigModule } from 'src/shared/app-config/app-config.module';
import { DeliveryNoteSequenceService } from './services/delivery-note-sequence.service';
import { GatewaysModule } from 'src/shared/gateways/gateways.module';
import { DeliveryNoteMetaDataService } from './services/delivery-note-meta-data.service';
import { BankAccountModule } from '../bank-account/bank-account.module';
import { DeliveryNoteStorageService } from './services/delivery-note-upload.service';
import { InvoiceModule } from '../invoice/invoice.module';
import { QuotationModule } from '../quotation/quotation.module';
import { CustomerOrderModule } from '../customer-order/customer-order.module';
import { GoodsIssueNoteModule } from '../goods-issue-note/goods-issue-note.module';
import { DeliveryNoteEntity } from './entities/delivery-note.entity';
import { DeliveryNoteMetaDataEntity } from './entities/delivery-note-meta-data.entity';
import { ArticleDeliveryNoteEntryEntity } from './entities/article-delivery-note-entry.entity';
import { ArticleDeliveryNoteEntryTaxEntity } from './entities/article-delivery-note-entry-tax.entity';
import { DeliveryNoteStorageEntity } from './entities/delivery-note-file.entity';
import { DeliveryNoteRepository } from './repositories/delivery-note.repository';
import { DeliveryNoteMetaDataRepository } from './repositories/delivery-note-meta-data-repository';
import { ArticleDeliveryNoteEntryRepository } from './repositories/article-delivery-note-entry.repository';
import { ArticleDeliveryNoteEntryTaxRepository } from './repositories/article-delivery-note-entry-tax.repository';
import { DeliveryNoteUploadRepository } from './repositories/delivery-note-upload.repository';
import { StorageModule } from 'src/shared/storage/storage.module';
import { SequenceModule } from '../sequence/sequence.module';
import { DeliveryNoteController } from './controllers/delivery-note.controller';
import { DeliveryNoteLifecycleService } from './services/delivery-note-lifecycle.service';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';
import { MailModule } from 'src/shared/mail/mail.module';

@Module({
  controllers: [DeliveryNoteController],
  providers: [
    // Repositories
    DeliveryNoteRepository,
    DeliveryNoteMetaDataRepository,
    ArticleDeliveryNoteEntryRepository,
    ArticleDeliveryNoteEntryTaxRepository,
    DeliveryNoteUploadRepository,
    // Services
    DeliveryNoteService,
    DeliveryNoteMetaDataService,
    DeliveryNoteStorageService,
    DeliveryNoteSequenceService,
    ArticleDeliveryNoteEntryService,
    ArticleDeliveryNoteEntryTaxService,
    DeliveryNoteLifecycleService,
  ],
  exports: [
    DeliveryNoteRepository,
    DeliveryNoteService,
    DeliveryNoteLifecycleService,
  ],
  imports: [
    // TypeORM Entities
    TypeOrmModule.forFeature([
      DeliveryNoteEntity,
      DeliveryNoteMetaDataEntity,
      ArticleDeliveryNoteEntryEntity,
      ArticleDeliveryNoteEntryTaxEntity,
      DeliveryNoteStorageEntity,
    ]),
    ArticleModule,
    AppConfigModule,
    BankAccountModule,
    CurrencyModule,
    FirmModule,
    InterlocutorModule,
    forwardRef(() => InvoiceModule),
    forwardRef(() => QuotationModule),
    forwardRef(() => CustomerOrderModule),
    forwardRef(() => GoodsIssueNoteModule),
    TaxModule,
    forwardRef(() => DocumentTemplateModule),
    GatewaysModule,
    CalculationsModule,
    StorageModule,
    SequenceModule,
    LoggerModule,
    TenantContextModule,
    MailModule,
  ],
})
export class DeliveryNoteModule {}
