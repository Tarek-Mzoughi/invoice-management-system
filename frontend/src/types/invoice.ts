import { Article } from './article';
import { Cabinet } from './cabinet';
import { Currency } from './currency';
import { DISCOUNT_TYPE } from './enums/discount-types';
import { Firm } from './firm';
import { Interlocutor } from './interlocutor';
import { PaymentInvoiceEntry } from './payment';
import { Quotation } from './quotation';
import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';
import { Tax } from './tax';
import { TaxWithholding } from './tax-withholding';
import { Upload } from './upload';
import { ACTIVITY_TYPE } from './enums/activity-type';

export enum INVOICE_STATUS {
  Nonexistent = 'invoice.status.non_existent',
  Draft = 'invoice.status.draft',
  Validated = 'invoice.status.validated',
  Sent = 'invoice.status.sent',
  Paid = 'invoice.status.paid',
  Settled = 'invoice.status.settled',
  PartiallyPaid = 'invoice.status.partially_paid',
  PartiallySettled = 'invoice.status.partially_settled',
  Unpaid = 'invoice.status.unpaid',
  Expired = 'invoice.status.expired'
}

export interface InvoiceTaxEntry extends DatabaseEntity {
  id?: number;
  articleInvoiceEntryId?: number;
  tax?: Tax;
  taxId?: number;
}

export interface ArticleInvoiceEntry extends DatabaseEntity {
  id?: number;
  invoiceId?: number;
  article?: Article;
  articleId?: number;
  unit_price?: number;
  quantity?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  articleInvoiceEntryTaxes?: InvoiceTaxEntry[];
  subTotal?: number;
  total?: number;
}

export interface CreateArticleInvoiceEntry
  extends Omit<
    ArticleInvoiceEntry,
    | 'id'
    | 'invoiceId'
    | 'subTotal'
    | 'total'
    | 'updatedAt'
    | 'createdAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
    | 'articleInvoiceEntryTaxes'
  > {
  taxes?: number[];
}

export interface InvoiceMetaData extends DatabaseEntity {
  id?: number;
  showInvoiceAddress?: boolean;
  showDeliveryAddress?: boolean;
  showArticleDescription?: boolean;
  hasBankingDetails?: boolean;
  hasGeneralConditions?: boolean;
  hasTaxStamp?: boolean;
  taxSummary?: { taxId: number; amount: number }[];
  hasTaxWithholding?: boolean;
}

export interface InvoiceUpload extends DatabaseEntity {
  id?: number;
  invoiceId?: number;
  invoice?: Invoice;
  uploadId?: number;
  upload?: Upload;
}

export interface InvoiceLinkedCreditNote extends DatabaseEntity {
  id?: number;
  sequential?: string;
  reference?: string;
  date?: string;
  status?: string;
}

export interface InvoiceLinkedDocument extends DatabaseEntity {
  id?: number;
  sequential?: string;
  reference?: string;
  date?: string;
  status?: string;
}

export interface Invoice extends DatabaseEntity {
  id?: number;
  activityType?: ACTIVITY_TYPE;
  sequential?: string;
  reference?: string;
  object?: string;
  date?: string;
  dueDate?: string;
  status?: INVOICE_STATUS;
  generalConditions?: string;
  defaultCondition?: boolean;
  total?: number;
  amountPaid?: number;
  amountSettled?: number;
  subTotal?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  currencyId?: number;
  currency?: Currency;
  bankAccountId?: number;
  bankAccount?: Currency;
  firmId?: number;
  firm?: Firm;
  cabinet?: Cabinet;
  cabinetId?: number;
  interlocutorId?: number;
  interlocutor?: Interlocutor;
  notes?: string;
  quotationId?: number;
  quotation?: Quotation;
  customerOrderId?: number;
  customerOrder?: InvoiceLinkedDocument | null;
  deliveryNoteId?: number;
  deliveryNote?: InvoiceLinkedDocument | null;
  articleInvoiceEntries?: ArticleInvoiceEntry[];
  invoiceMetaData?: InvoiceMetaData;
  uploads?: InvoiceUpload[];
  payments?: PaymentInvoiceEntry[];
  creditNotes?: InvoiceLinkedCreditNote[];
  taxStamp?: Tax;
  taxStampId?: number;
  taxWithholding?: TaxWithholding;
  taxWithholdingId?: number;
  taxWithholdingAmount?: number;
}

export interface CreateInvoiceDto
  extends Omit<
    Invoice,
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
  > {
  articleInvoiceEntries?: CreateArticleInvoiceEntry[];
  files?: File[];
}

export interface UpdateInvoiceDto extends CreateInvoiceDto {
  id?: number;
}

export interface UpdateInvoiceSequentialNumber {
  id?: number;
  sequential?: string;
}

export interface DuplicateInvoiceDto {
  id?: number;
  includeFiles?: boolean;
}

export interface PagedInvoice extends PagedResponse<Invoice> {}

export interface InvoiceUploadedFile {
  upload: InvoiceUpload;
  file: File;
}

export interface ResponseInvoiceRangeDto {
  next?: Invoice;
  previous?: Invoice;
}
