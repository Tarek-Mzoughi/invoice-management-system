import { Tax } from '@/types';
import _ from 'lodash';
import { create } from 'zustand';

interface TaxManagerData {
  // Snapshot
  snapshot?: Partial<Tax>;
  // Data
  id?: number;
  label?: string;
  value?: number;
  isRate?: boolean;
  isSpecial?: boolean;
  specificCurrency?: boolean;
  currencyId?: number | null;
  errors?: Record<string, string>;
}

export interface TaxManager extends TaxManagerData {
  set: (name: keyof TaxManagerData, value: any) => void;
  reset: () => void;
  getTax: () => Partial<Tax>;
  setTax: (tax: Partial<Tax>) => void;
  isChanged: () => boolean;
}

const initialState: TaxManagerData = {
  id: 0,
  label: '',
  value: 0,
  isRate: true,
  isSpecial: false,
  currencyId: null,
  specificCurrency: false,
  errors: {}
};

const getNormalizedTax = (data: Partial<TaxManagerData>): Partial<Tax> => {
  return {
    id: data.id,
    label: data.label,
    value: data.value,
    isRate: data.isRate,
    isSpecial: data.isSpecial,
    currencyId: data.currencyId
  };
};

export const useTaxManager = create<TaxManager>((set, get) => ({
  ...initialState,
  set: (name, value) => {
    set((state) => ({
      ...state,
      [name]: value
    }));
  },
  reset: () => set({ ...initialState }),
  getTax: () => {
    const data = get();
    return getNormalizedTax(data);
  },
  setTax: (tax) => {
    set((state) => ({
      ...state,
      ...tax,
      specificCurrency: tax.currencyId != null,
      snapshot: getNormalizedTax(tax)
    }));
  },
  isChanged: () => {
    const state = get();
    return !_.isEqual(getNormalizedTax(state), state.snapshot || {});
  }
}));
