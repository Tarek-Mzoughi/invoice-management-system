import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnNoteService } from './services/return-note.service';
import { CurrencyModule } from '../currency/currency.module';
import { FirmModule } from '../firm/firm.module';
import { InterlocutorModule } from '../interlocutor/Interlocutor.module';
import { ArticleReturnNoteEntryService } from './services/article-return-note-entry.service';
import { ArticleReturnNoteEntryTaxService } from './services/article-return-note-entry-tax.service';
import { TaxModule } from '../tax/tax.module';
import { ArticleModule } from '../article/article.module';
import { DocumentTemplateModule } from '../document-template/document-template.module';
import { CalculationsModule } from 'src/shared/calculations/calculations.module';
import { AppConfigModule } from 'src/shared/app-config/app-config.module';
import { ReturnNoteSequenceService } from './services/return-note-sequence.service';
import { GatewaysModule } from 'src/shared/gateways/gateways.module';
import { ReturnNoteMetaDataService } from './services/return-note-meta-data.service';
import { BankAccountModule } from '../bank-account/bank-account.module';
import { ReturnNoteStorageService } from './services/return-note-upload.service';
import { InvoiceModule } from '../invoice/invoice.module';
import { DeliveryNoteModule } from '../delivery-note/delivery-note.module';
import { GoodsIssueNoteModule } from '../goods-issue-note/goods-issue-note.module';
import { ReturnNoteEntity } from './entities/return-note.entity';
import { ReturnNoteMetaDataEntity } from './entities/return-note-meta-data.entity';
import { ArticleReturnNoteEntryEntity } from './entities/article-return-note-entry.entity';
import { ArticleReturnNoteEntryTaxEntity } from './entities/article-return-note-entry-tax.entity';
import { ReturnNoteStorageEntity } from './entities/return-note-file.entity';
import { ReturnNoteRepository } from './repositories/return-note.repository';
import { ReturnNoteMetaDataRepository } from './repositories/return-note-meta-data-repository';
import { ArticleReturnNoteEntryRepository } from './repositories/article-return-note-entry.repository';
import { ArticleReturnNoteEntryTaxRepository } from './repositories/article-return-note-entry-tax.repository';
import { ReturnNoteUploadRepository } from './repositories/return-note-upload.repository';
import { StorageModule } from 'src/shared/storage/storage.module';
import { SequenceModule } from '../sequence/sequence.module';
import { ReturnNoteController } from './controllers/return-note.controller';
import { LoggerModule } from 'src/shared/logger/logger.module';

import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';
import { MailModule } from 'src/shared/mail/mail.module';

@Module({
  controllers: [ReturnNoteController],
  providers: [
    // Repositories
    ReturnNoteRepository,
    ReturnNoteMetaDataRepository,
    ArticleReturnNoteEntryRepository,
    ArticleReturnNoteEntryTaxRepository,
    ReturnNoteUploadRepository,
    // Services
    ReturnNoteService,
    ReturnNoteMetaDataService,
    ReturnNoteStorageService,
    ReturnNoteSequenceService,
    ArticleReturnNoteEntryService,
    ArticleReturnNoteEntryTaxService,
  ],
  exports: [ReturnNoteRepository, ReturnNoteService],
  imports: [
    // TypeORM Entities
    TypeOrmModule.forFeature([
      ReturnNoteEntity,
      ReturnNoteMetaDataEntity,
      ArticleReturnNoteEntryEntity,
      ArticleReturnNoteEntryTaxEntity,
      ReturnNoteStorageEntity,
    ]),
    ArticleModule,
    AppConfigModule,
    BankAccountModule,
    CurrencyModule,
    FirmModule,
    InterlocutorModule,
    forwardRef(() => InvoiceModule),
    forwardRef(() => DeliveryNoteModule),
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
export class ReturnNoteModule {}
