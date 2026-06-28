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

export enum RETURN_NOTE_STATUS {
  Nonexistent = 'returnNote.status.non_existent',
  Expired = 'returnNote.status.expired',
  Draft = 'returnNote.status.draft',
  Created = 'returnNote.status.created',
  Validated = 'returnNote.status.validated',
  Sent = 'returnNote.status.sent',
  Accepted = 'returnNote.status.accepted',
  Rejected = 'returnNote.status.rejected',
  Cancelled = 'returnNote.status.cancelled',
  Invoiced = 'returnNote.status.invoiced'
}

export interface ReturnNoteTaxEntry extends DatabaseEntity {
  id?: number;
  articleReturnNoteEntryId?: number;
  tax?: Tax;
  taxId?: number;
}

export interface ArticleReturnNoteEntry extends DatabaseEntity {
  id?: number;
  returnNoteId?: number;
  article?: Article;
  articleId?: number;
  unit_price?: number;
  quantity?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  articleReturnNoteEntryTaxes?: ReturnNoteTaxEntry[];
  subTotal?: number;
  total?: number;
}

export interface CreateArticleReturnNoteEntry
  extends Omit<
    ArticleReturnNoteEntry,
    | 'id'
    | 'returnNoteId'
    | 'subTotal'
    | 'total'
    | 'updatedAt'
    | 'createdAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
    | 'articleReturnNoteEntryTaxes'
  > {
  taxes?: number[];
}

export interface ReturnNoteMetaData extends DatabaseEntity {
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

export interface ReturnNoteUpload extends DatabaseEntity {
  id?: number;
  returnNoteId?: number;
  returnNote?: ReturnNote;
  uploadId?: number;
  upload?: Upload;
}

export interface ReturnNote extends DatabaseEntity {
  id?: number;
  activityType?: ACTIVITY_TYPE;
  sourceDeliveryNoteId?: number | null;
  sequential?: string;
  reference?: string;
  object?: string;
  date?: string;
  dueDate?: string;
  status?: RETURN_NOTE_STATUS;
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
  articleReturnNoteEntries?: ArticleReturnNoteEntry[];
  returnNoteMetaData?: ReturnNoteMetaData;
  uploads?: ReturnNoteUpload[];
  invoices: Invoice[];
}

export interface CreateReturnNoteDto
  extends Omit<
    ReturnNote,
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
  articleReturnNoteEntries?: CreateArticleReturnNoteEntry[];
  files?: File[];
}

export interface UpdateReturnNoteDto extends CreateReturnNoteDto {
  id?: number;
  createInvoice?: boolean;
}

export interface UpdateReturnNoteSequentialNumber {
  id?: number;
  sequential?: string;
}

export interface DuplicateReturnNoteDto {
  id?: number;
  includeFiles?: boolean;
}

export interface PagedReturnNote extends PagedResponse<ReturnNote> {}

export interface ReturnNoteUploadedFile {
  upload: ReturnNoteUpload;
  file: File;
}
