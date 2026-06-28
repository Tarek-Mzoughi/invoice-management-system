import { create } from 'zustand';

export type InvoiceControlManager = {
  isBankAccountDetailsHidden: boolean;
  isInvoiceAddressHidden: boolean;
  isDeliveryAddressHidden: boolean;
  isGeneralConditionsHidden: boolean;
  isArticleDescriptionHidden: boolean;
  isTaxStampHidden: boolean;
  isTaxWithholdingHidden: boolean;
  toggle: (field: keyof InvoiceControlManager) => void;
  set: (field: keyof InvoiceControlManager, value: boolean) => void;
  setControls: (
    data: Omit<InvoiceControlManager, 'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'>
  ) => void;
  getControls: () => Omit<
    InvoiceControlManager,
    'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'
  >;
  reset: () => void;
};

export const useInvoiceControlManager = create<InvoiceControlManager>()((set, get) => ({
  isBankAccountDetailsHidden: false,
  isInvoiceAddressHidden: false,
  isDeliveryAddressHidden: false,
  isGeneralConditionsHidden: false,
  isArticleDescriptionHidden: false,
  isTaxStampHidden: false,
  isTaxWithholdingHidden: true,
  toggle: (field: keyof InvoiceControlManager) =>
    set((state) => ({ ...state, [field]: !state[field] })),
  set: (field: keyof InvoiceControlManager, value: boolean) =>
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
      isArticleDescriptionHidden: false,
      isTaxStampHidden: false,
      isTaxWithholdingHidden: true
    })
}));
