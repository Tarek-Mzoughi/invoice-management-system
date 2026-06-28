import { BANK_ACCOUNT_TYPE, BankAccount, Currency } from '@/types';
import { create } from 'zustand';

type BankAccountManager = {
  // data
  id?: number;
  name?: string;
  type?: BANK_ACCOUNT_TYPE;
  agency?: string;
  bic?: string;
  currency?: Currency;
  currencyId?: number;
  rib?: string;
  iban?: string;
  balance?: number;
  isMain?: boolean;
  // methods
  set: (name: keyof BankAccountManager, value: any) => void;
  reset: () => void;
  getBankAccount: () => Partial<BankAccount>;
  setBankAccount: (bankAccount: Partial<BankAccount>) => void;
};

const initialState: Omit<
  BankAccountManager,
  'set' | 'reset' | 'getBankAccount' | 'setBankAccount'
> = {
  id: undefined,
  name: '',
  type: BANK_ACCOUNT_TYPE.BANK,
  agency: '',
  bic: '',
  currency: undefined,
  currencyId: undefined,
  rib: '',
  iban: '',
  balance: 0,
  isMain: false
};

export const useBankAccountManager = create<BankAccountManager>((set, get) => ({
  ...initialState,
  set: (name: keyof BankAccountManager, value: any) =>
    set((state) => ({
      ...state,
      [name]: value
    })),
  reset: () => set({ ...initialState }),
  getBankAccount: () => {
    const data = get();
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      agency: data.agency,
      bic: data.bic,
      currency: data.currency,
      currencyId: data.currencyId ?? data.currency?.id,
      rib: data.rib,
      iban: data.iban,
      balance: data.balance,
      isMain: data.isMain
    };
  },
  setBankAccount: (bankAccount: Partial<BankAccount>) => {
    set((state) => ({
      ...state,
      ...bankAccount
    }));
  }
}));
