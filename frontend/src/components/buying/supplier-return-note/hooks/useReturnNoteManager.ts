import { api } from '@/api';
import {
  ACTIVITY_TYPE,
  BankAccount,
  Currency,
  Firm,
  Interlocutor,
  PaymentCondition,
  RETURN_NOTE_STATUS,
  ReturnNote,
  ReturnNoteUploadedFile
} from '@/types';
import { DateFormat } from '@/types/enums/date-formats';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { fromStringToSequentialObject } from '@/utils/string.utils';
import { create } from 'zustand';

type ReturnNoteManager = {
  // data
  id?: number;
  sequentialNumber: {
    dateFormat: DateFormat;
    next: number;
    prefix: string;
  };
  sequential: string;
  reference: string;
  activityType: ACTIVITY_TYPE;
  date: Date | undefined;
  dueDate: Date | undefined;
  object: string;
  firm?: Firm;
  interlocutor?: Interlocutor;
  subTotal: number;
  total: number;
  discount: number;
  discountType: DISCOUNT_TYPE;
  bankAccount?: BankAccount;
  currency?: Currency;
  notes: string;
  status: RETURN_NOTE_STATUS;
  generalConditions: string;
  vehicleRegistration: string;
  driverName: string;
  uploadedFiles: ReturnNoteUploadedFile[];
  // utility data
  isInterlocutorInFirm: boolean;
  // methods
  setFirm: (firm?: Firm) => void;
  setInterlocutor: (interlocutor?: Interlocutor) => void;
  set: (name: keyof ReturnNoteManager, value: any) => void;
  getReturnNote: () => Partial<ReturnNoteManager>;
  setReturnNote: (
    returnNote: Partial<ReturnNote & { files: ReturnNoteUploadedFile[] }>,
    firms?: Firm[],
    bankAccounts?: BankAccount[]
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
  ReturnNoteManager,
  'set' | 'reset' | 'setFirm' | 'setInterlocutor' | 'getReturnNote' | 'setReturnNote'
> = {
  id: -1,
  sequentialNumber: {
    prefix: '',
    dateFormat: DateFormat.YYMM,
    next: 0
  },
  sequential: '',
  reference: '',
  activityType: ACTIVITY_TYPE.SELLING,
  date: undefined,
  dueDate: undefined,
  object: '',
  firm: api?.firm?.factory() || undefined,
  interlocutor: api?.interlocutor?.factory() || undefined,
  subTotal: 0,
  total: 0,
  discount: 0,
  discountType: DISCOUNT_TYPE.PERCENTAGE,
  bankAccount: api?.bankAccount?.factory() || undefined,
  currency: api?.currency?.factory() || undefined,
  notes: '',
  status: RETURN_NOTE_STATUS.Nonexistent,
  generalConditions: '',
  vehicleRegistration: '',
  driverName: '',
  isInterlocutorInFirm: false,
  uploadedFiles: []
};

const getSingleFirmInterlocutor = (firm?: Firm): Interlocutor | undefined => {
  const entry = firm?.interlocutorsToFirm?.[0];
  if (!entry) return api?.interlocutor?.factory() || undefined;

  return entry.interlocutor || ({ id: entry.interlocutorId } as Interlocutor);
};

export const useReturnNoteManager = create<ReturnNoteManager>((set, get) => ({
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
  set: (name: keyof ReturnNoteManager, value: any) => {
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
  getReturnNote: () => {
    const {
      id,
      sequentialNumber,
      activityType,
      date,
      dueDate,
      reference,
      object,
      firm,
      interlocutor,
      discount,
      discountType,
      notes,
      generalConditions,
      vehicleRegistration,
      driverName,
      bankAccount,
      currency,
      uploadedFiles,
      ...rest
    } = get();

    return {
      id,
      sequentialNumber,
      activityType,
      date,
      dueDate,
      reference,
      object,
      firmId: firm?.id,
      interlocutorId: interlocutor?.id,
      discount,
      discountType,
      notes,
      generalConditions,
      vehicleRegistration,
      driverName,
      bankAccountId: bankAccount?.id,
      currencyId: currency?.id,
      uploadedFiles
    };
  },
  setReturnNote: (
    returnNote: Partial<ReturnNote & { files: ReturnNoteUploadedFile[] }>,
    firms?: Firm[],
    bankAccounts?: BankAccount[]
  ) => {
    set((state) => ({
      ...state,
      id: returnNote?.id,
      sequentialNumber: fromStringToSequentialObject(returnNote?.sequential || ''),
      reference: returnNote?.reference || '',
      activityType: returnNote?.activityType || ACTIVITY_TYPE.SELLING,
      date: returnNote?.date ? new Date(returnNote?.date) : undefined,
      dueDate: returnNote?.dueDate ? new Date(returnNote?.dueDate) : undefined,
      object: returnNote?.object,
      firm: firms?.find((firm) => returnNote?.firm?.id === firm.id) || returnNote?.firm,
      interlocutor: returnNote?.interlocutor,
      discount: returnNote?.discount,
      discountType: returnNote?.discount_type,
      bankAccount: bankAccounts?.find((a) => returnNote?.bankAccount?.id === a.id) || returnNote?.bankAccount,
      currency: returnNote?.currency || returnNote?.firm?.currency,
      notes: returnNote?.notes,
      generalConditions: returnNote?.generalConditions,
      vehicleRegistration: returnNote?.returnNoteMetaData?.vehicleRegistration || '',
      driverName: returnNote?.returnNoteMetaData?.driverName || '',
      status: returnNote?.status,
      uploadedFiles: returnNote?.files || []
    }));
  },
  reset: () => set({ ...initialState })
}));
