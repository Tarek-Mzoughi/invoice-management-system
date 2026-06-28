import { create } from 'zustand';
import { UpdateQuotationSequentialNumber, UpdateSequentialDto } from '@/types';

type SequentialManager = {
  // data
  sellingQuotation?: UpdateQuotationSequentialNumber;
  sellingInvoice?: UpdateQuotationSequentialNumber;
  // methods
  setSequential: (
    attribute: keyof Omit<SequentialManager, 'set' | 'reset' | 'setSequential'>,
    sequencial: UpdateSequentialDto
  ) => void;
  set: (
    attribute: keyof Omit<SequentialManager, 'set' | 'reset' | 'setSequential'>,
    key: keyof UpdateSequentialDto,
    value: any
  ) => void;
  reset: () => void;
};

const initialState: Omit<SequentialManager, 'set' | 'reset' | 'setSequential'> = {
  sellingQuotation: undefined,
  sellingInvoice: undefined
};

export const useSequentialsManager = create<SequentialManager>((set) => ({
  ...initialState,

  setSequential: (
    attribute: keyof Omit<SequentialManager, 'set' | 'reset' | 'setSequential'>,
    sequencial: UpdateSequentialDto
  ) =>
    set((state) => ({
      ...state,
      [attribute]: sequencial
    })),

  set: (
    attribute: keyof Omit<SequentialManager, 'set' | 'reset' | 'setSequential'>,
    key: keyof UpdateSequentialDto,
    value: any
  ) =>
    set((state) => ({
      ...state,
      [attribute]: {
        ...state[attribute],
        [key]: value
      }
    })),

  reset: () => set({ ...initialState })
}));
