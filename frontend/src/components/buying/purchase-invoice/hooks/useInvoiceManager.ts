import { api } from '@/api';
import {
  ACTIVITY_TYPE,
  BankAccount,
  Currency,
  Firm,
  INVOICE_STATUS,
  Interlocutor,
  Invoice,
  InvoiceUploadedFile,
  PaymentCondition
} from '@/types';
import { DateFormat } from '@/types/enums/date-formats';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { fromStringToSequentialObject } from '@/utils/string.utils';
import { create } from 'zustand';

type InvoiceManager = {
  // data
  id?: number;
  sequentialNumber: {
    dateFormat: DateFormat;
    next: number;
    prefix: string;
  };
  sequential: string;
  activityType: ACTIVITY_TYPE;
  reference: string;
  date: Date | undefined;
  dueDate: Date | undefined;
  object: string;
  firm?: Firm;
  interlocutor?: Interlocutor;
  subTotal: number;
  total: number;
  amountPaid: number;
  amountSettled: number;
  discount: number;
  discountType: DISCOUNT_TYPE;
  bankAccount?: BankAccount;
  currency?: Currency;
  notes: string;
  status: INVOICE_STATUS;
  generalConditions: string;
  uploadedFiles: InvoiceUploadedFile[];
  quotationId?: number;
  taxStampId?: number;
  taxWithholdingId?: number;
  taxWithholdingAmount?: number;
  // utility data
  isInterlocutorInFirm: boolean;
  // methods
  setFirm: (firm?: Firm) => void;
  setInterlocutor: (interlocutor?: Interlocutor) => void;
  set: (name: keyof InvoiceManager, value: any) => void;
  getInvoice: () => Partial<InvoiceManager>;
  setInvoice: (
    invoice: Partial<Invoice & { files: InvoiceUploadedFile[] }>,
    firms: Firm[],
    bankAccounts: BankAccount[]
  ) => void;
  reset: () => void;
};

const getDateRangeAccordingToPaymentConditions = (paymentCondition: PaymentCondition) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  if (!paymentCondition) return { date: undefined, dueDate: undefined };

  switch (paymentCondition.id) {
    case 1:
      return { date: today, dueDate: today };
    case 2:
      return { date: today, dueDate: new Date(year, month + 1, 0) }; // End of current month
    case 3:
      return { date: today, dueDate: new Date(year, month + 2, 0) }; // End of next month
    case 4:
      return { date: today, dueDate: undefined };
    default:
      return { date: undefined, dueDate: undefined };
  }
};

const initialState: Omit<
  InvoiceManager,
  'set' | 'reset' | 'setFirm' | 'setInterlocutor' | 'getInvoice' | 'setInvoice'
> = {
  id: undefined,
  sequentialNumber: {
    prefix: '',
    dateFormat: DateFormat.YYYYMM,
    next: 0
  },
  sequential: '',
  activityType: ACTIVITY_TYPE.SELLING,
  reference: '',
  date: undefined,
  dueDate: undefined,
  object: '',
  firm: api?.firm?.factory() || undefined,
  interlocutor: api?.interlocutor?.factory() || undefined,
  subTotal: 0,
  total: 0,
  amountPaid: 0,
  amountSettled: 0,
  discount: 0,
  discountType: DISCOUNT_TYPE.PERCENTAGE,
  bankAccount: api?.bankAccount?.factory() || undefined,
  currency: api?.currency?.factory() || undefined,
  notes: '',
  status: INVOICE_STATUS.Nonexistent,
  generalConditions: '',
  isInterlocutorInFirm: false,
  uploadedFiles: [],
  quotationId: undefined,
  taxStampId: undefined,
  taxWithholdingId: undefined,
  taxWithholdingAmount: 0
};

const getSingleFirmInterlocutor = (firm?: Firm): Interlocutor | undefined => {
  const entry = firm?.interlocutorsToFirm?.[0];
  if (!entry) return api?.interlocutor?.factory() || undefined;

  return entry.interlocutor || ({ id: entry.interlocutorId } as Interlocutor);
};

export const useInvoiceManager = create<InvoiceManager>((set, get) => ({
  ...initialState,
  setFirm: (firm?: Firm) => {
    const dateRange = firm?.paymentCondition
      ? getDateRangeAccordingToPaymentConditions(firm.paymentCondition)
      : { date: undefined, dueDate: undefined };

    set((state) => ({
      ...state,
      firm,
      interlocutor:
        firm?.interlocutorsToFirm?.length === 1
          ? getSingleFirmInterlocutor(firm)
          : api?.interlocutor?.factory() || undefined,
      isInterlocutorInFirm: !!firm?.interlocutorsToFirm?.length,
      date: dateRange.date,
      dueDate: dateRange.dueDate
    }));
  },
  setInterlocutor: (interlocutor?: Interlocutor) =>
    set((state) => ({
      ...state,
      interlocutor,
      isInterlocutorInFirm: true
    })),
  set: (name: keyof InvoiceManager, value: any) => {
    if (name === 'date' || name === 'dueDate') {
      const dateValue = typeof value === 'string' ? new Date(value) : value;
      set((state) => ({
        ...state,
        [name]: dateValue
      }));
    } else {
      set((state) => ({
        ...state,
        [name]: value
      }));
    }
  },
  getInvoice: () => {
    const {
      id,
      sequentialNumber,
      activityType,
      reference,
      date,
      dueDate,
      object,
      firm,
      interlocutor,
      discount,
      discountType,
      notes,
      generalConditions,
      bankAccount,
      currency,
      uploadedFiles,
      taxStampId,
      taxWithholdingId,
      ...rest
    } = get();

    return {
      id,
      sequentialNumber,
      activityType,
      reference,
      date,
      dueDate,
      object,
      firmId: firm?.id,
      interlocutorId: interlocutor?.id,
      discount,
      discountType,
      notes,
      generalConditions,
      bankAccountId: bankAccount?.id,
      currencyId: currency?.id,
      uploadedFiles,
      taxStampId,
      taxWithholdingId
    };
  },
  setInvoice: (
    invoice: Partial<Invoice & { files: InvoiceUploadedFile[] }>,
    firms: Firm[],
    bankAccounts: BankAccount[]
  ) => {
    set((state) => ({
      ...state,
      id: invoice?.id,
      sequentialNumber: fromStringToSequentialObject(invoice?.sequential || ''),
      activityType: invoice?.activityType || ACTIVITY_TYPE.SELLING,
      reference: invoice?.reference || '',
      date: invoice?.date ? new Date(invoice?.date) : undefined,
      dueDate: invoice?.dueDate ? new Date(invoice?.dueDate) : undefined,
      object: invoice?.object,
      firm: firms?.find((firm) => invoice?.firm?.id === firm.id) || invoice?.firm,
      interlocutor: invoice?.interlocutor,
      discount: invoice?.discount,
      discountType: invoice?.discount_type,
      bankAccount: bankAccounts?.find((a) => invoice?.bankAccount?.id === a.id) || invoice?.bankAccount || bankAccounts?.find((a) => a.isMain),
      currency: invoice?.currency || invoice?.firm?.currency,
      notes: invoice?.notes,
      generalConditions: invoice?.generalConditions,
      status: invoice?.status,
      uploadedFiles: invoice?.files || [],
      quotationId: invoice?.quotationId,
      taxStampId: invoice?.taxStampId,
      amountPaid: invoice?.amountPaid,
      amountSettled: invoice?.amountSettled,
      taxWithholdingId: invoice?.taxWithholdingId,
      taxWithholdingAmount: invoice?.taxWithholdingAmount
    }));
  },
  reset: () => set({ ...initialState })
}));
