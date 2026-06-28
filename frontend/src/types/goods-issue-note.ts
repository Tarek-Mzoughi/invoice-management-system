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

export enum GOODS_ISSUE_NOTE_STATUS {
  Nonexistent = 'goodsIssueNote.status.non_existent',
  Expired = 'goodsIssueNote.status.expired',
  Draft = 'goodsIssueNote.status.draft',
  Created = 'goodsIssueNote.status.created',
  Validated = 'goodsIssueNote.status.validated',
  Sent = 'goodsIssueNote.status.sent',
  Issued = 'goodsIssueNote.status.issued',
  Accepted = 'goodsIssueNote.status.accepted',
  Rejected = 'goodsIssueNote.status.rejected',
  Cancelled = 'goodsIssueNote.status.cancelled',
  Invoiced = 'goodsIssueNote.status.invoiced'
}

export interface GoodsIssueNoteTaxEntry extends DatabaseEntity {
  id?: number;
  articleGoodsIssueNoteEntryId?: number;
  tax?: Tax;
  taxId?: number;
}

export interface ArticleGoodsIssueNoteEntry extends DatabaseEntity {
  id?: number;
  goodsIssueNoteId?: number;
  article?: Article;
  articleId?: number;
  unit_price?: number;
  quantity?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  articleGoodsIssueNoteEntryTaxes?: GoodsIssueNoteTaxEntry[];
  subTotal?: number;
  total?: number;
}

export interface CreateArticleGoodsIssueNoteEntry
  extends Omit<
    ArticleGoodsIssueNoteEntry,
    | 'id'
    | 'goodsIssueNoteId'
    | 'subTotal'
    | 'total'
    | 'updatedAt'
    | 'createdAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
    | 'articleGoodsIssueNoteEntryTaxes'
  > {
  taxes?: number[];
}

export interface GoodsIssueNoteMetaData extends DatabaseEntity {
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

export interface GoodsIssueNoteUpload extends DatabaseEntity {
  id?: number;
  goodsIssueNoteId?: number;
  goodsIssueNote?: GoodsIssueNote;
  uploadId?: number;
  upload?: Upload;
}

export interface GoodsIssueNote extends DatabaseEntity {
  id?: number;
  activityType?: ACTIVITY_TYPE;
  sequential?: string;
  object?: string;
  date?: string;
  dueDate?: string;
  status?: GOODS_ISSUE_NOTE_STATUS;
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
  articleGoodsIssueNoteEntries?: ArticleGoodsIssueNoteEntry[];
  goodsIssueNoteMetaData?: GoodsIssueNoteMetaData;
  uploads?: GoodsIssueNoteUpload[];
  invoices: Invoice[];
  quotationId?: number | null;
  invoiceId?: number | null;
}

export interface CreateGoodsIssueNoteDto
  extends Omit<
    GoodsIssueNote,
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
  articleGoodsIssueNoteEntries?: CreateArticleGoodsIssueNoteEntry[];
  files?: File[];
}

export interface UpdateGoodsIssueNoteDto extends CreateGoodsIssueNoteDto {
  id?: number;
  createInvoice?: boolean;
}

export interface UpdateGoodsIssueNoteSequentialNumber {
  id?: number;
  sequential?: string;
}

export interface DuplicateGoodsIssueNoteDto {
  id?: number;
  includeFiles?: boolean;
}

export interface PagedGoodsIssueNote extends PagedResponse<GoodsIssueNote> {}

export interface GoodsIssueNoteUploadedFile {
  upload: GoodsIssueNoteUpload;
  file: File;
}
