import { TaxWithholding } from '@/types';
import { create } from 'zustand';

type TaxWithholdingManager = {
  // data
  id?: number;
  label?: string;
  rate?: number;
  // methods
  set: (name: keyof TaxWithholdingManager, value: any) => void;
  reset: () => void;
  getTax: () => Partial<TaxWithholding>;
  setTax: (paymentCondition: Partial<TaxWithholding>) => void;
};

const initialState: Omit<TaxWithholdingManager, 'set' | 'reset' | 'getTax' | 'setTax'> = {
  id: 0,
  label: '',
  rate: 0
};

export const useTaxWithholdingManager = create<TaxWithholdingManager>((set, get) => ({
  ...initialState,
  set: (name: keyof TaxWithholdingManager, value: any) =>
    set((state) => ({
      ...state,
      [name]: value
    })),
  reset: () => set({ ...initialState }),
  getTax: () => {
    const data = get();
    return {
      id: data.id,
      label: data.label,
      rate: data.rate
    };
  },
  setTax: (tax: Partial<TaxWithholding>) => {
    set((state) => ({
      ...state,
      ...tax
    }));
  }
}));
