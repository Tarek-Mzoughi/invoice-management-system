import { Article } from './article';
import { BankAccount } from './bank-account';
import { Cabinet } from './cabinet';
import { Currency } from './currency';
import { DISCOUNT_TYPE } from './enums/discount-types';
import { Firm } from './firm';
import { Interlocutor } from './interlocutor';
import { Invoice } from './invoice';
import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';
import { Tax } from './tax';
import { Upload } from './upload';
import { ACTIVITY_TYPE } from './enums/activity-type';

export enum QUOTATION_STATUS {
  Nonexistent = 'quotation.status.non_existent',
  Expired = 'quotation.status.expired',
  Draft = 'quotation.status.draft',
  Created = 'quotation.status.created',
  Validated = 'quotation.status.validated',
  Sent = 'quotation.status.sent',
  Accepted = 'quotation.status.accepted',
  Rejected = 'quotation.status.rejected',
  Invoiced = 'quotation.status.invoiced',
  Ordered = 'quotation.status.ordered',
  Delivered = 'quotation.status.delivered',
  CreditNoted = 'quotation.status.credit_noted'
}

export interface QuotationTaxEntry extends DatabaseEntity {
  id?: number;
  articleQuotationEntryId?: number;
  tax?: Tax;
  taxId?: number;
}

export interface ArticleQuotationEntry extends DatabaseEntity {
  id?: number;
  quotationId?: number;
  article?: Article;
  articleId?: number;
  unit_price?: number;
  quantity?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  articleQuotationEntryTaxes?: QuotationTaxEntry[];
  subTotal?: number;
  total?: number;
}

export interface CreateArticleQuotationEntry
  extends Omit<
    ArticleQuotationEntry,
    | 'id'
    | 'quotationId'
    | 'subTotal'
    | 'total'
    | 'updatedAt'
    | 'createdAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
    | 'articleQuotationEntryTaxes'
  > {
  taxes?: number[];
}

export interface QuotationMetaData extends DatabaseEntity {
  id?: number;
  showInvoiceAddress?: boolean;
  showDeliveryAddress?: boolean;
  showArticleDescription?: boolean;
  hasBankingDetails?: boolean;
  hasGeneralConditions?: boolean;
  taxSummary?: { taxId: number; amount: number }[];
}

export interface QuotationUpload extends DatabaseEntity {
  id?: number;
  quotationId?: number;
  quotation?: Quotation;
  uploadId?: number;
  upload?: Upload;
}

export interface Quotation extends DatabaseEntity {
  id?: number;
  activityType?: ACTIVITY_TYPE;
  sequential?: string;
  object?: string;
  date?: string;
  dueDate?: string;
  status?: QUOTATION_STATUS;
  generalConditions?: string;
  defaultCondition?: boolean;
  total?: number;
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
  articleQuotationEntries?: ArticleQuotationEntry[];
  quotationMetaData?: QuotationMetaData;
  uploads?: QuotationUpload[];
  invoices: Invoice[];
  deliveryNotes?: import('./delivery-note').DeliveryNote[];
  customerOrders?: import('./customer-order').CustomerOrder[];
}

export interface CreateQuotationDto
  extends Omit<
    Quotation,
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
  articleQuotationEntries?: CreateArticleQuotationEntry[];
  files?: File[];
}

export interface UpdateQuotationDto extends CreateQuotationDto {
  id?: number;
  createInvoice?: boolean;
}

export interface UpdateQuotationSequentialNumber {
  id?: number;
  sequential?: string;
}

export interface DuplicateQuotationDto {
  id?: number;
  includeFiles?: boolean;
}

export interface PagedQuotation extends PagedResponse<Quotation> {}

export interface QuotationUploadedFile {
  upload: QuotationUpload;
  file: File;
}
