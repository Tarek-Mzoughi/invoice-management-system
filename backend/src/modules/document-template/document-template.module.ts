import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceModule } from '../invoice/invoice.module';
import { QuotationModule } from '../quotation/quotation.module';
import { DeliveryNoteModule } from '../delivery-note/delivery-note.module';
import { CustomerOrderModule } from '../customer-order/customer-order.module';
import { GoodsIssueNoteModule } from '../goods-issue-note/goods-issue-note.module';
import { CreditNoteModule } from '../credit-note/credit-note.module';
import { ReturnNoteModule } from '../return-note/return-note.module';
import { PaymentEntity } from '../payment/entities/payment.entity';
import { StorageModule } from 'src/shared/storage/storage.module';
import { DocumentTemplateAssetEntity } from './entities/document-template-asset.entity';
import { DocumentTemplateCategoryEntity } from './entities/document-template-category.entity';
import { DocumentTemplateVersionEntity } from './entities/document-template-version.entity';
import { DocumentTemplateEntity } from './entities/document-template.entity';
import { GeneratedDocumentEntity } from './entities/generated-document.entity';
import { TemplateEngineService } from './interfaces/template-engine.interface';
import { DocumentTemplateAssetRepository } from './repositories/document-template-asset.repository';
import { DocumentTemplateCategoryRepository } from './repositories/document-template-category.repository';
import { DocumentTemplateVersionRepository } from './repositories/document-template-version.repository';
import { DocumentTemplateRepository } from './repositories/document-template.repository';
import { GeneratedDocumentRepository } from './repositories/generated-document.repository';
import { DeliveryNoteTemplateDataMapper } from './services/data-mappers/delivery-note-template-data.mapper';
import { InvoiceTemplateDataMapper } from './services/data-mappers/invoice-template-data.mapper';
import { PaymentReceiptTemplateDataMapper } from './services/data-mappers/payment-receipt-template-data.mapper';
import { QuoteTemplateDataMapper } from './services/data-mappers/quote-template-data.mapper';
import { CustomerOrderTemplateDataMapper } from './services/data-mappers/customer-order-template-data.mapper';
import { GoodsIssueNoteTemplateDataMapper } from './services/data-mappers/goods-issue-note-template-data.mapper';
import { CreditNoteTemplateDataMapper } from './services/data-mappers/credit-note-template-data.mapper';
import { ReturnNoteTemplateDataMapper } from './services/data-mappers/return-note-template-data.mapper';
import { TemplateDataMapperRegistry } from './services/data-mappers/template-data-mapper.registry';
import { DocumentTemplateRendererService } from './services/document-template-renderer.service';
import { DocumentTemplateVersionService } from './services/document-template-version.service';
import { DocumentTemplateService } from './services/document-template.service';
import { PdfmeTemplateEngineService } from './services/engines/pdfme-template-engine.service';
import { GeneratedDocumentService } from './services/generated-document.service';
import { TemplateAssetService } from './services/template-asset.service';
import { TemplateImageResolverService } from './services/template-image-resolver.service';
import { TemplateSchemaValidatorService } from './services/template-schema-validator.service';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';

@Module({
  controllers: [],
  providers: [
    DocumentTemplateRepository,
    DocumentTemplateVersionRepository,
    DocumentTemplateAssetRepository,
    DocumentTemplateCategoryRepository,
    GeneratedDocumentRepository,
    TemplateSchemaValidatorService,
    {
      provide: TemplateEngineService,
      useClass: PdfmeTemplateEngineService,
    },
    InvoiceTemplateDataMapper,
    QuoteTemplateDataMapper,
    DeliveryNoteTemplateDataMapper,
    PaymentReceiptTemplateDataMapper,
    CustomerOrderTemplateDataMapper,
    GoodsIssueNoteTemplateDataMapper,
    CreditNoteTemplateDataMapper,
    ReturnNoteTemplateDataMapper,
    TemplateDataMapperRegistry,
    DocumentTemplateService,
    DocumentTemplateVersionService,
    DocumentTemplateRendererService,
    TemplateImageResolverService,
    TemplateAssetService,
    GeneratedDocumentService,
  ],
  imports: [
    StorageModule,
    forwardRef(() => InvoiceModule),
    forwardRef(() => QuotationModule),
    forwardRef(() => DeliveryNoteModule),
    forwardRef(() => CustomerOrderModule),
    forwardRef(() => GoodsIssueNoteModule),
    forwardRef(() => CreditNoteModule),
    forwardRef(() => ReturnNoteModule),
    TenantContextModule,
    TypeOrmModule.forFeature([
      DocumentTemplateEntity,
      DocumentTemplateVersionEntity,
      DocumentTemplateAssetEntity,
      DocumentTemplateCategoryEntity,
      GeneratedDocumentEntity,
      PaymentEntity,
    ]),
  ],
  exports: [
    DocumentTemplateService,
    DocumentTemplateVersionService,
    DocumentTemplateRendererService,
    TemplateAssetService,
    TemplateImageResolverService,
    TemplateEngineService,
    PaymentReceiptTemplateDataMapper,
  ],
})
export class DocumentTemplateModule {}
