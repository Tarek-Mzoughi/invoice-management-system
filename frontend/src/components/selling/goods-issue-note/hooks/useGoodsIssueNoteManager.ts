import { api } from '@/api';
import {
  ACTIVITY_TYPE,
  BankAccount,
  Currency,
  Firm,
  Interlocutor,
  PaymentCondition,
  GOODS_ISSUE_NOTE_STATUS,
  GoodsIssueNote,
  GoodsIssueNoteUploadedFile
} from '@/types';
import { DateFormat } from '@/types/enums/date-formats';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { fromStringToSequentialObject } from '@/utils/string.utils';
import { create } from 'zustand';

type GoodsIssueNoteManager = {
  // data
  id?: number;
  sequentialNumber: {
    dateFormat: DateFormat;
    next: number;
    prefix: string;
  };
  sequential: string;
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
  status: GOODS_ISSUE_NOTE_STATUS;
  generalConditions: string;
  vehicleRegistration: string;
  driverName: string;
  uploadedFiles: GoodsIssueNoteUploadedFile[];
  // utility data
  isInterlocutorInFirm: boolean;
  // methods
  setFirm: (firm?: Firm) => void;
  setInterlocutor: (interlocutor?: Interlocutor) => void;
  set: (name: keyof GoodsIssueNoteManager, value: any) => void;
  getGoodsIssueNote: () => Partial<GoodsIssueNoteManager>;
  setGoodsIssueNote: (
    goodsIssueNote: Partial<GoodsIssueNote & { files: GoodsIssueNoteUploadedFile[] }>,
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
  GoodsIssueNoteManager,
  'set' | 'reset' | 'setFirm' | 'setInterlocutor' | 'getGoodsIssueNote' | 'setGoodsIssueNote'
> = {
  id: -1,
  sequentialNumber: {
    prefix: '',
    dateFormat: DateFormat.YYMM,
    next: 0
  },
  sequential: '',
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
  status: GOODS_ISSUE_NOTE_STATUS.Nonexistent,
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

export const useGoodsIssueNoteManager = create<GoodsIssueNoteManager>((set, get) => ({
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
  set: (name: keyof GoodsIssueNoteManager, value: any) => {
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
  getGoodsIssueNote: () => {
    const {
      id,
      sequentialNumber,
      activityType,
      date,
      dueDate,
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
  setGoodsIssueNote: (
    goodsIssueNote: Partial<GoodsIssueNote & { files: GoodsIssueNoteUploadedFile[] }>,
    firms?: Firm[],
    bankAccounts?: BankAccount[]
  ) => {
    set((state) => ({
      ...state,
      id: goodsIssueNote?.id,
      sequentialNumber: fromStringToSequentialObject(goodsIssueNote?.sequential || ''),
      activityType: goodsIssueNote?.activityType || ACTIVITY_TYPE.SELLING,
      date: goodsIssueNote?.date ? new Date(goodsIssueNote?.date) : undefined,
      dueDate: goodsIssueNote?.dueDate ? new Date(goodsIssueNote?.dueDate) : undefined,
      object: goodsIssueNote?.object,
      firm: firms?.find((firm) => goodsIssueNote?.firm?.id === firm.id) || goodsIssueNote?.firm,
      interlocutor: goodsIssueNote?.interlocutor,
      discount: goodsIssueNote?.discount,
      discountType: goodsIssueNote?.discount_type,
      bankAccount: bankAccounts?.find((a) => goodsIssueNote?.bankAccount?.id === a.id) || goodsIssueNote?.bankAccount,
      currency: goodsIssueNote?.currency || goodsIssueNote?.firm?.currency,
      notes: goodsIssueNote?.notes,
      generalConditions: goodsIssueNote?.generalConditions,
      vehicleRegistration: goodsIssueNote?.goodsIssueNoteMetaData?.vehicleRegistration || '',
      driverName: goodsIssueNote?.goodsIssueNoteMetaData?.driverName || '',
      status: goodsIssueNote?.status,
      uploadedFiles: goodsIssueNote?.files || []
    }));
  },
  reset: () => set({ ...initialState })
}));
