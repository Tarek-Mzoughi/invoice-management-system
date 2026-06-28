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

export enum CUSTOMER_ORDER_STATUS {
  Nonexistent = 'customerOrder.status.non_existent',
  Draft = 'customerOrder.status.draft',
  Created = 'customerOrder.status.created',
  Validated = 'customerOrder.status.validated',
  Cancelled = 'customerOrder.status.cancelled',
  Invoiced = 'customerOrder.status.invoiced',
  Delivered = 'customerOrder.status.delivered'
}

export interface CustomerOrderTaxEntry extends DatabaseEntity {
  id?: number;
  articleCustomerOrderEntryId?: number;
  tax?: Tax;
  taxId?: number;
}

export interface ArticleCustomerOrderEntry extends DatabaseEntity {
  id?: number;
  customerOrderId?: number;
  article?: Article;
  articleId?: number;
  unit_price?: number;
  quantity?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  articleCustomerOrderEntryTaxes?: CustomerOrderTaxEntry[];
  subTotal?: number;
  total?: number;
}

export interface CreateArticleCustomerOrderEntry
  extends Omit<
    ArticleCustomerOrderEntry,
    | 'id'
    | 'customerOrderId'
    | 'subTotal'
    | 'total'
    | 'updatedAt'
    | 'createdAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
    | 'articleCustomerOrderEntryTaxes'
  > {
  taxes?: number[];
}

export interface CustomerOrderMetaData extends DatabaseEntity {
  id?: number;
  showInvoiceAddress?: boolean;
  showDeliveryAddress?: boolean;
  showArticleDescription?: boolean;
  hasBankingDetails?: boolean;
  hasGeneralConditions?: boolean;
  taxSummary?: { taxId: number; amount: number }[];
}

export interface CustomerOrderUpload extends DatabaseEntity {
  id?: number;
  customerOrderId?: number;
  customerOrder?: CustomerOrder;
  uploadId?: number;
  upload?: Upload;
}

export interface CustomerOrder extends DatabaseEntity {
  id?: number;
  activityType?: ACTIVITY_TYPE;
  sequential?: string;
  reference?: string;
  object?: string;
  date?: string;
  dueDate?: string;
  status?: CUSTOMER_ORDER_STATUS;
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
  articleCustomerOrderEntries?: ArticleCustomerOrderEntry[];
  customerOrderMetaData?: CustomerOrderMetaData;
  uploads?: CustomerOrderUpload[];
  invoices: Invoice[];
  deliveryNotes?: import('./delivery-note').DeliveryNote[];
}

export interface CreateCustomerOrderDto
  extends Omit<
    CustomerOrder,
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
  articleCustomerOrderEntries?: CreateArticleCustomerOrderEntry[];
  files?: File[];
}

export interface UpdateCustomerOrderDto extends CreateCustomerOrderDto {
  id?: number;
  createInvoice?: boolean;
}

export interface UpdateCustomerOrderSequentialNumber {
  id?: number;
  sequential?: string;
}

export interface DuplicateCustomerOrderDto {
  id?: number;
  includeFiles?: boolean;
}

export interface PagedCustomerOrder extends PagedResponse<CustomerOrder> {}

export interface CustomerOrderUploadedFile {
  upload: CustomerOrderUpload;
  file: File;
}
