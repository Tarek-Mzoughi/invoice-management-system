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
import { CreditNoteService } from './services/credit-note.service';
import { CreditNoteController } from './controllers/credit-note.controller';
import { InvoiceModule } from '../invoice/invoice.module';
import { ReturnNoteModule } from '../return-note/return-note.module';
import { CreditNoteMetaDataService } from './services/credit-note-meta-data.service';
import { CreditNoteStorageService } from './services/credit-note-upload.service';
import { CreditNoteSequenceService } from './services/credit-note-sequence.service';
import { ArticleCreditNoteEntryService } from './services/article-credit-note-entry.service';
import { ArticleCreditNoteEntryTaxService } from './services/article-credit-note-entry-tax.service';
import { TaxWithholdingModule } from '../tax-withholding/tax-withholding.module';
import { CreditNoteRepository } from './repositories/credit-note.repository';
import { CreditNoteMetaDataRepository } from './repositories/credit-note-meta-data.repository';
import { CreditNoteUploadRepository } from './repositories/credit-note-upload.repository';
import { ArticleCreditNoteEntryRepository } from './repositories/article-credit-note-entry.repository';
import { ArticleCreditNoteEntryTaxRepository } from './repositories/article-credit-note-entry-tax.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditNoteEntity } from './entities/credit-note.entity';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { ArticleCreditNoteEntryTaxEntity } from './entities/article-credit-note-entry-tax.entity';
import { ArticleCreditNoteEntryEntity } from './entities/article-credit-note-entry.entity';
import { CreditNoteStorageEntity } from './entities/credit-note-file.entity';
import { CreditNoteMetaDataEntity } from './entities/credit-note-meta-data.entity';
import { SequenceModule } from '../sequence/sequence.module';
import { StorageModule } from 'src/shared/storage/storage.module';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';
import { MailModule } from 'src/shared/mail/mail.module';

@Module({
  controllers: [CreditNoteController],
  providers: [
    CreditNoteRepository,
    CreditNoteMetaDataRepository,
    CreditNoteUploadRepository,
    ArticleCreditNoteEntryRepository,
    ArticleCreditNoteEntryTaxRepository,

    CreditNoteService,
    CreditNoteMetaDataService,
    CreditNoteStorageService,
    CreditNoteSequenceService,
    ArticleCreditNoteEntryService,
    ArticleCreditNoteEntryTaxService,
  ],
  exports: [
    CreditNoteRepository,
    CreditNoteMetaDataRepository,
    CreditNoteUploadRepository,
    ArticleCreditNoteEntryRepository,
    ArticleCreditNoteEntryTaxRepository,
    CreditNoteService,
  ],
  imports: [
    TypeOrmModule.forFeature([
      CreditNoteEntity,
      ArticleCreditNoteEntryTaxEntity,
      ArticleCreditNoteEntryEntity,
      CreditNoteStorageEntity,
      CreditNoteMetaDataEntity,
    ]),

    //entities
    ArticleModule,
    AppConfigModule,
    BankAccountModule,
    CurrencyModule,
    FirmModule,
    InterlocutorModule,
    forwardRef(() => InvoiceModule),
    forwardRef(() => ReturnNoteModule),
    SequenceModule,
    TaxModule,
    TaxWithholdingModule,
    //abstract modules
    forwardRef(() => DocumentTemplateModule),
    GatewaysModule,
    CalculationsModule,
    StorageModule,
    LoggerModule,
    TenantContextModule,
    MailModule,
  ],
})
export class CreditNoteModule {}
