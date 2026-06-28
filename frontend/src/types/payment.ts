import { Currency } from './currency';
import { Firm } from './firm';
import { Invoice } from './invoice';
import type { PaymentCreditNoteEntry } from './credit-note';
import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';
import { TaxWithholding } from './tax-withholding';
import { Upload } from './upload';
import { ACTIVITY_TYPE } from './enums/activity-type';
import { BankAccount } from './bank-account';

export enum PAYMENT_MODE {
  Cash = 'payment.payment_mode.cash',
  CreditCard = 'payment.payment_mode.credit_card',
  Check = 'payment.payment_mode.check',
  BillOfExchange = 'payment.payment_mode.bill_of_exchange',
  BankTransfer = 'payment.payment_mode.bank_transfer',
  WireTransfer = 'payment.payment_mode.wire_transfer',
  CreditNoteSettlement = 'payment.payment_mode.credit_note_settlement'
}

export enum PAYMENT_COLLECTION_STATUS {
  Pending = 'pending',
  Deposited = 'deposited',
  Paid = 'paid',
  Rejected = 'rejected',
  Cancelled = 'cancelled',
  DepositedSupplier = 'deposited_supplier',
  PaidSupplier = 'paid_supplier'
}

export const NEGOTIABLE_PAYMENT_MODES: PAYMENT_MODE[] = [
  PAYMENT_MODE.Check,
  PAYMENT_MODE.BillOfExchange
];

export interface PaymentUpload extends DatabaseEntity {
  id?: number;
  paymentId?: number;
  payment?: Payment;
  uploadId?: number;
  upload?: Upload;
}

export interface PaymentInvoiceEntry extends DatabaseEntity {
  id?: number;
  invoiceId?: number;
  invoice?: Invoice;
  paymentId?: number;
  payment?: Payment;
  amount?: number;
}

export interface Payment extends DatabaseEntity {
  id?: number;
  activityType?: ACTIVITY_TYPE;
  amount?: number;
  fee?: number;
  convertionRate?: number;
  date?: string;
  mode?: PAYMENT_MODE;
  reference?: string;
  dueDate?: string;
  notes?: string;
  uploads?: PaymentUpload[];
  invoices?: PaymentInvoiceEntry[];
  creditNotes?: PaymentCreditNoteEntry[];
  currency?: Currency;
  currencyId?: number;
  firm?: Firm;
  firmId?: number;
  treasuryAccount?: BankAccount;
  treasuryAccountId?: number;
  originTreasuryAccount?: BankAccount;
  originTreasuryAccountId?: number;
  collectionStatus?: PAYMENT_COLLECTION_STATUS;
  depositedAt?: string;
  paidAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  encashmentMovementId?: number;
  taxWithholding?: TaxWithholding;
  taxWithholdingId?: number;
  taxWithholdingDate?: string;
  taxWithholdingAmount?: number;
}

export interface CreatePaymentDto
  extends Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isDeletionRestricted'> {
  files?: File[];
}

export interface UpdatePaymentDto extends CreatePaymentDto {
  id?: number;
}

export interface PagedPayment extends PagedResponse<Payment> {}

export interface PaymentUploadedFile {
  upload?: PaymentUpload;
  file: File;
}
