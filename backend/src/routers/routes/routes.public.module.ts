import { Module } from '@nestjs/common';
import { AppConfigModule } from 'src/shared/app-config/app-config.module';
import { AppConfigController } from 'src/shared/app-config/controllers/app-config.controller';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { ActivityModule } from 'src/modules/activity/activity.module';
import { ActivityController } from 'src/modules/activity/controllers/activity.controller';
import { AddressModule } from 'src/modules/address/address.module';
import { AddressController } from 'src/modules/address/controllers/address.controller';
import { ArticleModule } from 'src/modules/article/article.module';
import { ArticleController } from 'src/modules/article/controllers/article.controller';
import { BankAccountModule } from 'src/modules/bank-account/bank-account.module';
import { BankAccountController } from 'src/modules/bank-account/controllers/bank-account.controller';
import { CabinetModule } from 'src/modules/cabinet/cabinet.module';
import { CabinetController } from 'src/modules/cabinet/controllers/cabinet.controller';
import { CountryController } from 'src/modules/country/controllers/country.controller';
import { CountryModule } from 'src/modules/country/country.module';
import { CurrencyController } from 'src/modules/currency/controllers/currency.controller';
import { CurrencyModule } from 'src/modules/currency/currency.module';
import { DefaultConditionController } from 'src/modules/default-condition/controllers/default-condition.controller';
import { DefaultConditionModule } from 'src/modules/default-condition/default-condition.module';
import { DocumentTemplateController } from 'src/modules/document-template/controllers/document-template.controller';
import { DocumentTemplateModule } from 'src/modules/document-template/document-template.module';
import { FirmInterlocutorEntryController } from 'src/modules/firm-interlocutor-entry/controllers/firm-interlocutor-entry.controller.ts';
import { FirmInterlocutorEntryModule } from 'src/modules/firm-interlocutor-entry/firm-interlocutor-entry.module';
import { FirmController } from 'src/modules/firm/controllers/firm.controller';
import { FirmModule } from 'src/modules/firm/firm.module';
import { FirmBankAccountController } from 'src/modules/firm-bank-account/controllers/firm-bank-account.controller';
import { FirmBankAccountModule } from 'src/modules/firm-bank-account/firm-bank-account.module';
import { InterlocutorModule } from 'src/modules/interlocutor/Interlocutor.module';
import { InterlocutorController } from 'src/modules/interlocutor/controllers/interlocutor.controller';
import { InvoiceController } from 'src/modules/invoice/controllers/invoice.controller';
import { InvoiceModule } from 'src/modules/invoice/invoice.module';
import { DeliveryNoteController } from 'src/modules/delivery-note/controllers/delivery-note.controller';
import { DeliveryNoteModule } from 'src/modules/delivery-note/delivery-note.module';
import { GoodsIssueNoteController } from 'src/modules/goods-issue-note/controllers/goods-issue-note.controller';
import { GoodsIssueNoteModule } from 'src/modules/goods-issue-note/goods-issue-note.module';
import { PaymentConditionController } from 'src/modules/payment-condition/controllers/payment-condition.controller';
import { PaymentConditionModule } from 'src/modules/payment-condition/payment-condition.module';
import { PaymentController } from 'src/modules/payment/controllers/payment.controller';
import { WithholdingTaxCertificateController } from 'src/modules/payment/controllers/withholding-tax-certificate.controller';
import { PaymentModule } from 'src/modules/payment/payment.module';
import { PriceListController } from 'src/modules/price-list/controllers/price-list.controller';
import { PriceListModule } from 'src/modules/price-list/price-list.module';
import { QuotationController } from 'src/modules/quotation/controllers/quotation.controller';
import { QuotationModule } from 'src/modules/quotation/quotation.module';
import { CustomerOrderController } from 'src/modules/customer-order/controllers/customer-order.controller';
import { CustomerOrderModule } from 'src/modules/customer-order/customer-order.module';
import { CreditNoteController } from 'src/modules/credit-note/controllers/credit-note.controller';
import { CreditNoteModule } from 'src/modules/credit-note/credit-note.module';
import { ReturnNoteController } from 'src/modules/return-note/controllers/return-note.controller';
import { ReturnNoteModule } from 'src/modules/return-note/return-note.module';
import { TaxWithholdingController } from 'src/modules/tax-withholding/controllers/tax-withholding.controller';
import { TaxWithholdingModule } from 'src/modules/tax-withholding/tax-withholding.module';
import { TaxController } from 'src/modules/tax/controllers/tax.controller';
import { TaxModule } from 'src/modules/tax/tax.module';
import { TemplateCategoryController } from 'src/modules/template/controllers/template-category.controller';
import { TemplateModule } from 'src/modules/template/template.module';
import { UserController } from 'src/modules/user-management/controllers/user.controller';
import { RoleController } from 'src/modules/user-management/controllers/role.controller';
import { PermissionController } from 'src/modules/user-management/controllers/permission.controller';
import { UserManagementModule } from 'src/modules/user-management/user-management.module';
import { SequenceController } from 'src/modules/sequence/controllers/sequence.controller';
import { SequenceModule } from 'src/modules/sequence/sequence.module';
import { StorageController } from 'src/shared/storage/controllers/storage.controller';
import { StorageModule } from 'src/shared/storage/storage.module';
import { TreasuryMovementController } from 'src/modules/treasury-movement/controllers/treasury-movement.controller';
import { TreasuryMovementModule } from 'src/modules/treasury-movement/treasury-movement.module';
import { OnboardingController } from 'src/modules/onboarding/controllers/onboarding.controller';
import { OnboardingModule } from 'src/modules/onboarding/onboarding.module';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';
import { AiController } from 'src/modules/ai/controllers/ai.controller';
import { AiModule } from 'src/modules/ai/ai.module';
import { DashboardController } from 'src/modules/dashboard/dashboard.controller';
import { DashboardModule } from 'src/modules/dashboard/dashboard.module';
import { AuthModule } from 'src/shared/auth/auth.module';

