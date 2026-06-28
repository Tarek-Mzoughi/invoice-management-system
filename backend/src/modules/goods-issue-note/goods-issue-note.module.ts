import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoodsIssueNoteService } from './services/goods-issue-note.service';
import { CurrencyModule } from '../currency/currency.module';
import { FirmModule } from '../firm/firm.module';
import { InterlocutorModule } from '../interlocutor/Interlocutor.module';
import { ArticleGoodsIssueNoteEntryService } from './services/article-goods-issue-note-entry.service';
import { ArticleGoodsIssueNoteEntryTaxService } from './services/article-goods-issue-note-entry-tax.service';
import { TaxModule } from '../tax/tax.module';
import { ArticleModule } from '../article/article.module';
import { DocumentTemplateModule } from '../document-template/document-template.module';
import { CalculationsModule } from 'src/shared/calculations/calculations.module';
import { AppConfigModule } from 'src/shared/app-config/app-config.module';
import { GoodsIssueNoteSequenceService } from './services/goods-issue-note-sequence.service';
import { GatewaysModule } from 'src/shared/gateways/gateways.module';
import { GoodsIssueNoteMetaDataService } from './services/goods-issue-note-meta-data.service';
import { BankAccountModule } from '../bank-account/bank-account.module';
import { GoodsIssueNoteStorageService } from './services/goods-issue-note-upload.service';
import { InvoiceModule } from '../invoice/invoice.module';
import { QuotationModule } from '../quotation/quotation.module';
import { GoodsIssueNoteEntity } from './entities/goods-issue-note.entity';
import { GoodsIssueNoteMetaDataEntity } from './entities/goods-issue-note-meta-data.entity';
import { ArticleGoodsIssueNoteEntryEntity } from './entities/article-goods-issue-note-entry.entity';
import { ArticleGoodsIssueNoteEntryTaxEntity } from './entities/article-goods-issue-note-entry-tax.entity';
import { GoodsIssueNoteStorageEntity } from './entities/goods-issue-note-file.entity';
import { GoodsIssueNoteRepository } from './repositories/goods-issue-note.repository';
import { GoodsIssueNoteMetaDataRepository } from './repositories/goods-issue-note-meta-data-repository';
import { ArticleGoodsIssueNoteEntryRepository } from './repositories/article-goods-issue-note-entry.repository';
import { ArticleGoodsIssueNoteEntryTaxRepository } from './repositories/article-goods-issue-note-entry-tax.repository';
import { GoodsIssueNoteUploadRepository } from './repositories/goods-issue-note-upload.repository';
import { StorageModule } from 'src/shared/storage/storage.module';
import { SequenceModule } from '../sequence/sequence.module';
import { GoodsIssueNoteController } from './controllers/goods-issue-note.controller';
import { LoggerModule } from 'src/shared/logger/logger.module';

import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';
import { MailModule } from 'src/shared/mail/mail.module';

@Module({
  controllers: [GoodsIssueNoteController],
  providers: [
    // Repositories
    GoodsIssueNoteRepository,
    GoodsIssueNoteMetaDataRepository,
    ArticleGoodsIssueNoteEntryRepository,
    ArticleGoodsIssueNoteEntryTaxRepository,
    GoodsIssueNoteUploadRepository,
    // Services
    GoodsIssueNoteService,
    GoodsIssueNoteMetaDataService,
    GoodsIssueNoteStorageService,
    GoodsIssueNoteSequenceService,
    ArticleGoodsIssueNoteEntryService,
    ArticleGoodsIssueNoteEntryTaxService,
  ],
  exports: [GoodsIssueNoteRepository, GoodsIssueNoteService],
  imports: [
    // TypeORM Entities
    TypeOrmModule.forFeature([
      GoodsIssueNoteEntity,
      GoodsIssueNoteMetaDataEntity,
      ArticleGoodsIssueNoteEntryEntity,
      ArticleGoodsIssueNoteEntryTaxEntity,
      GoodsIssueNoteStorageEntity,
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
    LoggerModule,
    TenantContextModule,
    MailModule,
  ],
})
export class GoodsIssueNoteModule {}
