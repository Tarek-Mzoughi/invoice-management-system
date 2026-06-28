import { api } from '@/api';
import {
  ACTIVITY_TYPE,
  BankAccount,
  Currency,
  Firm,
  Interlocutor,
  PaymentCondition,
  CUSTOMER_ORDER_STATUS,
  CustomerOrder,
  CustomerOrderUploadedFile
} from '@/types';
import { DateFormat } from '@/types/enums/date-formats';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { fromStringToSequentialObject } from '@/utils/string.utils';
import { create } from 'zustand';

type CustomerOrderManager = {
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
  status: CUSTOMER_ORDER_STATUS;
  generalConditions: string;
  uploadedFiles: CustomerOrderUploadedFile[];
  // utility data
  isInterlocutorInFirm: boolean;
  // methods
  setFirm: (firm?: Firm) => void;
  setInterlocutor: (interlocutor?: Interlocutor) => void;
  set: (name: keyof CustomerOrderManager, value: any) => void;
  getCustomerOrder: () => Partial<CustomerOrderManager>;
  setCustomerOrder: (
    customerOrder: Partial<CustomerOrder & { files: CustomerOrderUploadedFile[] }>,
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
  CustomerOrderManager,
  'set' | 'reset' | 'setFirm' | 'setInterlocutor' | 'getCustomerOrder' | 'setCustomerOrder'
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
  status: CUSTOMER_ORDER_STATUS.Nonexistent,
  generalConditions: '',
  isInterlocutorInFirm: false,
  uploadedFiles: []
};

const getSingleFirmInterlocutor = (firm?: Firm): Interlocutor | undefined => {
  const entry = firm?.interlocutorsToFirm?.[0];
  if (!entry) return api?.interlocutor?.factory() || undefined;

  return entry.interlocutor || ({ id: entry.interlocutorId } as Interlocutor);
};

export const useCustomerOrderManager = create<CustomerOrderManager>((set, get) => ({
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
  set: (name: keyof CustomerOrderManager, value: any) => {
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
  getCustomerOrder: () => {
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
      bankAccountId: bankAccount?.id,
      currencyId: currency?.id,
      uploadedFiles
    };
  },
  setCustomerOrder: (
    customerOrder: Partial<CustomerOrder & { files: CustomerOrderUploadedFile[] }>,
    firms?: Firm[],
    bankAccounts?: BankAccount[]
  ) => {
    set((state) => ({
      ...state,
      id: customerOrder?.id,
      sequentialNumber: fromStringToSequentialObject(customerOrder?.sequential || ''),
      reference: customerOrder?.reference || '',
      activityType: customerOrder?.activityType || ACTIVITY_TYPE.SELLING,
      date: customerOrder?.date ? new Date(customerOrder?.date) : undefined,
      dueDate: customerOrder?.dueDate ? new Date(customerOrder?.dueDate) : undefined,
      object: customerOrder?.object,
      firm: firms?.find((firm) => customerOrder?.firm?.id === firm.id) || customerOrder?.firm,
      interlocutor: customerOrder?.interlocutor,
      discount: customerOrder?.discount,
      discountType: customerOrder?.discount_type,
      bankAccount: bankAccounts?.find((a) => customerOrder?.bankAccount?.id === a.id) || customerOrder?.bankAccount,
      currency: customerOrder?.currency || customerOrder?.firm?.currency,
      notes: customerOrder?.notes,
      generalConditions: customerOrder?.generalConditions,
      status: customerOrder?.status,
      uploadedFiles: customerOrder?.files || []
    }));
  },
  reset: () => set({ ...initialState })
}));
