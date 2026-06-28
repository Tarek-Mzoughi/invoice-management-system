import { api } from '@/api';
import {
  ACTIVITY_TYPE,
  BankAccount,
  Currency,
  Firm,
  CREDIT_NOTE_STATUS,
  Interlocutor,
  CreditNote,
  CreditNoteUploadedFile,
  PaymentCondition
} from '@/types';
import { DateFormat } from '@/types/enums/date-formats';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { fromStringToSequentialObject } from '@/utils/string.utils';
import { create } from 'zustand';

type CreditNoteManager = {
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
  discount: number;
  discountType: DISCOUNT_TYPE;
  bankAccount?: BankAccount;
  currency?: Currency;
  notes: string;
  status: CREDIT_NOTE_STATUS;
  generalConditions: string;
  uploadedFiles: CreditNoteUploadedFile[];
  quotationId?: number;
  taxStampId?: number;
  taxWithholdingId?: number;
  taxWithholdingAmount?: number;
  // utility data
  isInterlocutorInFirm: boolean;
  // methods
  setFirm: (firm?: Firm) => void;
  setInterlocutor: (interlocutor?: Interlocutor) => void;
  set: (name: keyof CreditNoteManager, value: any) => void;
  getCreditNote: () => Partial<CreditNoteManager>;
  setCreditNote: (
    creditNote: Partial<CreditNote & { files: CreditNoteUploadedFile[] }>,
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
  CreditNoteManager,
  'set' | 'reset' | 'setFirm' | 'setInterlocutor' | 'getCreditNote' | 'setCreditNote'
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
  discount: 0,
  discountType: DISCOUNT_TYPE.PERCENTAGE,
  bankAccount: api?.bankAccount?.factory() || undefined,
  currency: api?.currency?.factory() || undefined,
  notes: '',
  status: CREDIT_NOTE_STATUS.Nonexistent,
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

export const useCreditNoteManager = create<CreditNoteManager>((set, get) => ({
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
  set: (name: keyof CreditNoteManager, value: any) => {
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
  getCreditNote: () => {
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
  setCreditNote: (
    creditNote: Partial<CreditNote & { files: CreditNoteUploadedFile[] }>,
    firms: Firm[],
    bankAccounts: BankAccount[]
  ) => {
    set((state) => ({
      ...state,
      id: creditNote?.id,
      sequentialNumber: fromStringToSequentialObject(creditNote?.sequential || ''),
      activityType: creditNote?.activityType || ACTIVITY_TYPE.SELLING,
      reference: creditNote?.reference || '',
      date: creditNote?.date ? new Date(creditNote?.date) : undefined,
      dueDate: creditNote?.dueDate ? new Date(creditNote?.dueDate) : undefined,
      object: creditNote?.object,
      firm: firms?.find((firm) => creditNote?.firm?.id === firm.id) || creditNote?.firm,
      interlocutor: creditNote?.interlocutor,
      discount: creditNote?.discount,
      discountType: creditNote?.discount_type,
      bankAccount: bankAccounts?.find((a) => creditNote?.bankAccount?.id === a.id) || creditNote?.bankAccount || bankAccounts?.find((a) => a.isMain),
      currency: creditNote?.currency || creditNote?.firm?.currency,
      notes: creditNote?.notes,
      generalConditions: creditNote?.generalConditions,
      status: creditNote?.status,
      uploadedFiles: creditNote?.files || [],
      quotationId: creditNote?.quotationId ?? undefined,
      taxStampId: creditNote?.taxStampId ?? undefined,
      amountPaid: creditNote?.amountPaid,
      taxWithholdingId: creditNote?.taxWithholdingId ?? undefined,
      taxWithholdingAmount: creditNote?.taxWithholdingAmount
    }));
  },
  reset: () => set({ ...initialState })
}));
