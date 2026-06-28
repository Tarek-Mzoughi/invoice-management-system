import { Module } from '@nestjs/common';
import { PaymentService } from './services/payment.service';
import { PaymentStorageService } from './services/payment-upload.service';
import { PaymentInvoiceEntryService } from './services/payment-invoice-entry.service';
import { InvoiceModule } from '../invoice/invoice.module';
import { CurrencyModule } from '../currency/currency.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentInvoiceEntryEntity } from './entities/payment-invoice-entry.entity';
import { PaymentStorageEntity } from './entities/payment-file.entity';
import { PaymentCreditNoteEntryEntity } from './entities/payment-credit-note-entry.entity';
import { PaymentRepository } from './repositories/payment-file.repository';
import { PaymentInvoiceEntryRepository } from './repositories/payment-invoice-entry.repository';
import { PaymentCreditNoteEntryRepository } from './repositories/payment-credit-note-entry.repository';
import { PaymentUploadRepository } from './repositories/payment.repository';
import { StorageModule } from 'src/shared/storage/storage.module';
import { FirmModule } from '../firm/firm.module';
import { BankAccountModule } from '../bank-account/bank-account.module';
import { TreasuryMovementModule } from '../treasury-movement/treasury-movement.module';
import { CreditNoteModule } from '../credit-note/credit-note.module';
import { TaxWithholdingModule } from '../tax-withholding/tax-withholding.module';
import { PaymentCreditNoteEntryService } from './services/payment-credit-note-entry.service';
import { DocumentTemplateModule } from '../document-template/document-template.module';
import { PaymentReceiptPdfService } from './services/payment-receipt-pdf.service';
import { WithholdingTaxCertificatePdfService } from './services/withholding-tax-certificate-pdf.service';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';

@Module({
  controllers: [],
  providers: [
    PaymentRepository,
    PaymentInvoiceEntryRepository,
    PaymentCreditNoteEntryRepository,
    PaymentUploadRepository,
    PaymentService,
    PaymentStorageService,
    PaymentInvoiceEntryService,
    PaymentCreditNoteEntryService,
    PaymentReceiptPdfService,
    WithholdingTaxCertificatePdfService,
  ],
  exports: [
    PaymentRepository,
    PaymentInvoiceEntryRepository,
    PaymentCreditNoteEntryRepository,
    PaymentUploadRepository,
    PaymentService,
    PaymentCreditNoteEntryService,
    PaymentReceiptPdfService,
    WithholdingTaxCertificatePdfService,
  ],
  imports: [
    TypeOrmModule.forFeature([
      PaymentEntity,
      PaymentInvoiceEntryEntity,
      PaymentCreditNoteEntryEntity,
      PaymentStorageEntity,
    ]),

    CurrencyModule,
    FirmModule,
    InvoiceModule,
    CreditNoteModule,
    BankAccountModule,
    TreasuryMovementModule,
    TaxWithholdingModule,
    DocumentTemplateModule,
    StorageModule,
    TenantContextModule,
  ],
})
export class PaymentModule {}
