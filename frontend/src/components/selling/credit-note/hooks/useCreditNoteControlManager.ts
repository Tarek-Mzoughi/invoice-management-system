import { create } from 'zustand';

export type CreditNoteControlManager = {
  isBankAccountDetailsHidden: boolean;
  isCreditNoteAddressHidden: boolean;
  isDeliveryAddressHidden: boolean;
  isGeneralConditionsHidden: boolean;
  isArticleDescriptionHidden: boolean;
  isPricesHidden: boolean;
  isTaxStampHidden: boolean;
  isTaxWithholdingHidden: boolean;
  toggle: (field: keyof CreditNoteControlManager) => void;
  set: (field: keyof CreditNoteControlManager, value: boolean) => void;
  setControls: (
    data: Omit<CreditNoteControlManager, 'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'>
  ) => void;
  getControls: () => Omit<
    CreditNoteControlManager,
    'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'
  >;
  reset: () => void;
};

export const useCreditNoteControlManager = create<CreditNoteControlManager>()((set, get) => ({
  isBankAccountDetailsHidden: false,
  isCreditNoteAddressHidden: false,
  isDeliveryAddressHidden: false,
  isGeneralConditionsHidden: false,
  isArticleDescriptionHidden: false,
  isPricesHidden: false,
  isTaxStampHidden: false,
  isTaxWithholdingHidden: true,
  toggle: (field: keyof CreditNoteControlManager) =>
    set((state) => ({ ...state, [field]: !state[field] })),
  set: (field: keyof CreditNoteControlManager, value: boolean) =>
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
      isCreditNoteAddressHidden: false,
      isDeliveryAddressHidden: false,
      isGeneralConditionsHidden: false,
      isArticleDescriptionHidden: false,
      isPricesHidden: false,
      isTaxStampHidden: false,
      isTaxWithholdingHidden: true
    })
}));
