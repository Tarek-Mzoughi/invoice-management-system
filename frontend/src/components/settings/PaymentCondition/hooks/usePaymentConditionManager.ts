import { PaymentCondition } from '@/types';
import { create } from 'zustand';

type PaymentConditionManager = {
  // data
  id?: number;
  label?: string;
  description?: string;
  // methods
  set: (name: keyof PaymentConditionManager, value: any) => void;
  reset: () => void;
  getPaymentCondition: () => Partial<PaymentCondition>;
  setPaymentCondition: (paymentCondition: Partial<PaymentCondition>) => void;
};

const initialState: Omit<
  PaymentConditionManager,
  'set' | 'reset' | 'getPaymentCondition' | 'setPaymentCondition'
> = {
  id: 0,
  label: '',
  description: ''
};

export const usePaymentConditionManager = create<PaymentConditionManager>((set, get) => ({
  ...initialState,
  set: (name: keyof PaymentConditionManager, value: any) =>
    set((state) => ({
      ...state,
      [name]: value
    })),
  reset: () => set({ ...initialState }),
  getPaymentCondition: () => {
    const data = get();
    return {
      id: data.id,
      label: data.label,
      description: data.description
    };
  },
  setPaymentCondition: (paymentCondition: Partial<PaymentCondition>) => {
    set((state) => ({
      ...state,
      ...paymentCondition
    }));
  }
}));