@Module({
  controllers: [
    UserController,
    RoleController,
    PermissionController,
    ActivityController,
    AddressController,
    ArticleController,
    AppConfigController,
    BankAccountController,
    CabinetController,
    CountryController,
    CurrencyController,
    DefaultConditionController,
    DocumentTemplateController,
    FirmController,
    FirmBankAccountController,
    FirmInterlocutorEntryController,
    InterlocutorController,
    InvoiceController,
    CustomerOrderController,
    CreditNoteController,
    ReturnNoteController,
    DeliveryNoteController,
    GoodsIssueNoteController,
    PaymentController,
    WithholdingTaxCertificateController,
    PaymentConditionController,
    PriceListController,
    QuotationController,
    SequenceController,
    StorageController,
    TaxController,
    TaxWithholdingController,
    TemplateCategoryController,
    TreasuryMovementController,
    OnboardingController,
    AiController,
    DashboardController,
  ],
  providers: [],
  exports: [],
  imports: [
    LoggerModule,
    ActivityModule,
    AddressModule,
    ArticleModule,
    AppConfigModule,
    BankAccountModule,
    CabinetModule,
    CountryModule,
    CurrencyModule,
    DefaultConditionModule,
    DocumentTemplateModule,
    FirmModule,
    FirmBankAccountModule,
    FirmInterlocutorEntryModule,
    InterlocutorModule,
    InvoiceModule,
    CustomerOrderModule,
    CreditNoteModule,
    ReturnNoteModule,
    DeliveryNoteModule,
    GoodsIssueNoteModule,
    PaymentConditionModule,
    PriceListModule,
    PaymentModule,
    QuotationModule,
    SequenceModule,
    StorageModule,
    TaxModule,
    TaxWithholdingModule,
    TemplateModule,
    TreasuryMovementModule,
    OnboardingModule,
    UserManagementModule,
    TenantContextModule,
    AiModule,
    DashboardModule,
    AuthModule,
  ],
})
export class RoutesPublicModule {}
