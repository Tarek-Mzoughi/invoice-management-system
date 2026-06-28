import { Article } from './article';
import { BankAccount } from './bank-account';
import { Cabinet } from './cabinet';
import { Currency } from './currency';
import { DISCOUNT_TYPE } from './enums/discount-types';
import { Firm } from './firm';
import { Interlocutor } from './interlocutor';
import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';
import { Tax } from './tax';
import { Upload } from './upload';
import { ACTIVITY_TYPE } from './enums/activity-type';
import { Payment } from './payment';

export enum CREDIT_NOTE_STATUS {
  Nonexistent = 'creditNote.status.non_existent',
  Draft = 'creditNote.status.draft',
  Sent = 'creditNote.status.sent',
  Validated = 'creditNote.status.validated',
  Paid = 'creditNote.status.paid',
  PartiallyPaid = 'creditNote.status.partially_paid',
  Unpaid = 'creditNote.status.unpaid',
  Expired = 'creditNote.status.expired'
}

export interface CreditNoteLinkedDocument extends DatabaseEntity {
  id?: number;
  sequential?: string;
  reference?: string;
  date?: string;
  status?: string;
}

export interface CreditNoteTaxEntry extends DatabaseEntity {
  id?: number;
  articleCreditNoteEntryId?: number;
  tax?: Tax;
  taxId?: number;
}

export interface ArticleCreditNoteEntry extends DatabaseEntity {
  id?: number;
  creditNoteId?: number;
  article?: Article;
  articleId?: number;
  unit_price?: number;
  quantity?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  articleCreditNoteEntryTaxes?: CreditNoteTaxEntry[];
  subTotal?: number;
  total?: number;
}

export interface CreateArticleCreditNoteEntry
  extends Omit<
    ArticleCreditNoteEntry,
    | 'id'
    | 'creditNoteId'
    | 'subTotal'
    | 'total'
    | 'updatedAt'
    | 'createdAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
    | 'articleCreditNoteEntryTaxes'
  > {
  taxes?: number[];
}

export interface CreditNoteMetaData extends DatabaseEntity {
  id?: number;
  showInvoiceAddress?: boolean;
  showCreditNoteAddress?: boolean;
  showDeliveryAddress?: boolean;
  showArticleDescription?: boolean;
  showPrices?: boolean;
  hasBankingDetails?: boolean;
  hasGeneralConditions?: boolean;
  hasTaxWithholding?: boolean;
  hasTaxStamp?: boolean;
  vehicleRegistration?: string;
  driverName?: string;
  taxSummary?: { taxId: number; amount: number }[];
}

export interface CreditNoteUpload extends DatabaseEntity {
  id?: number;
  creditNoteId?: number;
  creditNote?: CreditNote;
  uploadId?: number;
  upload?: Upload;
}

export interface PaymentCreditNoteEntry extends DatabaseEntity {
  id?: number;
  paymentId?: number;
  payment?: Payment;
  creditNoteId?: number;
  creditNote?: CreditNote;
  amount?: number;
  originalCurrencyId?: number;
  originalCurrency?: Currency;
  exchangeRateToPaymentCurrency?: number;
  convertedAmount?: number;
  convertedCurrencyId?: number;
  convertedCurrency?: Currency;
}

export interface CreditNote extends DatabaseEntity {
  id?: number;
  activityType?: ACTIVITY_TYPE;
  sequential?: string;
  sourceInvoiceId?: number | null;
  sourceInvoice?: CreditNoteLinkedDocument | null;
  sourceReturnNoteId?: number | null;
  sourceReturnNote?: CreditNoteLinkedDocument | null;
  reference?: string;
  object?: string;
  date?: string;
  dueDate?: string;
  status?: CREDIT_NOTE_STATUS;
  generalConditions?: string;
  defaultCondition?: boolean;
  total?: number;
  amountPaid?: number;
  subTotal?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  currencyId?: number | null;
  currency?: Currency;
  bankAccountId?: number | null;
  bankAccount?: BankAccount;
  firmId?: number;
  firm?: Firm;
  cabinet?: Cabinet;
  cabinetId?: number;
  interlocutorId?: number;
  interlocutor?: Interlocutor;
  notes?: string;
  articleCreditNoteEntries?: ArticleCreditNoteEntry[];
  creditNoteMetaData?: CreditNoteMetaData;
  uploads?: CreditNoteUpload[];
  payments?: PaymentCreditNoteEntry[];
  quotationId?: number | null;
  quotation?: CreditNoteLinkedDocument | null;
  deliveryNoteId?: number | null;
  deliveryNote?: CreditNoteLinkedDocument | null;
  goodsIssueNoteId?: number | null;
  goodsIssueNote?: CreditNoteLinkedDocument | null;
  taxStampId?: number | null;
  taxWithholdingId?: number | null;
  taxWithholdingAmount?: number;
}

export interface CreateCreditNoteDto
  extends Omit<
    CreditNote,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
    | 'articles'
    | 'firm'
    | 'interlocutor'
    | 'sequential'
    | 'bankAccount'
    | 'invoices'
  > {
  articleCreditNoteEntries?: CreateArticleCreditNoteEntry[];
  files?: File[];
}

export interface UpdateCreditNoteDto extends CreateCreditNoteDto {
  id?: number;
  createInvoice?: boolean;
}

export interface UpdateCreditNoteSequentialNumber {
  id?: number;
  sequential?: string;
}

export interface DuplicateCreditNoteDto {
  id?: number;
  includeFiles?: boolean;
}

export interface PagedCreditNote extends PagedResponse<CreditNote> {}

export interface CreditNoteUploadedFile {
  upload: CreditNoteUpload;
  file: File;
}
