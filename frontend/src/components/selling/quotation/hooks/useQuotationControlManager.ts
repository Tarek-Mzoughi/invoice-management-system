import { create } from 'zustand';

export type QuotationControlManager = {
  isBankAccountDetailsHidden: boolean;
  isInvoiceAddressHidden: boolean;
  isDeliveryAddressHidden: boolean;
  isGeneralConditionsHidden: boolean;
  isArticleDescriptionHidden: boolean;
  toggle: (field: keyof QuotationControlManager) => void;
  set: (field: keyof QuotationControlManager, value: boolean) => void;
  setControls: (
    data: Omit<QuotationControlManager, 'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'>
  ) => void;
  getControls: () => Omit<
    QuotationControlManager,
    'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'
  >;
  reset: () => void;
};

export const useQuotationControlManager = create<QuotationControlManager>()((set, get) => ({
  isBankAccountDetailsHidden: false,
  isInvoiceAddressHidden: false,
  isDeliveryAddressHidden: false,
  isGeneralConditionsHidden: false,
  isArticleDescriptionHidden: false,
  toggle: (field: keyof QuotationControlManager) =>
    set((state) => ({ ...state, [field]: !state[field] })),
  set: (field: keyof QuotationControlManager, value: boolean) =>
    set((state) => ({ ...state, [field]: value })),
  setControls: (data: any) => {
    set((state) => ({ ...state, ...data }));
  },
  getControls: () => {
    return get();
  },
  reset: () =>
    set({
      isBankAccountDetailsHidden: false,
      isInvoiceAddressHidden: false,
      isDeliveryAddressHidden: false,
      isGeneralConditionsHidden: false,
      isArticleDescriptionHidden: false
    })
}));
