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
import { ReturnNote } from './return-note';

export enum DELIVERY_NOTE_STATUS {
  Draft = 'deliveryNote.status.draft',
  Created = 'deliveryNote.status.created',
  Delivered = 'deliveryNote.status.delivered',
  Cancelled = 'deliveryNote.status.cancelled'
}

export interface DeliveryNoteTaxEntry extends DatabaseEntity {
  id?: number;
  articleDeliveryNoteEntryId?: number;
  tax?: Tax;
  taxId?: number;
}

export interface ArticleDeliveryNoteEntry extends DatabaseEntity {
  id?: number;
  deliveryNoteId?: number;
  article?: Article;
  articleId?: number;
  unit_price?: number;
  quantity?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  articleDeliveryNoteEntryTaxes?: DeliveryNoteTaxEntry[];
  subTotal?: number;
  total?: number;
}

export interface CreateArticleDeliveryNoteEntry
  extends Omit<
    ArticleDeliveryNoteEntry,
    | 'id'
    | 'deliveryNoteId'
    | 'subTotal'
    | 'total'
    | 'updatedAt'
    | 'createdAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
    | 'articleDeliveryNoteEntryTaxes'
  > {
  taxes?: number[];
}

export interface DeliveryNoteMetaData extends DatabaseEntity {
  id?: number;
  showInvoiceAddress?: boolean;
  showDeliveryAddress?: boolean;
  showArticleDescription?: boolean;
  showPrices?: boolean;
  hasBankingDetails?: boolean;
  hasGeneralConditions?: boolean;
  vehicleRegistration?: string;
  driverName?: string;
  taxSummary?: { taxId: number; amount: number }[];
}

export interface DeliveryNoteUpload extends DatabaseEntity {
  id?: number;
  deliveryNoteId?: number;
  deliveryNote?: DeliveryNote;
  uploadId?: number;
  upload?: Upload;
}

export interface DeliveryNote extends DatabaseEntity {
  id?: number;
  activityType?: ACTIVITY_TYPE;
  sequential?: string;
  reference?: string;
  object?: string;
  date?: string;
  dueDate?: string;
  status?: DELIVERY_NOTE_STATUS;
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
  articleDeliveryNoteEntries?: ArticleDeliveryNoteEntry[];
  deliveryNoteMetaData?: DeliveryNoteMetaData;
  uploads?: DeliveryNoteUpload[];
  invoices: Invoice[];
  returnNotes?: ReturnNote[];
  quotationId?: number | null;
  customerOrderId?: number | null;
  customerOrder?: import('./customer-order').CustomerOrder | null;
  invoiceId?: number | null;
}

export interface CreateDeliveryNoteDto
  extends Omit<
    DeliveryNote,
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
  articleDeliveryNoteEntries?: CreateArticleDeliveryNoteEntry[];
  files?: File[];
}

export interface UpdateDeliveryNoteDto extends CreateDeliveryNoteDto {
  id?: number;
  createInvoice?: boolean;
}

export interface UpdateDeliveryNoteSequentialNumber {
  id?: number;
  sequential?: string;
}

export interface DuplicateDeliveryNoteDto {
  id?: number;
  includeFiles?: boolean;
}

export interface PagedDeliveryNote extends PagedResponse<DeliveryNote> {}

export interface DeliveryNoteUploadedFile {
  upload: DeliveryNoteUpload;
  file: File;
}
